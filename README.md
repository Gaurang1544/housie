# 🎱 Housie - Multiplayer Tambola Game (Netlify Ready)

A real-time multiplayer Housie/Tambola game running 100% serverless directly in the browser. Perfect for hosting on **Netlify**, GitHub Pages, or any static web host.

## ✨ Features

- **100% Serverless & Netlify Ready**: No backend server or Railway needed.
- **Global Multiplayer**: Players can join from anywhere in the world on mobile, tablet, or desktop.
- **Host Approval System**: Host sees a popup card to Accept or Deny player join requests.
- **Interactive Ticket & Board**: 3x9 ticket generator with tap-to-mark numbers.
- **Claim Validation**: Host automatically validates player claims (Top Line, Middle Line, Bottom Line, Full House).
- **Interactive Scratch Card & Confetti**: Winning players scratch an interactive scratch card to reveal their prize quotes!

## 🚀 Deployment on Netlify

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Update for Netlify"
   git push origin main
   ```
2. In Netlify, link your GitHub repository. Netlify will automatically deploy `index.html` from the root directory.
3. Share your Netlify URL (e.g., `https://housiee.netlify.app`) with friends!

## 🎮 How to Play

### Host:
1. Open your Netlify URL.
2. Enter your name and click **"Create Room"**.
3. Share the 6-digit room code with your friends.
4. Click **"Accept"** when player join request cards pop up.
5. Click **"Start Game"** and call numbers (or use ⏱ auto-call)!

### Players:
1. Open the Netlify URL.
2. Enter your name and the 6-digit room code.
3. Click **"Join"**.
4. Once the host accepts, tap numbers on your ticket as they are called.
5. Tap **Top Line**, **Middle Line**, **Bottom Line**, or **Full House** to claim your win!
