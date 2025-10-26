# CK SPORTS Website

A progressive web app (PWA) for football news, fan chat, and predictions, with focus on Vancouver sports coverage.

## Project Structure

```
football_news_site/
├── assets/
│   └── icon.svg               # PWA app icon
├── data/
│   ├── articles.json          # Sample news articles
│   └── messages.json          # Fan chat messages store
├── index.html                 # Main page
├── login.html                 # OTP login page
├── styles.css                 # Site styles
├── script.js                  # Client-side JavaScript
├── manifest.json             # PWA web app manifest
├── service-worker.js         # PWA service worker
├── offline.html              # Offline fallback page
├── simulate_api.py           # Python/Flask simulator backend
└── simulate_client.py        # Test client for API simulation
```

## Features

- Progressive Web App (installable via Chrome)
- Responsive news grid with featured articles
- Fan chat system with real-time updates
- OTP-based authentication
- Offline support via service worker
- Local development server (Python/Flask)

## Quick Start (Development)

1. Install Python dependencies:
```bash
python -m pip install flask
```

2. Start the development server:
```bash
cd football_news_site
python simulate_api.py
```

3. Open in browser:
- Visit http://127.0.0.1:8080
- For OTP login, use code: 123456 (simulation)

## Installing as PWA

1. Open the site in Chrome
2. Look for the install icon in the address bar or click the "Install App" button
3. Follow Chrome's install prompts
4. The app will install and can be launched from your desktop/start menu

## Development Notes

- The site uses a Flask-based simulator (`simulate_api.py`) for development
- Articles are stored in `data/articles.json`
- Chat messages are persisted to `data/messages.json`
- PWA assets:
  - `manifest.json`: Web app manifest
  - `service-worker.js`: Offline support
  - `assets/icon.svg`: App icon

## API Endpoints (Simulator)

- GET `/api/articles` - List news articles
- GET/POST `/api/messages` - Fan chat messages
- POST `/api/request-otp` - Request login OTP
- POST `/api/verify-otp` - Verify OTP code
- GET `/api/auth-status` - Check login status
- POST `/api/logout` - Log out

## Node.js Backend (Optional)

To use the full Node.js backend instead of the simulator:

1. Install Node.js, then:
```bash
cd football_news_site
npm install
npm start
```

2. Set environment variables for the credentials database:
```bash
# PowerShell - generate a key
$key = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
setx CREDENTIALS_DB_KEY $key

# Initialize database
node migrations/init_db.js
```

The Node backend adds:
- SQLite-backed encrypted credentials storage
- Proper session management
- WebSocket-based real-time chat (coming soon)

## Browser Support

- Chrome/Edge (full PWA support)
- Firefox/Safari (works as regular website)
- Offline support varies by browser

## Deployment

To deploy this site to GitHub Pages:

1. Create a new GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/ck-sports.git
git push -u origin main
```

2. Configure GitHub Pages:
- Go to repository Settings → Pages
- Source: GitHub Actions
- The site will be available at `https://USERNAME.github.io/ck-sports/`

3. The included GitHub Action (`.github/workflows/deploy.yml`) will:
- Build and deploy automatically on push to main
- Handle all GitHub Pages configuration
- Make the site available via HTTPS (required for PWA)

## Future Improvements

- Add PNG icons (192x192, 512x512) for better PWA compatibility
- Implement real OTP delivery
- Add WebSocket for real-time chat
- Add custom domain configuration
