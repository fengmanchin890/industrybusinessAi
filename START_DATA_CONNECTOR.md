# 🚀 启动 Data Connector 服务

## 当前状态
- ✅ AI Core: 运行中 (端口 8000)
- ❌ Data Connector: 未运行 (需要启动)

## 📋 启动步骤

### 方法 1: 使用新终端窗口 (推荐)

1. **打开新的 PowerShell 或 CMD 窗口**

2. **切换到 Data Connector 目录**:
   ```bash
   cd "C:\Users\User\Desktop\ai business platform\services\data-connector"
   ```

3. **启动服务**:
   ```bash
   python -m app.main
   ```

4. **等待看到**:
   ```
   INFO: Uvicorn running on http://0.0.0.0:8001
   INFO: Application startup complete.
   ```

### 方法 2: 使用启动脚本

双击运行：
```
C:\Users\User\Desktop\ai business platform\services\data-connector\START_SERVICE.bat
```

## ✅ 验证服务

服务启动后，在浏览器打开：
- **Health Check**: http://localhost:8001/health
- **API Docs**: http://localhost:8001/docs

预期响应：
```json
{
  "status": "ok",
  "service": "data-connector",
  "version": "0.1.0"
}
```

## 📊 完整服务列表

启动后，您应该有3个服务运行：

| 服务 | 端口 | URL | 状态 |
|------|------|-----|------|
| Frontend | 5173 | http://localhost:5173 | ✅ |
| AI Core | 8000 | http://localhost:8000 | ✅ |
| Data Connector | 8001 | http://localhost:8001 | ⏳ 启动中 |

## 🔍 故障排查

### 问题：端口被占用
```bash
# 查找占用端口8001的进程
netstat -ano | findstr :8001

# 终止进程 (替换 PID)
taskkill /PID <进程ID> /F
```

### 问题：模块未找到
```bash
cd services/data-connector
pip install -r requirements.txt
```

---

**请按照方法1手动启动 Data Connector！**

