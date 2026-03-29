import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'

const HUB_URL =
  'https://nongxanhbe-g6h9aadudccrgzbs.eastasia-01.azurewebsites.net/app-hub'

export type ReceiveMessageHandler = (messageDto: unknown) => void
export type ReceiveNotificationHandler = (notificationDto: unknown) => void

export interface SignalrClient {
  connection: HubConnection
  start: () => Promise<void>
  stop: () => Promise<void>
  onReceiveMessage: (handler: ReceiveMessageHandler) => () => void
  onReceiveNotification: (handler: ReceiveNotificationHandler) => () => void
}

export function createSignalrClient(accessToken: string): SignalrClient {
  const connection = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  const start = async () => {
    if (connection.state === HubConnectionState.Connected) return
    await connection.start()
  }

  const stop = async () => {
    if (connection.state === HubConnectionState.Disconnected) return
    await connection.stop()
  }

  const onReceiveMessage = (handler: ReceiveMessageHandler) => {
    connection.on('ReceiveMessage', handler)
    return () => connection.off('ReceiveMessage', handler)
  }

  const onReceiveNotification = (handler: ReceiveNotificationHandler) => {
    connection.on('ReceiveNotification', handler)
    return () => connection.off('ReceiveNotification', handler)
  }

  return { connection, start, stop, onReceiveMessage, onReceiveNotification }
}

