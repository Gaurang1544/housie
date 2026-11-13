# 🚀 Deployment Guide - Housie Game (Netlify Ready)

## 🌐 Netlify Deployment (Recommended)

This project is **100% serverless and ready for Netlify**!
No backend server, no Railway, no database, and no API keys are required. Real-time multiplayer synchronization runs seamlessly across devices using global secure WebSockets.

### Deploying to Netlify:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Convert Housie to 100% serverless Netlify multiplayer"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [Netlify](https://app.netlify.com)
   - Click **"Add new site"** → **"Import an existing project"**
   - Choose **GitHub** and select your repository (`housie`)
   - Build settings:
     - **Build command:** (leave empty)
     - **Publish directory:** `.` (root directory)
   - Click **"Deploy site"**

3. **Play:**
   - Open your Netlify URL (e.g. `https://housiee.netlify.app`)
   - Host clicks **"Create Room"** and shares the 6-digit code.
   - Players enter the code on their mobile phones, tablets, or computers and click **"Join"**.
   - Host approves the join request popup and starts calling numbers!

---

## 💻 Local Testing

Simply double-click `index.html` in your browser, or run any local HTTP server:
```bash
# Using Python
python3 -m http.server 3000

# Or using Node
npx serve .
```
Open `http://localhost:3000` in multiple tabs to test.
