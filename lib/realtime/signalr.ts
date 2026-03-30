import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
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

type SharedEntry = {
  connection: HubConnection
  refCount: number
}

// Shared per accessToken to avoid opening multiple concurrent connections
// (important on Azure Free/Shared tiers).
const sharedByToken = new Map<string, SharedEntry>()

export function createSignalrClient(accessToken: string): SignalrClient {
  const tokenKey = accessToken || ''
  let entry = sharedByToken.get(tokenKey)
  if (!entry) {
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => accessToken,
        // Azure Free/Shared can be flaky with WebSockets; LongPolling is more reliable.
        // Also: fewer concurrent WS connections when multiple components mount.
        transport: HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    entry = { connection, refCount: 0 }
    sharedByToken.set(tokenKey, entry)
  }

  const connection = entry.connection

  const start = async () => {
    // reference-counted start: only open a physical connection once
    entry!.refCount += 1
    if (connection.state === HubConnectionState.Connected) return
    if (connection.state === HubConnectionState.Connecting) return
    await connection.start()
  }

  const stop = async () => {
    // reference-counted stop: only tear down when no one uses it
    entry!.refCount = Math.max(0, entry!.refCount - 1)
    if (entry!.refCount > 0) return

    if (connection.state === HubConnectionState.Disconnected) {
      sharedByToken.delete(tokenKey)
      return
    }
    await connection.stop().catch(() => {})
    sharedByToken.delete(tokenKey)
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

