/**
 * WebSocket server that sits between the browser client and GeminiLiveProxy.
 *
 * Client → Server message types:
 *   { type: 'start_session' }
 *   { type: 'audio_chunk', data: '<base64 PCM>' }
 *   { type: 'end_of_turn' }
 *   { type: 'stop_session' }
 *
 * Server → Client message types:
 *   { type: 'session_started' }
 *   { type: 'transcript', transcriptType: 'partial'|'final', text: string }
 *   { type: 'status', status: 'connected'|'disconnected' }
 *   { type: 'error', message: string }
 */

import { WebSocketServer, WebSocket, RawData } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { GeminiLiveProxy } from './geminiLiveProxy';

export function attachWebSocketServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (clientWs: WebSocket, req: IncomingMessage) => {
    const clientIp = req.socket.remoteAddress || 'unknown';
    console.log(`[WS] Client connected from ${clientIp}`);

    let geminiProxy: GeminiLiveProxy | null = null;

    function send(payload: Record<string, unknown>): void {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    }

    function startSession(): void {
      if (geminiProxy) {
        geminiProxy.close();
      }

      geminiProxy = new GeminiLiveProxy((data) => {
        if (data.type === 'status') {
          send({ type: 'status', status: data.message });
        } else if (data.type === 'partial' || data.type === 'final') {
          send({ type: 'transcript', transcriptType: data.type, text: data.text || '' });
        } else if (data.type === 'error') {
          send({ type: 'error', message: data.message });
        }
      });

      geminiProxy.connect();
      send({ type: 'session_started' });
    }

    clientWs.on('message', (raw: RawData) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          data?: string;
        };

        switch (msg.type) {
          case 'start_session':
            startSession();
            break;

          case 'audio_chunk':
            if (!msg.data) break;
            if (!geminiProxy) {
              send({ type: 'error', message: 'No active session. Send start_session first.' });
              break;
            }
            // Log first few chunks to verify audio is being received
            if (!(global as any)._serverAudioChunkCount) (global as any)._serverAudioChunkCount = 0;
            (global as any)._serverAudioChunkCount++;
            if ((global as any)._serverAudioChunkCount <= 3) {
              console.log(`[WS] Received audio chunk #${(global as any)._serverAudioChunkCount}, size:`, msg.data.length);
            }
            geminiProxy.sendAudioChunk(msg.data);
            break;

          case 'end_of_turn':
            geminiProxy?.sendEndOfTurn();
            break;

          case 'stop_session':
            geminiProxy?.close();
            geminiProxy = null;
            send({ type: 'status', status: 'stopped' });
            break;

          default:
            console.warn('[WS] Unknown message type:', msg.type);
        }
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
        send({ type: 'error', message: 'Invalid message format' });
      }
    });

    clientWs.on('close', () => {
      console.log(`[WS] Client disconnected from ${clientIp}`);
      geminiProxy?.close();
      geminiProxy = null;
    });

    clientWs.on('error', (err) => {
      console.error(`[WS] Client error (${clientIp}):`, err.message);
      geminiProxy?.close();
      geminiProxy = null;
    });
  });

  wss.on('error', (err) => {
    console.error('[WSS] Server error:', err);
  });

  console.log('[WS] WebSocket server attached at /ws');
  return wss;
}
