# AI Business Platform - 架构总览

## 目录
- [系统简介](#系统简介)
- [技术栈](#技术栈)
- [架构设计](#架构设计)
- [核心模块](#核心模块)
- [数据流](#数据流)

## 系统简介

AI Business Platform 是一个为台湾中小企业设计的即插即用 AI 解决方案平台。平台支持 8 大产业，提供超过 20+ 个行业专属 AI 模块，帮助企业快速导入 AI 技术。

### 核心特色

- **多行业支持**：制造、餐饮、零售、物流、医疗、金融、政府、中小企业
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

### 后端
- **Supabase**：后端即服务（BaaS）
  - PostgreSQL 数据库
  - Row Level Security (RLS)
  - 实时订阅
  - 认证授权

### 部署
- **Vercel/Netlify**：前端部署
- **Supabase Cloud**：后端服务

## 架构设计

### 整体架构

\`\`\`
┌─────────────────────────────────────────┐
│         用户界面层（UI Layer）            │
├─────────────────────────────────────────┤
│  React Components + Tailwind CSS        │
│  - 仪表板                                │
│  - 模块视图                              │
│  - 设置与配置                            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      业务逻辑层（Business Logic）         │
├─────────────────────────────────────────┤
│  - 行业配置系统                          │
│  - 模块插件架构 (Module SDK)             │
│  - 认证授权 (AuthContext)                │
│  - 数据处理与转换                        │
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
\`\`\`

### 模块插件架构

\`\`\`
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
├───────────────────────────────────┤
│  Manufacturing/                   │
│  ├── QualityInspection            │
│  ├── PredictiveMaintenance        │
│  └── DataConnector                │
│                                   │
│  FoodBeverage/                    │
│  ├── VoiceOrdering                │
│  ├── InventoryForecasting         │
│  └── MarketingAssistant           │
│                                   │
│  Retail/                          │
│  ├── SemanticSearch               │
│  └── RecommendationEngine         │
└───────────────────────────────────┘
\`\`\`

## 核心模块

### 1. 认证模块（AuthContext）

负责用户认证、会话管理、公司信息加载。

**主要功能：**
- 用户登录/注册
- 会话持久化
- 用户资料管理
- 公司信息管理

### 2. 行业配置系统

根据公司所属行业提供定制化配置。

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

### 4. 仪表板系统

动态仪表板，根据行业和用户配置展示不同内容。

**小部件类型：**
- Metrics：指标展示
- Charts：图表分析
- Alerts：警示信息
- Quick Actions：快速操作

## 数据流

### 用户认证流程

\`\`\`
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
\`\`\`

### 模块数据处理流程

\`\`\`
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
\`\`\`

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

## 性能优化

- **代码分割**：按路由和模块懒加载
- **数据缓存**：React Query 缓存
- **实时更新**：仅订阅必要的数据变更
- **图片优化**：懒加载和渐进式加载

## 扩展性

### 添加新行业

1. 在 `config/industries.ts` 添加配置
2. 创建行业专属模块
3. 更新数据库 seed 数据

### 开发新模块

1. 继承 `ModuleBase` 类
2. 实现 `render()` 方法
3. 注册到 `ModuleRegistry`
4. 添加到数据库

详见：[模块开发指南](../guides/module-development.md)

## 相关文档

- [技术栈详解](./tech-stack.md)
- [数据库架构](./database-schema.md)
- [模块系统](./module-system.md)
- [认证授权](./authentication.md)

