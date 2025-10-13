# 模块开发指南

## 目录
- [快速开始](#快速开始)
- [模块架构](#模块架构)
- [开发流程](#开发流程)
- [API 参考](#api-参考)
- [最佳实践](#最佳实践)

## 快速开始

### 1. 创建新模块

使用模块脚手架生成器：

\`\`\`bash
npm run generate-module -- --name MyModule --category manufacturing
\`\`\`

或手动创建：

\`\`\`typescript
import { ModuleBase, ModuleMetadata, ModuleCapabilities, ModuleContext } from '../../ModuleSDK';

// 1. 定义模块元数据
const metadata: ModuleMetadata = {
  id: 'my-module',
  name: '我的 AI 模块',
  version: '1.0.0',
  category: 'manufacturing',
  industry: ['manufacturing'],
  description: '模块描述',
  icon: 'Box',
  author: 'Your Name',
  pricingTier: 'basic',
  features: [
    '功能 1',
    '功能 2',
    '功能 3'
  ]
};

// 2. 定义模块能力
const capabilities: ModuleCapabilities = {
  canGenerateReports: true,
  canSendAlerts: true,
  canProcessData: true,
  canIntegrateExternal: false,
  requiresDataConnection: false
};

// 3. 创建模块组件
export function MyModuleComponent({ context }: { context: ModuleContext }) {
  return (
    <div>
      <h3>我的 AI 模块</h3>
      {/* 你的模块 UI */}
    </div>
  );
}

// 4. 导出模块类
export class MyModule extends ModuleBase {
  constructor() {
    super(metadata, capabilities);
  }

  render(context: ModuleContext) {
    return <MyModuleComponent context={context} />;
  }
}
\`\`\`

## 模块架构

### 模块生命周期

\`\`\`
安装 (onInstall)
  ↓
启用 (onEnable)
  ↓
运行 (render)
  ↓
配置更新 (onConfigUpdate)
  ↓
禁用 (onDisable)
  ↓
卸载 (onUninstall)
\`\`\`

### 生命周期钩子

\`\`\`typescript
export class MyModule extends ModuleBase {
  // 模块安装时调用（一次性）
  async onInstall(context: ModuleContext): Promise<void> {
    // 初始化数据、创建必要的配置
    console.log('Module installed');
  }

  // 模块启用时调用
  async onEnable(context: ModuleContext): Promise<void> {
    // 启动后台任务、订阅数据
    this.updateState({ status: 'running' });
  }

  // 模块禁用时调用
  async onDisable(context: ModuleContext): Promise<void> {
    // 停止后台任务、取消订阅
    this.updateState({ status: 'paused' });
  }

  // 配置更新时调用
  async onConfigUpdate(context: ModuleContext, newConfig: ModuleConfig): Promise<void> {
    // 应用新配置
    console.log('Config updated', newConfig);
  }

  // 模块卸载时调用（一次性）
  async onUninstall(context: ModuleContext): Promise<void> {
    // 清理数据、移除配置
    console.log('Module uninstalled');
  }
}
\`\`\`

## 开发流程

### Step 1: 使用 Module SDK Hooks

\`\`\`typescript
import {
  useModuleContext,
  useModuleState,
  useReportGeneration,
  useAlertSending,
  useModuleData
} from '../../ModuleSDK';

export function MyModuleComponent({ context }: { context: ModuleContext }) {
  // 1. 管理模块状态
  const { state, updateState, setRunning, setError } = useModuleState();

  // 2. 生成报表
  const { generateReport, generating } = useReportGeneration(context);

  // 3. 发送警示
  const { sendAlert, sending } = useAlertSending(context);

  // 4. 加载数据
  const { data, loading, error, reload } = useModuleData<MyDataType>(
    context,
    'my_table'
  );

  const handleAction = async () => {
    setRunning();
    try {
      // 处理业务逻辑
      const result = await processData();
      
      // 生成报表
      await generateReport('报表标题', result, 'daily');
      
      // 如果有异常，发送警示
      if (result.hasIssue) {
        await sendAlert('high', '发现异常', '详细描述');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* 你的 UI */}
    </div>
  );
}
\`\`\`

### Step 2: 使用 Module API

\`\`\`typescript
import { createModuleAPI } from '../../ModuleSDK';

export function MyModuleComponent({ context }: { context: ModuleContext }) {
  const api = createModuleAPI(context);

  const handleGenerateReport = async () => {
    // 创建报表
    await api.createReport('报表标题', '报表内容', 'daily');

    // 获取报表列表
    const reports = await api.getReports(10);

    // 创建警示
    await api.createAlert('medium', '警示标题', '警示内容');

    // 获取数据连接
    const connections = await api.getDataConnections('plc');

    // 记录日志
    await api.log('info', '操作完成', { result: 'success' });

    // 记录指标
    await api.recordMetric('processing_time', 1.5, { unit: 'seconds' });
  };

  return <div>{/* UI */}</div>;
}
\`\`\`

### Step 3: 实时数据订阅

\`\`\`typescript
import { useModuleRealtime } from '../../ModuleSDK';

export function MyModuleComponent({ context }: { context: ModuleContext }) {
  const [data, setData] = useState([]);

  // 订阅实时数据变更
  useModuleRealtime(context, 'reports', (payload) => {
    console.log('数据变更:', payload);
    if (payload.eventType === 'INSERT') {
      setData(prev => [payload.new, ...prev]);
    }
  });

  return <div>{/* UI */}</div>;
}
\`\`\`

## API 参考

### ModuleContext

模块运行时上下文：

\`\`\`typescript
interface ModuleContext {
  companyId: string;      // 公司 ID
  userId: string;         // 用户 ID
  moduleId: string;       // 模块 ID
  config: ModuleConfig;   // 模块配置
}
\`\`\`

### ModuleConfig

模块配置对象：

\`\`\`typescript
interface ModuleConfig {
  enabled: boolean;                    // 是否启用
  settings: Record<string, any>;       // 配置项
  dataConnections?: string[];          // 数据连接 ID
}
\`\`\`

### ModuleState

模块状态：

\`\`\`typescript
interface ModuleState {
  status: 'idle' | 'running' | 'error' | 'paused';
  lastRun?: Date;
  errorMessage?: string;
  metrics?: Record<string, any>;
}
\`\`\`

## 最佳实践

### 1. 错误处理

\`\`\`typescript
export function MyModuleComponent({ context }: { context: ModuleContext }) {
  const { state, setError, setIdle } = useModuleState();

  const handleAction = async () => {
    try {
      // 业务逻辑
    } catch (error) {
      setError(error instanceof Error ? error.message : '未知错误');
      // 通知用户
      toast.error('操作失败');
    } finally {
      setIdle();
    }
  };
}
\`\`\`

### 2. 加载状态

\`\`\`typescript
export function MyModuleComponent({ context }: { context: ModuleContext }) {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <div>{/* 内容 */}</div>;
}
\`\`\`

### 3. 配置管理

\`\`\`typescript
export function MyModuleComponent({ context }: { context: ModuleContext }) {
  const { config, updateConfig, loading } = useModuleConfig(context);

  const handleSettingChange = async (key: string, value: any) => {
    await updateConfig({ [key]: value });
  };

  return (
    <div>
      <label>
        设置项：
        <input
          type="text"
          value={config.settings.myKey || ''}
          onChange={(e) => handleSettingChange('myKey', e.target.value)}
        />
      </label>
    </div>
  );
}
\`\`\`

### 4. 性能优化

\`\`\`typescript
import { memo, useMemo, useCallback } from 'react';

export const MyModuleComponent = memo(({ context }: { context: ModuleContext }) => {
  // 使用 useMemo 缓存计算结果
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  // 使用 useCallback 缓存函数
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, [/* 依赖项 */]);

  return <div>{/* UI */}</div>;
});
\`\`\`

### 5. TypeScript 类型安全

\`\`\`typescript
// 定义数据类型
interface MyData {
  id: string;
  name: string;
  value: number;
}

// 使用泛型
const { data } = useModuleData<MyData>(context, 'my_table');

// 类型守卫
function isMyData(data: any): data is MyData {
  return 'id' in data && 'name' in data && 'value' in data;
}
\`\`\`

## 测试

### 单元测试

\`\`\`typescript
import { render, screen } from '@testing-library/react';
import { MyModuleComponent } from './MyModule';

describe('MyModule', () => {
  const mockContext: ModuleContext = {
    companyId: 'test-company',
    userId: 'test-user',
    moduleId: 'my-module',
    config: {
      enabled: true,
      settings: {}
    }
  };

  it('renders correctly', () => {
    render(<MyModuleComponent context={mockContext} />);
    expect(screen.getByText('我的 AI 模块')).toBeInTheDocument();
  });
});
\`\`\`

## 发布

### 1. 添加到数据库

\`\`\`sql
INSERT INTO ai_modules (
  name, category, description, icon, features,
  pricing_tier, industry_specific, capabilities
) VALUES (
  '我的 AI 模块',
  'manufacturing',
  '模块描述',
  'Box',
  ARRAY['功能1', '功能2'],
  'basic',
  ARRAY['manufacturing'],
  '{"canGenerateReports": true, "canSendAlerts": true}'::jsonb
);
\`\`\`

### 2. 注册模块

\`\`\`typescript
import { ModuleRegistry } from './ModuleSDK';
import { MyModule } from './Industry/MyCategory/MyModule';

// 注册模块
ModuleRegistry.register(MyModule, metadata);
\`\`\`

## 相关文档

- [Module SDK API](../api/module-api.md)
- [UI 组件库](./ui-components.md)
- [示例代码](../examples/)

