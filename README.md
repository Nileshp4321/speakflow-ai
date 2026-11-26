
# SpeakFlow AI — Real-Time Multilingual Speech-to-Text Transcription System

A production-quality web application for real-time speech-to-text transcription supporting **English, Hindi, and Hinglish** (mixed Hindi-English) using the **Google Gemini Live API**.

---

## 🎯 Features

### Core Functionality
- **Real-time speech transcription** — Live audio → text with partial and final segments
- **Multilingual support** — English, Hindi, Hinglish, and 70+ languages via auto-detection
- **WebSocket-based streaming** — Low-latency bidirectional audio/text communication
- **No translation** — Preserves the original language(s) spoken by the user
- **Audio visualizer** — Real-time waveform display during recording
- **Recording controls** — Start, Stop, Pause, Resume
- **Microphone selection** — Choose from multiple input devices

### Transcription Management (CRUD)
- **Save transcriptions** to MongoDB with auto-generated titles
- **Search & filter** — Full-text search, date range, sorting
- **Edit** — Modify title and transcript text
- **Delete** — With confirmation modal
- **Pagination** — Efficient browsing of large histories
- **Export** — Download as TXT or PDF, copy to clipboard

### UI/UX
- **Modern SaaS dashboard** — Clean, premium design with Tailwind CSS
- **Responsive layout** — Works on desktop, tablet, and mobile
- **Dark/light mode** — Theme toggle
- **Live status indicators** — Connection status, recording state
- **Toast notifications** — User-friendly feedback
- **Statistics dashboard** — Total transcriptions, duration, today's count

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + TypeScript
- **Vite** — Fast development server and build tool
- **Tailwind CSS** — Utility-first styling
- **React Router** — Client-side routing
- **Axios** — HTTP client for REST APIs
- **Lucide React** — Icon library
- **React Hot Toast** — Notifications

### Backend
- **Node.js** + Express.js
- **TypeScript** — Type-safe server code
- **WebSocket (ws)** — Real-time bidirectional communication
- **Mongoose** — MongoDB ODM with schema validation
- **CORS** — Cross-origin resource sharing
- **Morgan** — HTTP request logging
- **dotenv** — Environment variable management

### Database
- **MongoDB Atlas** (cloud) or **MongoDB Community** (local)
- Full-text search indexing
- Automatic timestamps

### AI Model
- **Google Gemini Live API** — `gemini-3.8-live` (stable, September 2026)
- Real-time audio input transcription
- Native multilingual support
- Audio format: Raw 16-bit PCM, 16 kHz, little-endian

---

## 📂 Project Structure

```
speakflow-ai/
│
├── client/                          # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── AudioVisualizer.tsx  # Real-time waveform visualization
│   │   │   ├── StatusBadge.tsx      # Connection/recording status indicator
│   │   │   ├── TranscriptDisplay.tsx # Live transcript rendering
│   │   │   ├── DeleteConfirmModal.tsx
│   │   │   ├── EditTranscriptionModal.tsx
│   │   │   └── LoadingSkeleton.tsx  # Loading placeholders
│   │   │
│   │   ├── pages/                   # Route pages
│   │   │   ├── Dashboard.tsx        # Stats and recent transcriptions
│   │   │   ├── LiveTranscription.tsx # Main recording interface
│   │   │   ├── History.tsx          # Transcription CRUD management
│   │   │   └── Settings.tsx         # Backend status, model info
│   │   │
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx        # Sidebar navigation layout
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useRecording.ts      # Mic capture + WebSocket + PCM encoding
│   │   │   └── useTranscriptions.ts # CRUD operations wrapper
│   │   │
│   │   ├── services/                # API clients
│   │   │   ├── api.ts               # REST API (Axios)
│   │   │   └── wsClient.ts          # WebSocket client for live transcription
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.tsx     # Dark/light mode state
│   │   │
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   │
│   │   ├── utils/
│   │   │   └── index.ts             # Formatting, clipboard, download helpers
│   │   │
│   │   ├── main.tsx                 # App entry point
│   │   └── index.css                # Tailwind imports + global styles
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
│
├── server/                          # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/                  # Configuration modules
│   │   │   ├── env.ts               # Environment variable loader
│   │   │   └── database.ts          # MongoDB connection setup
│   │   │
│   │   ├── models/
│   │   │   └── Transcription.ts     # Mongoose schema + model
│   │   │
│   │   ├── controllers/
│   │   │   └── transcriptionController.ts # CRUD business logic
│   │   │
│   │   ├── routes/
│   │   │   ├── transcriptionRoutes.ts # /api/transcriptions endpoints
│   │   │   └── systemRoutes.ts      # /api/health, /api/config
│   │   │
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts      # Global error handling
│   │   │   └── validate.ts          # Request validation middleware
│   │   │
│   │   ├── websocket/
│   │   │   ├── wsServer.ts          # WebSocket server (/ws endpoint)
│   │   │   └── geminiLiveProxy.ts   # Gemini Live API proxy
│   │   │
│   │   ├── utils/
│   │   │   └── logger.ts            # Logging utility
│   │   │
│   │   └── app.ts                   # Express app + HTTP server
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── .gitignore
├── .env.example                     # Root env template
└── README.md                        # This file
```

---

## 🔧 Architecture

### Real-Time Transcription Flow

```
Browser Microphone
   ↓
MediaStream API (16kHz PCM audio)
   ↓
ScriptProcessorNode (capture raw samples)
   ↓
Float32 → Int16 PCM → Base64 encoding
   ↓
WebSocket → ws://localhost:5000/ws
   ↓
Node.js Backend (wsServer.ts)
   ↓
GeminiLiveProxy (geminiLiveProxy.ts)
   ↓
WebSocket → wss://generativelanguage.googleapis.com/.../BidiGenerateContent?key=...
   ↓
Gemini Live API (gemini-3.8-live)
   ↓
inputTranscription events (partial/final)
   ↓
Backend → Frontend WebSocket
   ↓
React state update
   ↓
Live Transcript Display
```

**Security:** The Gemini API key never leaves the server. The backend acts as a secure proxy.

### REST API Architecture

```
Frontend (Axios)
   ↓
HTTP REST → localhost:5000/api/...
   ↓
Express Routes
   ↓
Controllers (validation + business logic)
   ↓
Mongoose Models
   ↓
MongoDB (Atlas or local)
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v20+ (v24.13.0 tested)
- **npm** (comes with Node.js)
- **MongoDB** — Either:
  - MongoDB Atlas account (cloud, free tier) → https://cloud.mongodb.com
  - MongoDB Community (local) → https://www.mongodb.com/try/download/community
- **Gemini API key** → https://aistudio.google.com/apikey (free tier available)

---

### 1. Clone or Navigate to Project

```bash
cd d:\Nilesh\speakflow-ai
```

---

### 2. Backend Setup

#### Install Dependencies

```bash
cd server
npm install
```

#### Configure Environment Variables

Create `server/.env`:

```bash
PORT=5000
NODE_ENV=development

# MongoDB connection string
# Option A: MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/speakflow-ai?retryWrites=true&w=majority

# Option B: Local MongoDB
# MONGODB_URI=mongodb://localhost:27017/speakflow-ai

# Get your key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_actual_gemini_api_key_here

GEMINI_MODEL=gemini-3.8-live
CORS_ORIGIN=http://localhost:5173
```

**MongoDB Atlas Setup:**
1. Go to https://cloud.mongodb.com → Clusters → Connect
2. Choose **Drivers** → Copy connection string
3. Replace `<username>`, `<password>`, and add database name `/speakflow-ai`
4. Go to **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)

**DNS Fix (if SRV lookup fails):**
If you get `querySrv ECONNREFUSED`, your network blocks DNS SRV lookups. Run this in PowerShell as Administrator:

```powershell
Set-DnsClientServerAddress -InterfaceAlias "Ethernet 3" -ServerAddresses ("8.8.8.8","8.8.4.4")
```
*(Replace `"Ethernet 3"` with your actual network adapter name from `Get-NetAdapter`)*

#### Start Backend

```bash
npm run dev
```

Expected output:
```
[DB] ✅ Connected to MongoDB successfully
🚀 SpeakFlow AI server running
   HTTP  → http://localhost:5000
   WS    → ws://localhost:5000/ws
   Model → gemini-3.8-live
```

---

### 3. Frontend Setup

#### Install Dependencies

Open a **new terminal**:

```bash
cd client
npm install
```

#### Configure Environment Variables

Create `client/.env`:

```bash
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

#### Start Frontend

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 4. Open the Application

Navigate to **http://localhost:5173** in your browser.

---

## 📡 API Endpoints

### System

| Method | Endpoint      | Description                     |
|--------|---------------|---------------------------------|
| GET    | `/api/health` | Backend & database health check |
| GET    | `/api/config` | Safe frontend configuration     |

### Transcriptions

| Method | Endpoint                   | Description                               |
|--------|----------------------------|-------------------------------------------|
| POST   | `/api/transcriptions`      | Create a new transcription                |
| GET    | `/api/transcriptions`      | List all (with search, filters, pagination) |
| GET    | `/api/transcriptions/:id`  | Get a single transcription by ID          |
| PUT    | `/api/transcriptions/:id`  | Update title or transcript text           |
| DELETE | `/api/transcriptions/:id`  | Delete a transcription                    |

#### Query Parameters (GET `/api/transcriptions`)

```
?search=keyword         # Full-text search in title & transcript
&sortBy=createdAt       # Sort field: createdAt | updatedAt | title | duration | wordCount
&order=desc             # Sort direction: asc | desc
&page=1                 # Pagination page number
&limit=10               # Results per page
&dateFrom=2024-01-01    # Filter by creation date range
&dateTo=2024-12-31
```

---

## 🎤 Gemini Live API Integration

### Model: `gemini-3.8-live`

**Status:** Stable (not deprecated as of September 2026)

**Official Documentation:**
- Live API Overview: https://aistudio.google.com/docs/live-api
- Model Details: https://aistudio.google.com/docs/models/gemini-3.8-live
- WebSocket API Reference: https://aistudio.google.com/api-reference/live

### Why This Model?

Based on official Google AI documentation verification (September 2026):

1. **Currently supported** — Not deprecated, stable production model
2. **Native real-time audio** — Built for low-latency voice interactions
3. **Input transcription** — Provides `inputAudioTranscription` for speech-to-text
4. **Multilingual** — Supports 70+ languages including Hindi and English
5. **Free tier eligible** — Available on free quota with rate limits

### Audio Specifications

- **Input format:** Raw 16-bit PCM audio, 16 kHz, little-endian, base64-encoded
- **MIME type:** `audio/pcm;rate=16000`
- **Protocol:** WebSocket (bidirectional streaming)
- **Endpoint:** `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=API_KEY`

### Configuration Used

```javascript
{
  setup: {
    model: "models/gemini-3.8-live",
    responseModalities: ["AUDIO"],  // Required by model (audio output ignored)
    inputAudioTranscription: {},    // Enable real-time transcription
    systemInstruction: {
      parts: [{
        text: "You are a transcription assistant. Transcribe EXACTLY what the user speaks. " +
              "Do NOT translate. Preserve the original language(s) — including Hindi, English, " +
              "and Hinglish. Output only the transcribed text with proper punctuation."
      }]
    }
  }
}
```

### Transcription Flow

1. Browser captures microphone audio at 16 kHz
2. Frontend encodes PCM samples to base64 and sends via WebSocket
3. Backend proxy forwards chunks to Gemini Live API
4. Gemini returns `serverContent.inputTranscription` events:
   - **Partial** — In-progress transcription (displayed in italic)
   - **Final** — Completed segment (normal text)
5. Frontend updates UI in real time

---

## 🔒 Security Best Practices

### Implemented

- ✅ API key stored only on server (never exposed to frontend)
- ✅ Backend acts as secure proxy for Gemini API
- ✅ `.env` files excluded from git (`.gitignore`)
- ✅ CORS configured for specific origin
- ✅ Input validation on all API endpoints (express-validator)
- ✅ MongoDB injection protection via Mongoose
- ✅ Error messages sanitized (no stack traces in production)
- ✅ Microphone permissions requested before recording
- ✅ WebSocket connections properly cleaned up on unmount

### Recommended for Production

- 🔐 Use HTTPS/WSS (TLS encryption)
- 🔐 Add authentication (JWT or session-based)
- 🔐 Rate limiting on API endpoints
- 🔐 Helmet.js for HTTP security headers
- 🔐 MongoDB user with minimal privileges
- 🔐 IP whitelist in Atlas limited to known servers
- 🔐 Environment-specific `.env` files (staging, production)
- 🔐 Secrets management (AWS Secrets Manager, HashiCorp Vault)

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `GEMINI_API_KEY is not configured`

**Fix:** Add your API key to `server/.env`

---

**Error:** `querySrv ECONNREFUSED _mongodb._tcp...`

**Fix:** Your network blocks DNS SRV lookups. Change DNS to Google's:

```powershell
# PowerShell as Administrator
Get-NetAdapter | Where-Object {$_.Status -eq "Up"} | Select-Object Name
Set-DnsClientServerAddress -InterfaceAlias "YOUR_ADAPTER_NAME" -ServerAddresses ("8.8.8.8","8.8.4.4")
```

---

**Error:** `Could not connect to any servers in your MongoDB Atlas cluster`

**Fix:** 
1. Go to https://cloud.mongodb.com → Network Access
2. Add `0.0.0.0/0` to allow all IPs (or add your specific IP)
3. Restart the server

---

### Frontend won't connect to backend

**Error:** `Network Error` or `ERR_CONNECTION_REFUSED`

**Fix:**
1. Ensure backend is running (`npm run dev` in `server/`)
2. Check `client/.env` has correct URLs:
   ```
   VITE_API_URL=http://localhost:5000
   VITE_WS_URL=ws://localhost:5000
   ```
3. Restart the frontend dev server

---

### Microphone not working

**Error:** `Permission denied` or no audio captured

**Fix:**
1. Allow microphone access in browser (check address bar icon)
2. Test microphone in browser settings
3. Ensure no other app is using the microphone
4. Try a different browser (Chrome/Edge recommended for best Web Audio API support)

---

### Transcription not appearing

**Check:**
1. WebSocket connection status (should show "Live" badge)
2. Browser console for errors (F12 → Console tab)
3. Backend logs for Gemini API errors
4. `GEMINI_API_KEY` is correct and has quota remaining

---

## 📊 Limitations

### Known Limitations

- **Gemini Free Tier:** Rate limits apply (see https://ai.google.dev/pricing)
- **Audio quality:** Depends on microphone quality and background noise
- **Language mixing:** Very rapid code-switching may occasionally lose context
- **Punctuation:** Auto-generated; may not always match user's intent perfectly
- **Network dependency:** Requires stable internet for Gemini API access
- **Browser support:** Best on Chromium-based browsers (Chrome, Edge, Brave)

### Future Improvements

- [ ] Add user authentication (JWT)
- [ ] Export transcriptions as DOCX/SRT
- [ ] Real-time collaboration (multiple users viewing same transcript)
- [ ] Speaker diarization (distinguish multiple speakers)
- [ ] Offline mode with local speech recognition fallback
- [ ] Custom vocabulary biasing for domain-specific terms
- [ ] Transcript editing with auto-save
- [ ] Dark mode improvements (currently basic implementation)

---

## 📜 License

This project was built as a technical hiring assignment for **Procucev AI Tech**.

**All rights reserved.** Code is provided for evaluation purposes only.

---

## 🙏 Acknowledgments

- **Google Gemini Team** — For the excellent Live API and multilingual support
- **React Team** — For the best UI library
- **Tailwind CSS** — For rapid, beautiful styling
- **MongoDB** — For flexible document storage
- **Lucide** — For clean, modern icons

---

## 📧 Contact

**Developer:** Nilesh  
**Assignment:** Procucev AI Tech Hiring Challenge  
**Date:** 2024

---

## 🎓 Technical Notes for Reviewers

### Key Implementation Highlights

1. **Real Audio Streaming**
   - Used `ScriptProcessorNode` for raw PCM capture (not deprecated `getUserMedia` only)
   - Proper Float32 → Int16 conversion with clamping
   - Base64 encoding for WebSocket transmission
   - Sample rate resampling to 16 kHz via AudioContext

2. **WebSocket Lifecycle Management**
   - Proper cleanup on component unmount
   - Reconnection logic with exponential backoff
   - Queuing mechanism for audio chunks during session init
   - Separation of connection states (disconnected, connecting, connected, error)

3. **State Management**
   - Partial vs. final transcription segments tracked separately
   - Efficient replacement of partial text as new chunks arrive
   - Duration timer with pause/resume support
   - Prevents duplicate recording sessions

4. **Backend Proxy Architecture**
   - API key isolation (never sent to frontend)
   - Single backend WebSocket connection per client
   - Forward-only design (no audio storage on server)
   - Graceful error handling with specific error types

5. **MongoDB Schema Design**
   - Full-text search indexes on `title` and `transcript`
   - Automatic `wordCount` calculation via pre-save hook
   - Flexible `segments` array for future speaker diarization
   - Timestamps for created/updated tracking

6. **TypeScript Type Safety**
   - Strict mode enabled
   - Full type coverage (no `any` types in production code)
   - Interface-driven API contracts
   - Proper error type narrowing

---

**End of README**
