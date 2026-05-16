import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface BurstEventPayload {
  eventId: number;
  zoneCode: string;
  pipeCode?: string;
  burstType: string;
  confidence: number;
  severity: number;
  description: string;
  anomalyTime: Date;
}

export interface AlarmEventPayload {
  alarmId: number;
  ruleName: string;
  alarmLevel: string;
  alarmContent: string;
  alarmSource: string;
  alarmTime: Date;
}

@WebSocketGateway({
  namespace: '/ws/water',
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
  transports: ['websocket', 'polling'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.log(`WS 客户端连接: ${client.id}`);
    this.connectedClients.set(client.id, new Set());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS 客户端断开: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe:zone')
  handleSubscribeZone(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { zoneCode: string },
  ) {
    if (data?.zoneCode) {
      const subs = this.connectedClients.get(client.id);
      if (subs) {
        subs.add(`zone:${data.zoneCode}`);
        client.emit('subscribed', { channel: `zone:${data.zoneCode}` });
      }
    }
  }

  @SubscribeMessage('unsubscribe:zone')
  handleUnsubscribeZone(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { zoneCode: string },
  ) {
    if (data?.zoneCode) {
      const subs = this.connectedClients.get(client.id);
      if (subs) subs.delete(`zone:${data.zoneCode}`);
    }
  }

  /** 推送爆管事件 */
  pushBurstEvent(event: BurstEventPayload) {
    this.server.emit('burst:new', event);
    this.server.emit(`burst:zone:${event.zoneCode}`, event);
  }

  /** 推送爆管事件状态更新 */
  pushBurstStatusUpdate(eventId: number, status: string) {
    this.server.emit('burst:status', { eventId, status });
  }

  /** 推送新报警 */
  pushAlarm(alarm: AlarmEventPayload) {
    this.server.emit('alarm:new', alarm);
  }

  /** 推送设备状态变更 */
  pushDeviceStatus(deviceCode: string, status: string, zoneCode?: string) {
    const payload = { deviceCode, status, ts: new Date().toISOString() };
    this.server.emit('device:status', payload);
    if (zoneCode) {
      this.server.emit(`device:status:${zoneCode}`, payload);
    }
  }
}
