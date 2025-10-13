# AI Business Platform - 完整功能文档

> 为台湾中小企业提供即插即用的 AI 解决方案

## 📋 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [行业解决方案](#行业解决方案)
- [模块开发](#模块开发)
- [部署指南](#部署指南)
- [API 文档](#api-文档)

## 项目概述

AI Business Platform 是一个多租户 SaaS 平台，专为台湾 8 大产业提供定制化 AI 解决方案：

- 🏭 **制造业** - 品检、预测维护、数据连接
- 🍜 **餐饮业** - 语音点餐、库存预测、行销助手
- 🛍️ **零售/电商** - 智能搜索、推荐系统、售后助理
- 🏢 **中小企业** - Office Agent、虚拟助理、财务分析
- 🏥 **医疗/健康** - 病历助理、长照监测、会议摘要
- 🚚 **物流/仓储** - 路线优化、仓储视觉、排班系统
- 🏦 **金融/保险** - 金融客服、诈欺检测、文件审核
- 🎓 **政府/教育** - 公文助理、学习助教、资讯问答

### 核心特色

✅ **即插即用** - 无需编程知识，5 分钟完成配置
✅ **行业定制** - 根据行业自动推荐合适的 AI 模块
✅ **模块化架构** - 20+ 个 AI 模块可自由组合
✅ **实时数据** - 支持实时监控与警示
✅ **移动端支持** - 响应式设计 + PWA
✅ **安全可靠** - Row Level Security 数据隔离
✅ **快速 ROI** - 平均 2-6 个月回本

## 核心功能

### 1. 多行业配置系统

根据公司所属行业自动配置：
- 行业专属仪表板布局
- 推荐 AI 模块清单
- 痛点分析与解决方案
- 预设参数配置

**实现文件：**
- `config/industries.ts` - 8 大行业配置
- `DashBoard/IndustryDashboard.tsx` - 动态仪表板

### 2. 模块插件架构

基于 Module SDK 的插件系统：

```typescript
// 模块基类
export class ModuleBase {
  // 生命周期
  onInstall(), onEnable(), onDisable(), onUninstall()
  
  // 数据处理
  processData(), validateData(), transformData()
  
  // 渲染
  render(context: ModuleContext): ReactNode
}
```

**核心组件：**
- `Modules/ModuleSDK/ModuleBase.ts` - 模块基类
- `Modules/ModuleSDK/ModuleHooks.ts` - React Hooks
- `Modules/ModuleSDK/ModuleAPI.ts` - API 接口

### 3. AI 模块库

#### 制造业模块
- **AI 品检模组** - 视觉检测，瑕疵识别
- **预测性维护** - 声音异常检测，故障预警
- **工业数据连接器** - PLC/MES/Excel 整合

#### 餐饮业模块
- **AI 点餐助理** - 台语+中文语音点餐
- **AI 进货预测** - 智能库存管理
- **AI 行销助手** - 自动生成图文

#### 零售/电商模块
- **AI 智能搜索** - 语义搜索
- **AI 推荐系统** - 个性化推荐
- **AI 售后助理** - 自动客服

#### 中小企业模块
- **AI Office Agent** - 文书自动化
- **AI 虚拟助理** - 行销+客服整合
- **AI 财务分析** - 现金流预测

### 4. 实时仪表板

动态配置的仪表板系统：
- **Metrics Widget** - 关键指标展示
- **Charts Widget** - 数据视觉化
- **Alerts Widget** - 警示信息
- **Quick Actions** - 快速操作

### 5. 移动端支持

- **响应式设计** - 完美适配所有屏幕
- **PWA 支持** - 可安装到桌面
- **离线功能** - Service Worker 缓存
- **Mobile 组件** - 专用移动端导航

**实现文件：**
- `src/components/Mobile/MobileNav.tsx`
- `src/components/Mobile/MobileHeader.tsx`
- `src/components/Mobile/MobileBottomTab.tsx`
- `public/manifest.json`

## 技术架构

### 前端技术栈
- **React 18** + **TypeScript** - UI 框架
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

### 后端技术栈
- **Supabase** - BaaS 平台
- **PostgreSQL** - 关系数据库
- **Row Level Security** - 数据隔离
- **Realtime** - 实时订阅

### 数据库架构

**核心数据表：**
- `companies` - 公司信息
- `users` - 用户账号
- `ai_modules` - AI 模块
- `company_modules` - 已安装模块
- `reports` - 报表
- `alerts` - 警示
- `data_connections` - 数据连接
- `industry_configs` - 行业配置
- `dashboard_widgets` - 仪表板小部件

**Migrations：**
```
supabase/migrations/
├── 20251013100606_create_ai_platform_schema.sql
├── 20251013110000_fix_rls_policies.sql
├── 20251013120000_fix_infinite_recursion.sql
└── 20251013130000_add_industry_features.sql
```

## 行业解决方案

### 制造业
- 详细文档：[docs/industries/manufacturing.md](docs/industries/manufacturing.md)
- 痛点：品检、维护、数据整合
- ROI：2-6 个月回本
- 案例：精密零件厂、塑胶射出厂

### 餐饮业
- 详细文档：[docs/industries/food-beverage.md](docs/industries/food-beverage.md)
- 痛点：人力、库存、行销、客户
- ROI：2-4 个月回本
- 案例：早午餐店、连锁火锅、日式料理

### 更多行业文档
- [零售/电商](docs/industries/retail.md)
- [中小企业](docs/industries/sme.md)
- [医疗/健康](docs/industries/healthcare.md)
- [物流/仓储](docs/industries/logistics.md)
- [金融/保险](docs/industries/finance.md)
- [政府/教育](docs/industries/government.md)

## 模块开发

### 快速开始

```bash
# 生成新模块
npm run generate-module -- --name MyModule --category manufacturing

# 或手动创建
# 参考：docs/guides/module-development.md
```

### 模块结构

```
Modules/Industry/{Category}/{ModuleName}.tsx
├── Metadata（元数据）
├── Capabilities（能力声明）
├── Component（React 组件）
└── Module Class（模块类）
```

### 开发文档
- [模块开发指南](docs/guides/module-development.md)
- [行业定制指南](docs/guides/industry-customization.md)
- [UI 组件库](docs/guides/ui-components.md)
- [数据集成指南](docs/guides/data-integration.md)

## 部署指南

### 环境变量

```bash
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 构建生产版本
npm run build
```

### 数据库设置

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 初始化项目
supabase init

# 运行 migrations
supabase db push

# 导入模块数据
node scripts/seed-modules.js
```

### Edge Function：sync-dataset 部署

此 Function 会根据 `data_connections` 的设置，从外部 POS/ERP 取回菜单或销售资料并写入数据库，若外部 API 无回传则使用范例资料。

1) Dashboard 部署
- Edge Functions → New → 名称 `sync-dataset`
- 将 `supabase/functions/sync-dataset/index.ts` 内容贴入
- 设置环境变量：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`
- Deploy，复制 Public URL（例如 `https://<PROJECT_REF>.functions.supabase.co/sync-dataset`）

2) CLI 部署（可选）
```bash
npm i -g supabase
supabase login
supabase link --project-ref <PROJECT_REF>
supabase functions deploy sync-dataset --no-verify-jwt
supabase secrets set SUPABASE_URL=https://<PROJECT_REF>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

3) 前端环境变量（Vite）
```env
VITE_EDGE_URL=https://<PROJECT_REF>.functions.supabase.co
VITE_ANON_KEY=<你的 anon key>
```

4) PowerShell 测试（单行贴上）
```powershell
$func = "https://<PROJECT_REF>.functions.supabase.co/sync-dataset"; $headers = @{"Content-Type"="application/json";"Authorization"="Bearer <ANON_KEY>"}; $body = '{"company_id":"<COMPANY_ID>","connection_id":"<CONNECTION_ID>","dataset":"menu"}'; Invoke-RestMethod -Method Post -Uri $func -Headers $headers -Body $body
```

### 生产部署

**Vercel 部署：**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

**Netlify 部署：**
```bash
# 构建
npm run build

# 部署 dist/ 目录
```

## API 文档

### REST API
- [API 总览](docs/api/README.md)
- [Supabase REST API](docs/api/rest-api.md)
- [Module API](docs/api/module-api.md)

### Realtime API
- [实时订阅](docs/api/realtime-api.md)
- [Webhook 集成](docs/api/webhooks.md)

## 项目结构

```
ai-business-platform/
├── config/                    # 配置文件
│   └── industries.ts         # 行业配置
├── Contexts/                  # React Context
│   └── AuthContext.tsx       # 认证上下文
├── DashBoard/                # 仪表板
│   ├── DashBoardLayout.tsx
│   └── Overview.tsx
├── Modules/                   # AI 模块
│   ├── ModuleSDK/            # 模块开发 SDK
│   │   ├── ModuleBase.ts
│   │   ├── ModuleHooks.ts
│   │   ├── ModuleAPI.ts
│   │   └── index.ts
│   └── Industry/             # 行业模块
│       ├── Manufacturing/
│       ├── FoodBeverage/
│       ├── Retail/
│       └── SME/
├── src/components/           # React 组件
│   ├── Auth/                 # 认证组件
│   ├── Alerts/               # 警示组件
│   └── Mobile/               # 移动端组件
├── lib/                      # 工具库
│   └── supabase.ts          # Supabase 客户端
├── supabase/migrations/      # 数据库迁移
├── docs/                     # 文档
│   ├── architecture/         # 架构文档
│   ├── api/                  # API 文档
│   ├── guides/               # 开发指南
│   ├── industries/           # 行业方案
│   └── examples/             # 示例代码
├── scripts/                  # 脚本工具
│   └── seed-modules.js      # 数据导入
└── public/                   # 静态资源
    └── manifest.json         # PWA 配置
```

## 开发路线图

### ✅ Phase 1: 核心架构（已完成）
- ✅ 行业配置系统
- ✅ 模块插件架构
- ✅ 数据库 Schema
- ✅ RLS 策略

### ✅ Phase 2: 行业模块（已完成）
- ✅ 制造业模块（3个）
- ✅ 餐饮业模块（3个）
- ✅ 零售/电商模块（3个）
- ✅ 中小企业模块（3个）

### ✅ Phase 3: 移动端支持（已完成）
- ✅ 响应式设计
- ✅ PWA 配置
- ✅ 移动端组件

### ✅ Phase 4: 文档体系（已完成）
- ✅ 架构文档
- ✅ 开发指南
- ✅ 行业解决方案
- ✅ API 文档

### 🚧 Phase 5: 其他行业（进行中）
- ⏳ 医疗/健康模块
- ⏳ 物流/仓储模块
- ⏳ 金融/保险模块
- ⏳ 政府/教育模块

### 📅 Phase 6: 高级功能（计划中）
- ⏳ 多语言支持（i18n）
- ⏳ 高级分析报表
- ⏳ 工作流自动化
- ⏳ API Marketplace

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 使用 TypeScript
- 遵循 ESLint 规则
- 编写单元测试
- 更新相关文档

## 授权

本项目采用 MIT 授权。详见 [LICENSE](LICENSE) 文件。

## 联系我们

- 📧 Email: support@aiplatform.tw
- 🌐 官网: www.aiplatform.tw
- 💬 LINE: @aiplatform
- 📱 电话: 0800-123-456

## 致谢

感谢以下开源项目：
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Lucide](https://lucide.dev/)

---

**Made with ❤️ for Taiwan SMBs**

