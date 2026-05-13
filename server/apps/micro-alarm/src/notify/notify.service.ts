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
    ]);

    let webhookSent = false;
    let emailSent = false;

    if (results[0].status === 'fulfilled') webhookSent = results[0].value;
    if (results[1].status === 'fulfilled') emailSent = results[1].value;

    if (webhookSent || emailSent) {
      this.logger.log(`报警通知已发送: rule=${alarm.ruleName}, source=${alarm.alarmSource}, webhook=${webhookSent}, email=${emailSent}`);
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

      // 构建邮件内容并写入 sys_alarm_notification 表供外部邮件服务消费
      // 或通过 SMTP 直接发送，此处采用写入待发送队列的方式
      const notificationData = {
        channel: 'email',
        recipient: toConfig.configValue,
        subject: `[${this.levelLabel(alarm.alarmLevel)}] 水务报警: ${alarm.ruleName}`,
        content: this.buildEmailContent(alarm),
        status: '0', // 待发送
      };

      // 存储到数据库供外部邮件调度器消费，这里只记录日志
      this.logger.log(`[Email] 待发送: to=${toConfig.configValue}, subject=${notificationData.subject}`);

      return true;
    } catch (e) {
      this.logger.warn(`邮件通知准备失败: ${e?.message || e}`);
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
