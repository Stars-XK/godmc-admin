import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface LocationUpdatePayload {
  userId: number;
  userName: string;
  taskId: number;
  lng: number;
  lat: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  batteryLevel?: number;
  networkType?: string;
  updatedAt: Date;
}

export interface GeofenceAlertPayload {
  taskId: number;
  userId: number;
  userName?: string;
  lng: number;
  lat: number;
  distance: number;
  routeName: string;
  timestamp: Date;
  consecutiveBreaches: number;
}

@WebSocketGateway({
  namespace: '/ws/inspection',
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
  transports: ['websocket', 'polling'],
})
export class InspectionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(InspectionGateway.name);

  @WebSocketServer()
  server: Server;

  private connectedClients = new Set<string>();

  handleConnection(client: Socket) {
    this.logger.log(`[Inspection] WS 客户端连接: ${client.id}`);
    this.connectedClients.add(client.id);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[Inspection] WS 客户端断开: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /** 推送巡检员位置更新 */
  pushLocationUpdate(payload: LocationUpdatePayload) {
    this.server.emit('inspection:location:update', payload);
  }

  /** 推送电子围栏告警 */
  pushGeofenceAlert(payload: GeofenceAlertPayload) {
    this.server.emit('inspection:geofence:alert', payload);
    this.logger.warn(
      `[Geofence] 告警推送: task=${payload.taskId} user=${payload.userName} dist=${payload.distance}m count=${payload.consecutiveBreaches}`,
    );
  }

  /** 推送任务状态变更 */
  pushTaskUpdate(taskId: number, taskStatus: string, assignedUserName?: string) {
    this.server.emit('inspection:task:update', { taskId, taskStatus, assignedUserName });
  }

  /** 推送新问题上报 */
  pushNewIssue(issueId: number, issueTitle: string, severity: string, reporterName: string) {
    this.server.emit('inspection:issue:new', { issueId, issueTitle, severity, reporterName });
  }
}
