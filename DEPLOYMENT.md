# SpeakFlow AI - Quick Deployment Guide

## ⚠️ Important: WebSocket Limitation on Vercel

Vercel **does not support WebSockets** in serverless functions. This app requires WebSockets for real-time audio streaming.

## Recommended Deployment Architecture

```
┌─────────────────────┐
│  Frontend (Client)  │
│   Vercel (Free)     │  ← Static hosting, perfect for React
└──────────┬──────────┘
           │ HTTPS/WSS
           │
┌──────────▼──────────┐
│  Backend (Server)   │
│  Render.com (Free)  │  ← WebSocket support
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   MongoDB Atlas     │
│      (Free)         │
└─────────────────────┘
```

---

## 🚀 Quick Start Deployment

### Step 1: Setup MongoDB (5 minutes)

1. Go to https://mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Get connection string
5. Whitelist all IPs (0.0.0.0/0)

### Step 2: Deploy Backend to Render.com (10 minutes)

1. Push code to GitHub
2. Go to https://render.com
3. New → Web Service
4. Connect GitHub repo
5. Settings:
   - Root Directory: `server`
   - Build: `npm install && npm run build`
   - Start: `npm start`
6. Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-2.0-flash-exp
   CORS_ORIGIN=*
   ```
7. Deploy!
8. Copy your Render URL (e.g., https://speakflow-ai-server.onrender.com)

### Step 3: Deploy Frontend to Vercel (5 minutes)

1. Go to https://vercel.com
2. Import GitHub repo
3. Select `client` folder
4. Framework: Vite
5. Environment Variables:
   ```
   VITE_API_URL=https://your-render-url.onrender.com
   VITE_WS_URL=wss://your-render-url.onrender.com
   ```
6. Deploy!

### Step 4: Update CORS (2 minutes)

1. Go back to Render dashboard
2. Update `CORS_ORIGIN` to your Vercel URL
3. Save (auto-redeploys)

---

## 📋 Environment Variables

### Client (.env or Vercel Dashboard)
```env
VITE_API_URL=https://speakflow-ai-server.onrender.com
VITE_WS_URL=wss://speakflow-ai-server.onrender.com
```

### Server (Render Dashboard)
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/speakflow-ai
GEMINI_API_KEY=AIza...your_key
GEMINI_MODEL=gemini-2.0-flash-exp
CORS_ORIGIN=https://your-app.vercel.app
```

---

## ⚡ Alternative Platforms

### If you want everything on one platform:

**Render.com (Both)**
- Backend: Web Service ($7/month for always-on)
- Frontend: Static Site (Free)

**Railway.app**
- Both frontend and backend
- $5/month base + usage

**Fly.io**
- Global edge deployment
- Pay-as-you-go

---

## 🧪 Test Your Deployment

1. Open Vercel URL
2. Check status badge (should be green "Available")
3. Click "Start Recording"
4. Speak clearly
5. Click "Stop"
6. Click "Save to History"
7. Check History page

---

## 🐛 Common Issues

### WebSocket won't connect
- Check you're using `wss://` not `ws://`
- Verify backend URL is correct
- Check Render logs for errors

### CORS errors
- Update `CORS_ORIGIN` to match your Vercel URL exactly
- Or use `*` for testing (not recommended for production)

### Render free tier sleeps
- First request takes ~30 seconds to wake up
- Upgrade to Starter plan ($7/month) for always-on

---

## 💡 Cost Breakdown

### Free Tier (Recommended for Testing)
- Vercel: Free (hobby plan)
- Render: Free (with sleep after 15min inactivity)
- MongoDB Atlas: Free (512MB storage)
- **Total: $0/month**

### Production Tier
- Vercel: Free (hobby) or $20/month (pro)
- Render: $7/month (always-on)
- MongoDB Atlas: Free or $9/month (2GB storage)
- **Total: $7-36/month**

---

## 📞 Support Resources

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs  
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- Gemini API: https://ai.google.dev/gemini-api/docs

---

**Need help? Check the logs:**
- Vercel: Dashboard → Your Project → Deployments → Logs
- Render: Dashboard → Your Service → Logs
- Browser: F12 → Console tab
