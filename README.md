# 📊 Project Timeline

> **Visual Gantt Chart Tool for Tracking Workstreams, Tasks, and Deadlines**
> 
> Created by **Sushma Gundlapally** | © 2025

![Project Timeline](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Node](https://img.shields.io/badge/Node.js-18+-brightgreen)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)

## ✨ Features

- 📊 **Visual Gantt Chart** - Interactive timeline view with drag-and-drop
- 🎯 **Multi-Program Management** - Manage multiple programs with URL-based routing
- 🤖 **AI-Powered Health Score** - Automatic program health calculation
- 📝 **Executive Summary** - Generate comprehensive status reports
- 📋 **Bulk Upload** - Import multiple tasks at once
- 🔗 **Task Dependencies** - Track parallel and dependent tasks
- 💬 **Comments** - Add notes and updates to tasks
- 📊 **Google Sheets Integration** - Import/Export CSV data
- ⚠️ **Risk Tracking** - Visual risk indicators with tooltips

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│   index.html + styles.css + script.js                           │
│   (Can run standalone with localStorage)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │ API Calls
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NODE.JS SERVER                              │
│   server/server.js - Express.js REST API                        │
│   └── routes/programs.js, workstreams.js, tasks.js              │
└────────────────────────────┬────────────────────────────────────┘
                             │ Mongoose ODM
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB                                   │
│   Database: project-timeline                                     │
│   Collection: programs                                           │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Standalone (Browser Only)

Just open `index.html` in a browser. Data stored in localStorage.

```bash
# Clone and open
git clone https://github.com/your-org/project-timeline.git
cd project-timeline
open index.html
```

### Option 2: With MongoDB (Enterprise)

#### Prerequisites
- Node.js 18+
- MongoDB 7.0+ (or MongoDB Atlas)

#### Installation

```bash
# Clone repository
git clone https://github.com/your-org/project-timeline.git
cd project-timeline/server

# Install dependencies
npm install

# Configure environment
cp env.example.txt .env
# Edit .env with your MongoDB connection string

# Start server
npm start
```

### Option 3: Docker (Recommended for Production)

```bash
# Clone repository
git clone https://github.com/your-org/project-timeline.git
cd project-timeline

# Set MongoDB password
export MONGO_PASSWORD=your-secure-password

# Start with Docker Compose
docker-compose up -d

# Access application
open http://localhost:3000
```

## 📁 File Structure

```
project-timeline/
├── index.html              # Main UI
├── styles.css              # Styling (Dark Theme)
├── script.js               # Frontend Logic
├── README.md               # This file
├── Dockerfile              # Docker image config
├── docker-compose.yml      # Docker orchestration
│
└── server/                 # Backend (Node.js)
    ├── package.json        # Dependencies
    ├── server.js           # Express server
    ├── env.example.txt     # Environment template
    ├── api-client.js       # Frontend API helper
    │
    ├── models/
    │   └── Program.js      # MongoDB Schema
    │
    └── routes/
        ├── programs.js     # Program endpoints
        ├── workstreams.js  # Workstream endpoints
        └── tasks.js        # Task endpoints
```

## 🔌 API Endpoints

### Programs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/programs` | List all programs |
| GET | `/api/programs/:id` | Get program details |
| POST | `/api/programs` | Create program |
| PUT | `/api/programs/:id` | Update program |
| DELETE | `/api/programs/:id` | Delete program |
| GET | `/api/programs/:id/health` | Get health score |
| GET | `/api/programs/:id/export` | Export program data |

### Workstreams
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workstreams/:programId` | Add workstream |
| PUT | `/api/workstreams/:programId/:wsId` | Update workstream |
| DELETE | `/api/workstreams/:programId/:wsId` | Delete workstream |
| POST | `/api/workstreams/:programId/:wsId/bulk-tasks` | Bulk add tasks |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/:programId/:wsId` | Add task |
| PUT | `/api/tasks/:programId/:wsId/:taskId` | Update task |
| DELETE | `/api/tasks/:programId/:wsId/:taskId` | Delete task |
| POST | `/api/tasks/.../comments` | Add comment |
| DELETE | `/api/tasks/.../comments/:commentId` | Delete comment |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/project-timeline` |
| `CORS_ORIGIN` | Allowed origins | `*` |

### MongoDB Connection Examples

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/project-timeline

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/project-timeline

# Enterprise MongoDB with Auth
MONGODB_URI=mongodb://user:pass@host:27017/project-timeline?authSource=admin
```

## 📊 Health Score Algorithm

The program health score (0-100) is calculated based on:

```javascript
let score = 100;
score -= blockedTasks% * 2;      // -2 per % blocked
score -= atRiskTasks% * 1.5;     // -1.5 per % at-risk
score -= highRiskTasks% * 1;     // -1 per % high-risk
score -= overdueTasks * 3;       // -3 per overdue task
score += completedTasks% * 0.3;  // +0.3 bonus per % complete
```

| Score | Status |
|-------|--------|
| 80-100 | 🟢 Healthy |
| 60-79 | 🟡 Needs Attention |
| 40-59 | 🟠 At Risk |
| 0-39 | 🔴 Critical |

## 🔐 Security Considerations

For enterprise deployment:

1. **Authentication** - Add JWT/OAuth authentication
2. **HTTPS** - Use TLS certificates
3. **CORS** - Restrict to specific origins
4. **Rate Limiting** - Add request throttling
5. **Input Validation** - Sanitize all inputs
6. **Audit Logging** - Track all changes

## 📝 License

MIT License - © 2025 Sushma Gundlapally

---

**Created with ❤️ by Sushma Gundlapally**

