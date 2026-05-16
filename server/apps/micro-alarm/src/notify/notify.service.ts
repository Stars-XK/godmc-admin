import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SysConfigEntity } from '@app/common';
import axios from 'axios';

export interface AlarmNotification {
  ruleId: number;
  ruleName: string;
  alarmLevel: string;
  alarmContent: string;
  alarmSource: string;
  alarmTime: Date;
  status: string;
}

@Injectable()
export class NotifyService {
  private readonly logger = new Logger(NotifyService.name);

  constructor(
    @InjectRepository(SysConfigEntity)
    private readonly sysConfigRep: Repository<SysConfigEntity>,
  ) {}

  /**
   * 发送报警通知（根据配置并行执行多种通知方式）
   */
  async sendAlarmNotification(alarm: AlarmNotification) {
    const results = await Promise.allSettled([
      this.sendWebhook(alarm),
      this.sendEmail(alarm),
      this.sendSms(alarm),
    ]);

    let webhookSent = false;
    let emailSent = false;
    let smsSent = false;

    if (results[0].status === 'fulfilled') webhookSent = results[0].value;
    if (results[1].status === 'fulfilled') emailSent = results[1].value;
    if (results[2].status === 'fulfilled') smsSent = results[2].value;

    if (webhookSent || emailSent || smsSent) {
      this.logger.log(`报警通知已发送: rule=${alarm.ruleName}, source=${alarm.alarmSource}, webhook=${webhookSent}, email=${emailSent}, sms=${smsSent}`);
    }
  }

  /**
   * Webhook 通知
   * 通过 sys_config 中 alarm.notify.webhook.url 配置
   */
  private async sendWebhook(alarm: AlarmNotification): Promise<boolean> {
    try {
      const urlConfig = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.webhook.url' }
      });
      if (!urlConfig?.configValue) return false;

      const payload = {
        type: 'alarm',
        ruleId: alarm.ruleId,
        ruleName: alarm.ruleName,
        alarmLevel: alarm.alarmLevel,
        alarmContent: alarm.alarmContent,
        alarmSource: alarm.alarmSource,
        alarmTime: alarm.alarmTime,
        status: alarm.status,
      };

      await axios.post(urlConfig.configValue, payload, { timeout: 5000 });
      return true;
    } catch (e) {
      this.logger.warn(`Webhook 通知发送失败: ${e?.message || e}`);
      return false;
    }
  }

  /**
   * 邮件通知
   * 通过 sys_config 中 alarm.notify.email.enabled / alarm.notify.email.to 配置
   * 使用系统 SMTP 配置发送（可后续扩展独立 SMTP）
   */
  private async sendEmail(alarm: AlarmNotification): Promise<boolean> {
    try {
      const enabledConfig = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.email.enabled' }
      });
      if (!enabledConfig || enabledConfig.configValue !== 'true') return false;

      const toConfig = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.email.to' }
      });
      if (!toConfig?.configValue) {
        this.logger.warn('邮件通知已启用但未配置收件人 (alarm.notify.email.to)');
        return false;
      }

      const subject = `[${this.levelLabel(alarm.alarmLevel)}] 水务报警: ${alarm.ruleName}`;
      const content = this.buildEmailContent(alarm);

      // 尝试通过 sys_config 中配置的 SMTP 直接发送邮件
      const smtpHost = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.email.smtp_host' }
      });
      const smtpPort = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.email.smtp_port' }
      });
      const smtpUser = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.email.smtp_user' }
      });
      const smtpPass = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.email.smtp_pass' }
      });

      if (smtpHost?.configValue && smtpUser?.configValue) {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: smtpHost.configValue,
            port: parseInt(smtpPort?.configValue || '465', 10),
            secure: true,
            auth: {
              user: smtpUser.configValue,
              pass: smtpPass?.configValue || '',
            },
          });
          await transporter.sendMail({
            from: smtpUser.configValue,
            to: toConfig.configValue,
            subject,
            html: content,
          });
          this.logger.log(`[Email] 已发送报警邮件: to=${toConfig.configValue}, subject=${subject}`);
          return true;
        } catch (smtpErr) {
          this.logger.warn(`[Email] SMTP 直发失败，回退到日志记录: ${smtpErr?.message || smtpErr}`);
        }
      }

      // SMTP 未配置或发送失败：写入 sys_alarm_history 表持久化通知
      // 使用 TypeORM 原生查询写入，确保通知数据不丢失
      try {
        const manager = this.sysConfigRep.manager;
        await manager.query(
          `INSERT INTO sys_alarm_notification (channel, recipient, subject, content, status, create_time)
           VALUES (?, ?, ?, ?, '0', NOW())`,
          ['email', toConfig.configValue, subject, content]
        );
        this.logger.log(`[Email] 通知已写入数据库待发送队列: to=${toConfig.configValue}, subject=${subject}`);
        return true;
      } catch (dbErr) {
        this.logger.error(`[Email] 邮件通知写入数据库失败，通知丢失: ${dbErr?.message || dbErr}`);
        this.logger.log(`[Email] 邮件内容(仅日志): to=${toConfig.configValue}, subject=${subject}, body=${content.substring(0, 200)}`);
        return false;
      }
    } catch (e) {
      this.logger.warn(`邮件通知准备失败: ${e?.message || e}`);
      return false;
    }
  }

  /**
   * SMS 短信通知
   * 通过 sys_config 中 alarm.notify.sms.* 配置
   * 支持阿里云短信和通用 HTTP API
   */
  private async sendSms(alarm: AlarmNotification): Promise<boolean> {
    try {
      const enabledConfig = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.enabled' }
      });
      if (!enabledConfig || enabledConfig.configValue !== 'true') return false;

      const phoneNumbers = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.phones' }
      });
      if (!phoneNumbers?.configValue) {
        this.logger.warn('SMS 通知已启用但未配置接收手机号 (alarm.notify.sms.phones)');
        return false;
      }

      const provider = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.provider' }
      });
      const providerType = provider?.configValue || 'aliyun';

      const content = `[${this.levelLabel(alarm.alarmLevel)}] ${alarm.ruleName}: ${alarm.alarmContent?.substring(0, 60)}`;

      if (providerType === 'aliyun') {
        return await this.sendAliyunSms(phoneNumbers.configValue, content);
      } else {
        return await this.sendGenericSms(phoneNumbers.configValue, content);
      }
    } catch (e) {
      this.logger.warn(`SMS 通知发送失败: ${e?.message || e}`);
      return false;
    }
  }

  private async sendAliyunSms(phones: string, content: string): Promise<boolean> {
    try {
      const accessKeyId = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.aliyun.ak_id' }
      });
      const accessKeySecret = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.aliyun.ak_secret' }
      });
      const signName = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.aliyun.sign_name' }
      });
      const templateCode = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.aliyun.template_code' }
      });

      if (!accessKeyId?.configValue || !accessKeySecret?.configValue) {
        this.logger.warn('阿里云 SMS 未配置 AK (alarm.notify.sms.aliyun.ak_id / ak_secret)');
        return false;
      }

      const phoneList = phones.split(',').map(p => p.trim()).filter(Boolean);

      // 阿里云短信 API (SendSms)
      const crypto = require('crypto');
      const params: Record<string, string> = {
        AccessKeyId: accessKeyId.configValue,
        Action: 'SendSms',
        Format: 'JSON',
        PhoneNumbers: phoneList.join(','),
        SignName: signName?.configValue || '智慧水务',
        TemplateCode: templateCode?.configValue || 'SMS_000000000',
        TemplateParam: JSON.stringify({ content }),
        SignatureMethod: 'HMAC-SHA1',
        SignatureVersion: '1.0',
        SignatureNonce: Date.now().toString() + Math.random().toString(36).substring(2),
        Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        Version: '2017-05-25',
      };

      // 构建签名字符串
      const sortedKeys = Object.keys(params).sort();
      const canonicalized = sortedKeys
        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');
      const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(canonicalized)}`;
      const signature = crypto
        .createHmac('sha1', `${accessKeySecret.configValue}&`)
        .update(stringToSign)
        .digest('base64');
      params.Signature = signature;

      await axios.post('https://dysmsapi.aliyuncs.com/', new URLSearchParams(params).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
      });

      this.logger.log(`[SMS-阿里云] 已发送短信: phones=${phoneList.map(p => p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')).join(',')}`);
      return true;
    } catch (e) {
      this.logger.warn(`[SMS-阿里云] 发送失败: ${e?.message || e}`);
      return false;
    }
  }

  private async sendGenericSms(phones: string, content: string): Promise<boolean> {
    try {
      const apiUrl = await this.sysConfigRep.findOne({
        where: { configKey: 'alarm.notify.sms.http.url' }
      });
      if (!apiUrl?.configValue) {
        this.logger.warn('通用 SMS HTTP API URL 未配置 (alarm.notify.sms.http.url)');
        return false;
      }

      const phoneList = phones.split(',').map(p => p.trim()).filter(Boolean);

      await axios.post(apiUrl.configValue, {
        phones: phoneList,
        content,
        level: 'alarm',
        timestamp: new Date().toISOString(),
      }, { timeout: 5000 });

      this.logger.log(`[SMS-HTTP] 已发送短信: phones=${phoneList.map(p => p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')).join(',')}`);
      return true;
    } catch (e) {
      this.logger.warn(`[SMS-HTTP] 发送失败: ${e?.message || e}`);
      return false;
    }
  }

  private levelLabel(level: string): string {
    const map: Record<string, string> = {
      '1': '紧急', '2': '重要', '3': '次要', '4': '提示'
    };
    return map[level] || '未知';
  }

  private buildEmailContent(alarm: AlarmNotification): string {
    return `
      <h2>水务物联网报警通知</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse">
        <tr><td><strong>报警规则</strong></td><td>${alarm.ruleName}</td></tr>
        <tr><td><strong>报警级别</strong></td><td>${this.levelLabel(alarm.alarmLevel)}</td></tr>
        <tr><td><strong>报警内容</strong></td><td>${alarm.alarmContent}</td></tr>
        <tr><td><strong>报警来源</strong></td><td>${alarm.alarmSource}</td></tr>
        <tr><td><strong>报警时间</strong></td><td>${alarm.alarmTime}</td></tr>
      </table>
      <p>请及时登录系统处理。</p>
    `;
  }
}
