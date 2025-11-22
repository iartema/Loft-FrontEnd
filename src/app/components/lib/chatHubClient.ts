"use client";

import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
} from "@microsoft/signalr";
import type { ChatMessageDto } from "./api";

// Prefer same host as other APIs to avoid CORS / cert mismatch issues
const HUB_URL =
  process.env.NEXT_PUBLIC_CHAT_HUB_URL || "https://loft-shop.pp.ua/chatHub";

let connectionPromise: Promise<HubConnection> | null = null;

async function startConnection(): Promise<HubConnection> {
  if (typeof window === "undefined") {
    throw new Error("Chat hub can only start on client");
  }

  const connection = new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      withCredentials: true,
      transport: HttpTransportType.WebSockets,
      skipNegotiation: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Error)
    .build();

  try {
    console.info("[chatHub] connecting", { HUB_URL });
    await connection.start();
    console.info("[chatHub] connected", {
      state: connection.state,
      connectionId: connection.connectionId,
    });
  } catch (err) {
    console.error("[chatHub] failed to connect", { HUB_URL, err });
    throw err;
  }

  connection.onclose((error) => {
    console.warn("[chatHub] closed", { error, state: connection.state });
  });
  connection.onreconnecting((error) => {
    console.warn("[chatHub] reconnecting", { error, state: connection.state });
  });
  connection.onreconnected((connectionId) => {
    console.info("[chatHub] reconnected", { connectionId, state: connection.state });
  });
  return connection;
}

export async function getChatHubConnection(): Promise<HubConnection> {
  if (connectionPromise) return connectionPromise;
  connectionPromise = startConnection().catch((err) => {
    connectionPromise = null;
    throw err;
  });
  return connectionPromise;
}

export async function subscribeToChatMessages(
  handler: (message: ChatMessageDto) => void
): Promise<() => void> {
  const connection = await getChatHubConnection();
  const eventNames = ["ReceiveMessage", "ReceiveChatMessage"];
  for (const event of eventNames) {
    connection.on(event, handler);
  }
  return () => {
    for (const event of eventNames) {
      connection.off(event, handler);
    }
  };
}
