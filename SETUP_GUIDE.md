# 📊 Project Timeline - Enterprise Setup Guide

> **Step-by-step instructions for deploying Project Timeline in your enterprise environment**
>
> Created by **Sushma Gundlapally** | © 2025

---

## 📋 Prerequisites

- Git access
- Node.js 18+ (or Docker)
- MongoDB 7.0+ (local, Atlas, or enterprise)
- Network access to your MongoDB instance

---

## Step 1: Clone to Enterprise Git

```bash
# Clone from GitHub to local
git clone https://github.com/sushmagundlapally-ai/project-timeline.git

# Navigate to project
cd project-timeline

# Add your enterprise remote
git remote add enterprise https://your-enterprise-git.company.com/org/project-timeline.git

# Push to enterprise repository
git push enterprise main
```

### Alternative: Download as ZIP
1. Go to https://github.com/sushmagundlapally-ai/project-timeline
2. Click **Code** → **Download ZIP**
3. Extract and push to your enterprise git

---

## Step 2: Configure MongoDB Connection

### 2.1 Create Environment File

```bash
cd server
cp env.example.txt .env
```

### 2.2 Edit `.env` File

Open `.env` in your editor and configure:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Connection (choose one)

# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/project-timeline

# Option B: MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project-timeline?retryWrites=true&w=majority

# Option C: Enterprise MongoDB with Authentication
MONGODB_URI=mongodb://username:password@mongo-host.company.com:27017/project-timeline?authSource=admin

# CORS - Set to your application domain
CORS_ORIGIN=https://project-timeline.company.com
```

### 2.3 MongoDB Connection String Format

| MongoDB Type | Connection String Format |
|--------------|-------------------------|
| Local | `mongodb://localhost:27017/project-timeline` |
| With Auth | `mongodb://user:pass@host:27017/project-timeline?authSource=admin` |
| Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/project-timeline` |
| Replica Set | `mongodb://host1:27017,host2:27017/project-timeline?replicaSet=rs0` |

---

## Step 3: Deploy the Application

### Option A: Docker Deployment (Recommended)

**Best for:** Production environments, easy scaling, consistent deployment

```bash
# Navigate to project root
cd project-timeline

# Set required environment variables
export MONGO_PASSWORD=your-secure-password-here
export CORS_ORIGIN=https://your-app-domain.company.com

# Start all services (MongoDB + App)
docker-compose up -d

# Verify containers are running
docker-compose ps

# View application logs
docker-compose logs -f app
```

**Docker Services Started:**
| Service | Port | Description |
|---------|------|-------------|
| `app` | 3000 | Node.js Application |
| `mongodb` | 27017 | MongoDB Database |
| `mongo-express` | 8081 | MongoDB Web UI (dev only) |

### Option B: Manual Deployment

**Best for:** Development, existing MongoDB, custom infrastructure

```bash
# Navigate to server directory
cd project-timeline/server

# Install dependencies
npm install

# Start in development mode
npm run dev

# OR start in production mode
NODE_ENV=production npm start
```

### Option C: Using Existing MongoDB

If you already have MongoDB running:

1. Skip the MongoDB container in docker-compose:
   ```bash
   docker-compose up -d app
   ```

2. Or run manually with your MongoDB URI:
   ```bash
   MONGODB_URI=mongodb://your-existing-mongo:27017/project-timeline npm start
   ```

---

## Step 4: Verify Installation

### 4.1 Check API Health

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "mongodb": "connected"
}
```

### 4.2 Access the Application

Open in browser: `http://localhost:3000`

### 4.3 Check Logs

```bash
# Docker
docker-compose logs -f app

# Manual
# Logs appear in terminal where npm start was run
```

---

## Step 5: Production Checklist

### 🔐 Security

- [ ] Change default MongoDB password
- [ ] Set `CORS_ORIGIN` to specific domain (not `*`)
- [ ] Enable HTTPS using reverse proxy (nginx/Apache)
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable MongoDB authentication
- [ ] Consider adding SSO/LDAP authentication

### 📦 Backup

- [ ] Set up MongoDB backup schedule
- [ ] Test restore procedure
- [ ] Document backup location

### 📊 Monitoring

- [ ] Set up health check monitoring
- [ ] Configure log aggregation
- [ ] Set up alerts for downtime

---

## 🔧 Common Commands

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart application
docker-compose restart app

# View logs
docker-compose logs -f app

# Check status
docker-compose ps

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d
```

### MongoDB Commands

```bash
# Connect to MongoDB shell (Docker)
docker exec -it project-timeline-db mongosh

# Backup database
docker exec project-timeline-db mongodump --out /backup --db project-timeline

# Restore database
docker exec project-timeline-db mongorestore /backup
```

### Application Commands

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Run tests (if configured)
npm test
```

---

## 🌐 URL Reference

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Main Application |
| `http://localhost:3000/api/health` | Health Check Endpoint |
| `http://localhost:3000/api/programs` | Programs API |
| `http://localhost:8081` | MongoDB Admin UI (dev profile) |

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

```
Error: MongoNetworkError: failed to connect
```

**Solutions:**
1. Check MongoDB is running: `docker-compose ps` or `mongod --version`
2. Verify connection string in `.env`
3. Check network/firewall rules
4. Ensure MongoDB port 27017 is accessible

### Port Already in Use

```
Error: EADDRINUSE: address already in use :::3000
```

**Solutions:**
1. Change port in `.env`: `PORT=3001`
2. Kill existing process: `lsof -i :3000` then `kill -9 <PID>`

### CORS Error in Browser

```
Access-Control-Allow-Origin error
```

**Solutions:**
1. Set correct `CORS_ORIGIN` in `.env`
2. For development, temporarily use `CORS_ORIGIN=*`

### Docker Build Fails

**Solutions:**
1. Clear Docker cache: `docker system prune -a`
2. Rebuild: `docker-compose build --no-cache`

---

## 📞 Support

For issues or questions:
1. Check the [README.md](README.md) for feature documentation
2. Review server logs for error details
3. Contact: Sushma Gundlapally

---

## 📁 File Structure Reference

```
project-timeline/
├── index.html              # Frontend UI
├── styles.css              # Styling
├── script.js               # Frontend JavaScript
├── README.md               # Feature Documentation
├── SETUP_GUIDE.md          # This file
├── Dockerfile              # Docker image config
├── docker-compose.yml      # Full stack deployment
│
└── server/
    ├── package.json        # Node.js dependencies
    ├── server.js           # Express API server
    ├── env.example.txt     # Environment template
    ├── api-client.js       # API helper functions
    │
    ├── models/
    │   └── Program.js      # MongoDB data schema
    │
    └── routes/
        ├── programs.js     # Program API endpoints
        ├── workstreams.js  # Workstream API endpoints
        └── tasks.js        # Task API endpoints
```

---

**Created by Sushma Gundlapally | © 2025 | All Rights Reserved**

