/**
 * WebSocket client that communicates with the Node.js backend proxy.
 *
 * The backend proxy forwards audio to Gemini Live API and returns transcription events.
 * This client never talks directly to Gemini or exposes any API keys.
 */

export type WsStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WsMessage {
  type: 'session_started' | 'transcript' | 'status' | 'error';
  transcriptType?: 'partial' | 'final';
  text?: string;
  status?: string;
  message?: string;
}

type MessageHandler = (msg: WsMessage) => void;
type StatusHandler = (status: WsStatus) => void;

export class SpeakFlowWsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: MessageHandler;
  private onStatusChange: StatusHandler;
  private reconnectAttempts = 0;
  private maxReconnects = 3;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string, onMessage: MessageHandler, onStatusChange: StatusHandler) {
    this.url = url;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.closed = false;
    this.onStatusChange('connecting');

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[WS Client] Connection opened');
      this.reconnectAttempts = 0;
      this.onStatusChange('connected');
      // Start a Gemini session immediately
      this.send({ type: 'start_session' });
      console.log('[WS Client] Sent start_session message');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        this.onMessage(msg);
      } catch {
        console.error('[WS] Failed to parse message');
      }
    };

    this.ws.onerror = () => {
      this.onStatusChange('error');
    };

    this.ws.onclose = () => {
      console.log('[WS Client] Connection closed. Closed flag:', this.closed, 'Reconnect attempts:', this.reconnectAttempts);
      if (!this.closed) {
        this.onStatusChange('disconnected');
        this.tryReconnect();
      }
    };
  }

  private tryReconnect(): void {
    if (this.closed || this.reconnectAttempts >= this.maxReconnects) return;
    this.reconnectAttempts++;
    const delay = 1000 * Math.pow(2, this.reconnectAttempts - 1); // exponential backoff
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  send(payload: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  sendAudioChunk(base64Pcm: string): void {
    this.send({ type: 'audio_chunk', data: base64Pcm });
  }

  sendEndOfTurn(): void {
    this.send({ type: 'end_of_turn' });
  }

  stopSession(): void {
    this.send({ type: 'stop_session' });
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect loop
      this.ws.close();
      this.ws = null;
    }
    this.onStatusChange('disconnected');
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
