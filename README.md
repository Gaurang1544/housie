# 🎱 Housie - Multiplayer Tambola Game

A fully functional real-time multiplayer Housie/Tambola game with beautiful UI, approval-based join system, and scratch card rewards.

## ✅ VERIFIED WORKING

All core features have been tested and are working:
- ✅ WebSocket connection (host & player)
- ✅ Room creation
- ✅ Join request/approval system
- ✅ Game start broadcast
- ✅ Number calling
- ✅ Player ticket generation
- ✅ Claim submission and validation
- ✅ Win notifications
- ✅ Scratch card rewards

## 🚀 Quick Start

### Local Testing (Same Network)

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Open in browser:**
   - Host: Open `http://localhost:3000`
   - Players: Open same URL in other tabs/devices on the same network

3. **Play:**
   - Host creates a room → gets a 6-digit code
   - Players enter the code to join
   - Host approves join requests
   - Host clicks "Start Game" → calls numbers
   - Players mark their tickets and claim wins

### Deploy to Railway (Free)

1. **Create Railway account:** https://railway.app

2. **Connect your GitHub repo:**
   - Link: `https://github.com/Gaurang1544/housie`
   - Railway auto-detects Node.js and runs `npm start`

3. **Railway will:**
   - Set `RAILWAY_PUBLIC_DOMAIN` automatically
   - Generate public URL like `housie-production.up.railway.app`
   - Inject the WebSocket URL into the HTML

4. **Share the Railway URL** with friends anywhere!

## 🎮 How to Play

### Host:
1. Enter your name
2. Click "Create Room"
3. Share the 6-digit code
4. Approve join requests from popup notifications
5. Click "Start Game" when ready
6. Call numbers manually or enable auto-call
7. Review and approve/reject win claims

### Player:
1. Enter your name
2. Enter the 6-digit room code
3. Wait for host approval
4. Mark called numbers on your ticket
5. Claim wins: Top Line, Middle Line, Bottom Line, Full House
6. Scratch the reward card when you win!

## 🎁 Features

- **Real-time WebSocket communication** - instant updates for all players
- **Join approval system** - host controls who enters
- **Beautiful dark UI** - modern gradient design
- **Auto-call mode** - numbers called every 5 seconds
- **Claim validation** - host verifies wins before accepting
- **Scratch card rewards** - motivational quotes with themed designs
- **Responsive design** - works on desktop, tablet, and mobile

## 📁 Files

- `server.js` - Node.js WebSocket server
- `index.html` - Complete game UI and logic
- `package.json` - Dependencies (ws package)
- `railway.toml` - Railway deployment config

## 🔧 Technical Details

- **Server:** Node.js with `ws` WebSocket library
- **Client:** Vanilla JavaScript (no frameworks)
- **State management:** Centralized game state synced across clients
- **Join flow:** Request → Host approval → State sync
- **Claim flow:** Submit → Host validation → Accept/Reject
- **Deployment:** Railway auto-detects and deploys from GitHub

## 🐛 Troubleshooting

**"Server not reachable"**
- Make sure `node server.js` is running
- Check if port 3000 is available
- On Railway, check deployment logs

**Players can't connect**
- Same network: use the Network URL shown in server console
- Internet: deploy to Railway and share that URL

**Join requests not showing**
- Check join request popup at bottom of host screen
- Requests auto-expire after 30 seconds

**Claims not working**
- Player must mark their numbers first
- Host validates before accepting
- Some numbers may not be called yet (shown in validation)

## 📝 License

Open source - feel free to use and modify!

---

**Current Status:** ✅ Fully tested and working
**Server Status:** 🟢 Running on localhost:3000
**Ready for:** Local play and Railway deployment
