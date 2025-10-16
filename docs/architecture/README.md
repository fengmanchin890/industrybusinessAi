# AI Business Platform - 架构总览

## 目录
- [系统简介](#系统简介)
- [技术栈](#技术栈)
- [架构设计](#架构设计)
- [核心模块](#核心模块)
- [数据流](#数据流)

## 系统简介

AI Business Platform 是一个为台湾中小企业设计的即插即用 AI 解决方案平台。平台支持 9 大产业，提供超过 30+ 个行业专属 AI 模块，帮助企业快速导入 AI 技术。

### 核心特色

- **多行业支持**：制造、餐饮、零售、物流、医疗、金融、政府、教育、中小企业
- **模块化架构**：基于插件系统，模块可独立开发和部署
- **低代码配置**：无需编程知识即可配置和使用 AI 功能
- **实时数据处理**：支持实时数据流和即时警示
- **移动端友好**：响应式设计 + PWA 支持

## 技术栈

### 前端
- **React 18**：UI 框架
- **TypeScript**：类型安全的 JavaScript
- **Vite**：快速的开发构建工具
- **Tailwind CSS**：实用优先的 CSS 框架
- **Lucide React**：现代化图标库
- **PapaParse**：CSV 数据解析处理

### 后端
- **Supabase**：后端即服务（BaaS）
  - PostgreSQL 数据库
  - Row Level Security (RLS)
  - 实时订阅
  - 认证授权

### 部署
- **Vercel/Netlify**：前端部署
- **Supabase Cloud**：后端服务
- **PWA Support**：离线功能支持

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────┐
│         用户界面层（UI Layer）            │
├─────────────────────────────────────────┤
│  React Components + Tailwind CSS        │
│  - 仪表板                                │
│  - 模块视图                              │
│  - 设置与配置                            │
│  - 移动端优化（PWA）                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      业务逻辑层（Business Logic）         │
├─────────────────────────────────────────┤
│  - 行业配置系统（9大产业）                │
│  - 模块插件架构 (Module SDK)             │
│  - 认证授权 (AuthContext)                │
│  - 数据处理与转换                        │
│  - AI 服务整合层                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       数据访问层（Data Layer）            │
├─────────────────────────────────────────┤
│  Supabase Client                         │
│  - REST API                              │
│  - Realtime Subscriptions                │
│  - Storage                               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        数据库层（Database）               │
├─────────────────────────────────────────┤
│  PostgreSQL + RLS                        │
│  - companies                             │
│  - users                                 │
│  - ai_modules                            │
│  - company_modules                       │
│  - reports / alerts                      │
│  - data_connections                      │
│  - industry_configs                      │
│  - dashboard_widgets                     │
└─────────────────────────────────────────┘
```

### 模块插件架构

```
┌───────────────────────────────────┐
│      Module Base Class            │
│  (抽象基类 - 所有模块的基础)        │
├───────────────────────────────────┤
│  - Metadata                       │
│  - Capabilities                   │
│  - Lifecycle Hooks                │
│  - Data Processing                │
└───────────────────────────────────┘
            ↓ 继承
┌───────────────────────────────────┐
│    Industry-Specific Modules      │
│         (30+ 模块)                 │
├───────────────────────────────────┤
│  Manufacturing/                   │
│  ├── QualityInspection            │
│  └── PredictiveMaintenance        │
│                                   │
│  FoodBeverage/                    │
│  ├── VoiceOrdering                │
│  └── PurchaseForecast             │
│                                   │
│  Retail/                          │
│  └── SemanticSearch               │
│                                   │
│  Logistics/                       │
│  ├── RouteOptimizer               │
│  ├── InventoryOptimizer           │
│  ├── DeliveryAssistant            │
│  └── WarehouseScheduler           │
│                                   │
│  Healthcare/                      │
│  ├── PatientMonitoring            │
│  ├── MedicalRecordAssistant       │
│  ├── DrugInteractionChecker       │
│  └── ElderCareMonitoring          │
│                                   │
│  Finance/                         │
│  ├── FraudDetection               │
│  ├── RiskAssessment               │
│  ├── InvestmentAnalyzer           │
│  └── DocumentReview               │
│                                   │
│  Government/                      │
│  ├── DocumentAssistant            │
│  ├── PolicyAnalysis               │
│  └── CitizenService               │
│                                   │
│  Education/                       │
│  ├── LearningAssistant            │
│  ├── CurriculumOptimizer          │
│  └── StudentPerformance           │
│                                   │
│  SME/                             │
│  ├── CustomerServiceBot           │
│  ├── MarketingAssistant           │
│  ├── FinancialAnalyzer            │
│  ├── OfficeAgent                  │
│  └── WorkflowAutomation           │
└───────────────────────────────────┘
```

## 核心模块

### 1. 认证模块（AuthContext）

负责用户认证、会话管理、公司信息加载。

**主要功能：**
- 用户登录/注册
- 会话持久化
- 用户资料管理
- 公司信息管理

### 2. 行业配置系统

根据公司所属行业提供定制化配置。支持 9 大产业：

**产业列表：**
1. 制造业 (Manufacturing)
2. 餐饮业 (Food & Beverage)
3. 零售/电商 (Retail & E-commerce)
4. 物流/仓储 (Logistics & Warehousing)
5. 医疗/健康 (Healthcare)
6. 金融/保险 (Finance & Insurance)
7. 政府 (Government)
8. 教育 (Education)
9. 中小企业 (SME)

**配置内容：**
- 行业痛点分析
- 推荐 AI 模块
- 仪表板布局
- 默认设置

### 3. 模块 SDK

提供统一的模块开发接口。

**核心组件：**
- `ModuleBase`：模块基类
- `ModuleHooks`：React Hooks
- `ModuleAPI`：平台 API 接口

**已实现模块（30+ 个）：**

#### 制造业模块 (2)
- 质量检测 (QualityInspection)
- 预测性维护 (PredictiveMaintenance)

#### 餐饮业模块 (2)
- 语音点餐 (VoiceOrdering)
- 采购预测 (PurchaseForecast)

#### 零售模块 (1)
- 智能搜索 (SemanticSearch)

#### 物流模块 (4)
- 路线优化 (RouteOptimizer)
- 库存优化 (InventoryOptimizer)
- 配送助理 (DeliveryAssistant)
- 仓储排班 (WarehouseScheduler)

#### 医疗模块 (4)
- 病患监测 (PatientMonitoring)
- 病历助理 (MedicalRecordAssistant)
- 药物交互检查 (DrugInteractionChecker)
- 长照监测 (ElderCareMonitoring)

#### 金融模块 (4)
- 欺诈检测 (FraudDetection)
- 风险评估 (RiskAssessment)
- 投资分析 (InvestmentAnalyzer)
- 文件审查 (DocumentReview)

#### 政府模块 (3)
- 公文助理 (DocumentAssistant)
- 政策分析 (PolicyAnalysis)
- 民众服务 (CitizenService)

#### 教育模块 (3)
- 学习助理 (LearningAssistant)
- 课程优化 (CurriculumOptimizer)
- 学生表现分析 (StudentPerformance)

#### 中小企业模块 (5)
- 客服机器人 (CustomerServiceBot)
- 营销助理 (MarketingAssistant)
- 财务分析 (FinancialAnalyzer)
- 办公助理 (OfficeAgent)
- 工作流自动化 (WorkflowAutomation)

### 4. 仪表板系统

动态仪表板，根据行业和用户配置展示不同内容。

**小部件类型：**
- Metrics：指标展示
- Charts：图表分析
- Alerts：警示信息
- Quick Actions：快速操作

### 5. AI 服务层

AI 功能整合与调用。

**核心服务：**
- `ai-service.ts`：AI 服务主模块
- `ai-service-v2.ts`：AI 服务升级版
- 支持多种 AI 能力调用
- 统一的错误处理和重试机制

### 6. 移动端优化

PWA 支持与移动端适配。

**功能特性：**
- 响应式设计
- 离线功能支持
- 底部导航栏
- 移动端专属组件
- Service Worker 缓存

## 数据流

### 用户认证流程

```
用户登录
  ↓
Supabase Auth
  ↓
获取用户资料（users 表）
  ↓
获取公司信息（companies 表）
  ↓
加载行业配置（industry_configs）
  ↓
渲染定制化仪表板
```

### 模块数据处理流程

```
用户操作模块
  ↓
模块处理数据（Module SDK）
  ↓
调用 ModuleAPI
  ↓
写入数据库（reports/alerts）
  ↓
触发实时更新（Realtime）
  ↓
UI 自动刷新
```

### PWA 离线流程

```
Service Worker 注册
  ↓
缓存关键资源
  ↓
离线时使用缓存
  ↓
恢复连接时同步数据
```

## 安全性

### Row Level Security (RLS)

所有数据表都启用 RLS，确保：
- 用户只能访问自己公司的数据
- 管理员才能修改公司配置
- 模块只能访问授权的数据

### 认证流程

使用 Supabase Auth：
- JWT Token 认证
- 自动刷新 Token
- 安全的密码存储
- 多因素认证支持（可选）

### 数据保护

- 敏感数据加密存储
- HTTPS 传输加密
- API 请求限流
- XSS 和 CSRF 防护

## 性能优化

- **代码分割**：按路由和模块懒加载
- **数据缓存**：React Query 缓存
- **实时更新**：仅订阅必要的数据变更
- **图片优化**：懒加载和渐进式加载
- **PWA 缓存**：Service Worker 离线支持
- **按需加载**：模块动态导入

## 扩展性

### 添加新行业

1. 在 `config/industries.ts` 添加配置
2. 创建行业专属模块目录 `Modules/Industry/{IndustryName}/`
3. 更新数据库 seed 数据
4. 添加行业图标和主题配置

### 开发新模块

1. 在对应行业目录下创建模块文件
2. 继承 `ModuleBase` 类或使用 React 组件
3. 实现模块核心功能
4. 添加到 `industries.ts` 推荐模块列表
5. 更新数据库模块配置

详见：[模块开发指南](../guides/module-development.md)

### 添加新功能

1. **AI 能力扩展**：在 `ai-service.ts` 或 `ai-service-v2.ts` 添加新服务
2. **仪表板组件**：在 `DashBoard/` 目录添加新组件
3. **移动端优化**：在 `src/components/Mobile/` 添加移动端组件

## 项目结构

```
frontend/
├── Modules/                    # 模块系统
│   ├── Industry/              # 行业模块
│   │   ├── Manufacturing/
│   │   ├── FoodBeverage/
│   │   ├── Retail/
│   │   ├── Logistics/
│   │   ├── Healthcare/
│   │   ├── Finance/
│   │   ├── Government/
│   │   ├── Education/
│   │   └── SME/
│   ├── ModuleSDK/             # 模块开发工具
│   └── ModuleRunner.tsx       # 模块运行器
├── DashBoard/                 # 仪表板
├── src/components/            # 共享组件
│   ├── Auth/                  # 认证组件
│   ├── Alerts/                # 警示组件
│   └── Mobile/                # 移动端组件
├── Contexts/                  # React Context
├── config/                    # 配置文件
├── lib/                       # 核心库
│   ├── supabase.ts           # Supabase 客户端
│   ├── ai-service.ts         # AI 服务
│   └── module-loader.ts      # 模块加载器
└── public/                    # 静态资源
    ├── sw.js                 # Service Worker
    └── manifest.json         # PWA 配置
```

## 相关文档

- [技术栈详解](./tech-stack.md)
- [数据库架构](./database-schema.md)
- [模块系统](./module-system.md)
- [认证授权](./authentication.md)
- [PWA 实现指南](./pwa-guide.md)
- [移动端优化](./mobile-optimization.md)

