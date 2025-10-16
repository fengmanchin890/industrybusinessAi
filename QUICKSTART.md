# Quick Start Guide - AI Business Platform

Get your development environment up and running in minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ **Windows 10/11** with PowerShell 5.1+
- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **Python 3.11+** - [Download](https://www.python.org/)
- ✅ **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- ✅ **Git** - [Download](https://git-scm.com/)

## 🚀 Automated Setup (Recommended)

### Step 1: Clone the Repository

```powershell
git clone https://github.com/your-org/ai-business-platform.git
cd ai-business-platform
```

### Step 2: Run Setup Script

```powershell
.\scripts\setup-dev.ps1
```

This will:
- ✓ Check prerequisites
- ✓ Create `.env` file (you'll need to configure it)
- ✓ Install frontend dependencies
- ✓ Install AI Core dependencies
- ✓ Install Data Connector dependencies
- ✓ Start Docker services (Qdrant, Redis, PostgreSQL, Prometheus, Grafana)

### Step 3: Configure Environment Variables

Edit `.env` file with your credentials:

```env
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI API Keys (at least one required)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Step 4: Start All Services

```powershell
.\scripts\start-services.ps1
```

This starts all services using Docker Compose:
- Frontend (React)
- AI Core (FastAPI)
- Data Connector (FastAPI)
- Qdrant (Vector DB)
- Redis (Cache)
- PostgreSQL (Database)
- Prometheus (Metrics)
- Grafana (Monitoring)

### Step 5: Access the Platform

Open your browser and visit:

- 🌐 **Frontend**: http://localhost:5173
- 🤖 **AI Core API**: http://localhost:8000/docs
- 🔌 **Data Connector**: http://localhost:8001/docs
- 📊 **Grafana**: http://localhost:3000 (admin/admin)
- 📈 **Prometheus**: http://localhost:9090

## 🛠️ Manual Setup (Alternative)

If the automated setup fails or you prefer manual control:

### 1. Install Dependencies

**Frontend:**
```powershell
cd frontend
npm install
cd ..
```

**AI Core:**
```powershell
cd services/ai-core
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..\..
```

**Data Connector:**
```powershell
cd services/data-connector
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ..\..
```

### 2. Start Infrastructure Services

```powershell
cd infra
docker-compose up -d qdrant redis postgres prometheus grafana
cd ..
```

### 3. Start Application Services

**Terminal 1 - AI Core:**
```powershell
cd services/ai-core
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Data Connector:**
```powershell
cd services/data-connector
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

**Terminal 3 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 📝 Verify Installation

### Health Checks

Run these commands to verify services are running:

```powershell
# AI Core
curl http://localhost:8000/health

# Data Connector
curl http://localhost:8001/health

# Frontend (should load in browser)
Start-Process "http://localhost:5173"
```

### Test API Endpoints

**Generate Text:**
```powershell
$headers = @{"Content-Type"="application/json"}
$body = '{"prompt":"Say hello in Chinese"}'
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/nlp/generate" -Method Post -Headers $headers -Body $body
```

**Module Registry:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/modules/registry"
```

## 🔧 Common Issues & Solutions

### Issue: Docker services won't start

**Solution:**
```powershell
docker-compose -f infra/docker-compose.yml down
docker-compose -f infra/docker-compose.yml up -d
```

### Issue: Port already in use

**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Issue: Python virtual environment activation fails

**Solution:**
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: npm install fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## 📚 Next Steps

1. **Explore the API docs**: http://localhost:8000/docs
2. **Check out the modules**: Visit http://localhost:5173 and explore industry modules
3. **Read the full documentation**: See `docs/README.md`
4. **Run tests**: (Coming soon)

## 🆘 Getting Help

- 📖 **Documentation**: See `docs/` folder
- 🐛 **Issues**: Report bugs on GitHub
- 💬 **Discussions**: Join our community

## 🧪 Development Workflow

### Making Changes

1. **Frontend changes**: Hot reload enabled, just save files
2. **Backend changes**: Uvicorn auto-reloads on save
3. **Configuration changes**: Restart services

### Viewing Logs

```powershell
# Docker logs
docker-compose -f infra/docker-compose.yml logs -f

# AI Core logs
cd services/ai-core
type logs\ai-core.log

# Frontend dev server logs
# (displayed in terminal where npm run dev is running)
```

### Stopping Services

```powershell
# Stop Docker services
docker-compose -f infra/docker-compose.yml down

# Stop application services
# Press Ctrl+C in each terminal running uvicorn/npm
```

## 🚢 Production Deployment

For production deployment, see:
- Docker Compose: `infra/docker-compose.prod.yml`
- Kubernetes: `infra/k8s/`
- CI/CD: `.github/workflows/`

---

**Happy Coding! 🎉**

Made with ❤️ for Taiwan SMBs

