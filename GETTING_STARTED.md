# Getting Started with Ripple

## Prerequisites
- Node.js 16+
- npm or yarn
- MongoDB (local or Atlas)

## Quick Start

1. Clone and install:
```bash
git clone https://github.com/casperm8/Ripple-GitHub-ai.git
cd Ripple-GitHub-ai
npm install
```

2. Configure environment:
```bash
cp backend/.env.example backend/.env
```

3. Start services:
```bash
# Terminal 1 - Backend
npm run dev -w backend

# Terminal 2 - Web
npm run dev -w web

# Terminal 3 - Mobile
npm run dev -w mobile
```

4. Access:
- API: http://localhost:5000/api/health
- Web: http://localhost:3000
- Mobile: Expo app
