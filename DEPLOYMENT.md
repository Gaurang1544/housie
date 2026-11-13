# 🚀 Deployment Guide - Housie Game

## Option 1: Railway (Recommended for Internet Play)

### Why Railway?
- ✅ Free tier available
- ✅ Automatic HTTPS and WebSocket support
- ✅ GitHub integration
- ✅ Zero configuration needed
- ✅ Public URL for worldwide access

### Steps:

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Housie game ready for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to https://railway.app
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo: `Gaurang1544/housie`
   - Railway auto-detects Node.js and deploys

3. **Get Your URL**
   - Railway generates: `housie-production.up.railway.app`
   - WebSocket automatically configured
   - Share this URL with players anywhere!

4. **Play**
   - Open the Railway URL
   - Create room, share code
   - Players join from anywhere in the world

---

## Option 2: Local Network Play

### For Home/Office WiFi Gaming

1. **Start the server**
   ```bash
   cd housie
   node server.js
   ```

2. **Note the Network URL** shown in console:
   ```
   Network: http://192.168.1.X:3000
   ```

3. **Share with players**
   - Everyone must be on the **same WiFi**
   - Players open the Network URL
   - Works on phones, tablets, laptops

---

## Option 3: Other Platforms

### Heroku
1. Add `Procfile`:
   ```
   web: node server.js
   ```
2. Deploy via Heroku CLI or GitHub integration

### Render.com
1. Connect GitHub repo
2. Set build command: `npm install`
3. Set start command: `node server.js`

### DigitalOcean App Platform
1. Connect GitHub repo
2. Auto-detects Node.js
3. Deploys with one click

---

## Environment Variables

The server automatically detects the platform:

- **Railway**: Uses `RAILWAY_PUBLIC_DOMAIN`
- **Heroku**: Uses `PORT` environment variable
- **Local**: Defaults to `localhost:3000`

No manual configuration needed!

---

## Troubleshooting Deployment

### Railway Issues

**Build fails:**
- Check `package.json` has `"start": "node server.js"`
- Verify `ws` package in dependencies

**WebSocket not connecting:**
- Railway handles this automatically
- Check browser console for errors
- Ensure using HTTPS (not HTTP)

**Page loads but join doesn't work:**
- Check if WebSocket URL is injected (view page source)
- Look for `<meta name="ws-url" content="...">`

### Local Network Issues

**Players can't connect:**
- Check firewall allows port 3000
- Verify all devices on same network
- Use the Network IP, not localhost

**Connection drops:**
- Ensure server stays running
- Check WiFi stability
- Restart server if needed

---

## Post-Deployment Checklist

After deploying, test these:

- [ ] Page loads correctly
- [ ] Can create a room
- [ ] Join request shows up for host
- [ ] Host can approve/deny join
- [ ] Game starts for all players
- [ ] Numbers appear when called
- [ ] Player can mark ticket
- [ ] Claims work end-to-end
- [ ] Win banner and scratch card appear

---

## Monitoring

### Railway
- View logs in Railway dashboard
- Check "Deployments" tab for build status
- Monitor metrics in "Metrics" tab

### Local
- Server logs appear in terminal
- Watch for connection/disconnection messages
- Check for errors

---

## Scaling

The current setup supports:
- ✅ Multiple simultaneous rooms
- ✅ Unlimited players per room
- ✅ No database needed (in-memory state)

For very large scale (100+ rooms), consider:
- Adding Redis for state persistence
- Load balancing multiple server instances
- Database for room persistence

---

## Security Notes

✅ **Already implemented:**
- Host approval required for joins
- Claim validation before accepting
- WebSocket message validation
- No direct database access

⚠️ **For production at scale:**
- Add rate limiting
- Implement room passwords (optional)
- Add CAPTCHA for join requests
- Monitor for abuse

---

## Quick Deploy Commands

```bash
# Railway
railway login
railway init
railway up

# Or use Railway dashboard (recommended)

# Heroku
heroku create housie-game
git push heroku main

# Local testing
node server.js
# Open http://localhost:3000
```

---

**Current Status:** 🟢 Ready to deploy
**Recommended:** Railway (easiest, free, works worldwide)
**Local play:** Works perfectly for same-network gaming

🎉 Deploy and enjoy! 🎉
