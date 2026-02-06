# Smart Reconciliation System

Full-stack MERN application for automated financial reconciliation with enterprise-grade deployment on Render.

## 🚀 Quick Start

### Deploy to Production

```bash
# 1. Run automated setup
deploy.bat

# 2. Follow step-by-step guide
See DEPLOYMENT_STEPS.md
```

**Total deployment time: ~1 hour**

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, TailwindCSS 4, Radix UI
- **Backend**: Node.js, Express.js, MongoDB
- **Cloud**: Render (auto-deploy from GitHub)
- **Database**: MongoDB Atlas (free tier)

## 📦 Features

- 🔐 JWT authentication with refresh tokens
- 📊 Multi-format file reconciliation (CSV, Excel)
- 📝 Complete audit trail
- ⚡ Optimized builds with code splitting
- 🛡️ Enterprise security (Helmet, rate limiting, XSS protection)
- 📡 Health monitoring and logging

## 🌐 Live Demo

- **Frontend**: https://reconciliation-frontend.onrender.com
- **API**: https://reconciliation-backend.onrender.com/api
- **Health Check**: https://reconciliation-backend.onrender.com/health

## 💻 Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
npm install  
npm run dev
```

## 📚 Documentation

- **Deployment Guide**: `DEPLOYMENT_STEPS.md` - Complete step-by-step deployment
- **Architecture Analysis**: `render_deployment_analysis.md` - Technical details
- **API Docs**: Coming soon

## 🔒 Security

- NoSQL injection protection
- XSS attack prevention
- HTTP parameter pollution protection
- JWT-based authentication
- Rate limiting (100 req/15min)
- Helmet security headers

## 📈 Performance

- Gzip + Brotli compression (60-80% bandwidth reduction)
- Code splitting for vendor bundles
- MongoDB connection pooling
- Optimized Vite builds
- CDN-ready static assets

## 💰 Cost

- **Production**: $0.25 - $7/month
- **Free tier available**: Backend sleeps after inactivity

## 📄 License

MIT

## 👤 Author

Your Name

## 🙏 Acknowledgments

- Built with [Render](https://render.com)
- Database by [MongoDB Atlas](https://mongodb.com)
