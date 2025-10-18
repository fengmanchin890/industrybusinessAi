# 🎯 订阅升级功能 - 完整指南

## ✅ 功能已实现

您的订阅升级功能已经完整实现！以下是使用步骤：

---

## 🚀 使用步骤

### 1. 启动开发服务器

```bash
cd frontend
npm run dev
```

服务器应该运行在：`http://localhost:5173` 或 `http://localhost:5174`

### 2. 清除浏览器缓存

**方法 A：硬重新加载（推荐）**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**方法 B：清除缓存**
1. 打开开发者工具 (F12)
2. 右键点击刷新按钮
3. 选择「清空缓存并硬重新加载」

### 3. 访问设定页面

1. 登录平台
2. 点击底部导航栏的「设定」(Settings)
3. 找到「订阅方案」区块
4. 点击橙色的「**升級方案**」按钮

### 4. 升级流程

✅ **应该看到的效果：**
- 弹出全屏对话框
- 显示三个方案的对比（Basic / Pro / Enterprise）
- 当前方案有蓝色高亮显示
- 可以点击「立即升级至 Pro」或「联系企业销售」

---

## 🔍 故障排除

### 问题 1：点击按钮没有反应

**解决方案：**

1. **检查浏览器控制台错误**
   ```
   F12 → Console 面板
   查看是否有红色错误信息
   ```

2. **强制刷新**
   ```
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

3. **重启开发服务器**
   ```bash
   # 停止当前服务器 (Ctrl+C)
   cd frontend
   npm run dev
   ```

### 问题 2：对话框样式异常

**可能原因：** Tailwind CSS 未正确编译

**解决方案：**
```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### 问题 3：升级后模块商店未解锁

**解决方案：**

1. **检查数据库订阅等级**
   - 打开 Supabase Dashboard
   - 查看 `companies` 表
   - 确认 `subscription_tier` 已更新为 `pro`

2. **刷新页面**
   - 升级成功后会自动刷新
   - 如果没有自动刷新，手动刷新页面 (F5)

3. **检查模块的 pricing_tier**
   - 打开模块商店
   - Pro 方案应该可以安装 `pricing_tier = 'basic'` 和 `'pro'` 的模块
   - 只有 `'enterprise'` 模块会显示「需要升级」

---

## 📊 代码验证

### 检查文件是否正确更新

运行以下命令：

```bash
# 检查 SettingsView.tsx 中的关键代码
grep -n "upgradeDialogOpen" frontend/Setting/SettingViews.tsx
grep -n "handleUpgrade" frontend/Setting/SettingViews.tsx
```

**应该看到：**
- 第 13 行: `const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);`
- 第 42-73 行: `handleUpgrade` 函数
- 第 306 行: `onClick={() => setUpgradeDialogOpen(true)}`
- 第 728 行: `{upgradeDialogOpen && (`

### 测试升级逻辑

在浏览器控制台运行：

```javascript
// 检查 company 对象
console.log('Current subscription:', 
  document.querySelector('[class*="text-2xl"]')?.textContent
);

// 检查按钮是否存在
console.log('Upgrade button exists:', 
  !!document.querySelector('button:contains("升級方案")')
);
```

---

## 🎨 功能特性

### ✅ 已实现的功能

1. **美观的 UI 对话框**
   - 三栏式方案对比
   - 响应式设计
   - 动态高亮当前方案

2. **智能升级逻辑**
   - Basic → Pro: 立即升级
   - Basic/Pro → Enterprise: 引导联系销售
   - 防止降级

3. **权限控制**
   - 只有管理员可以升级
   - 非管理员会看到提示

4. **用户反馈**
   - 升级处理中状态
   - 成功/失败提示
   - 自动刷新页面

### 🎯 方案对比

| 功能 | Basic | Pro | Enterprise |
|------|-------|-----|------------|
| 价格 | NT$ 2,999/月 | NT$ 8,999/月 | NT$ 24,999/月 |
| AI 模块 | 3 个 | 10 个 | 20+ 全部 |
| 报表 | 基础 | 深度分析 | 客制化 |
| 客服 | 标准 | 优先 | 专属经理 |
| API | ❌ | ✅ | ✅ 无限 |

---

## 🧪 完整测试流程

### 测试场景 1：Basic → Pro 升级

1. 确保当前是 Basic 方案
2. 点击「升级方案」按钮
3. 在对话框中点击「立即升级至 Pro」
4. 应该看到「成功升级至 PRO 方案！」提示
5. 页面自动刷新
6. 设定页面显示「Pro」方案
7. 模块商店可以安装更多模块

### 测试场景 2：Pro 用户访问

1. 当前已是 Pro 方案
2. 点击「升级方案」按钮
3. 对话框显示 Pro 卡片高亮
4. Pro 卡片显示「目前使用中」按钮（禁用）
5. 可以点击「联系企业销售」升级到 Enterprise

### 测试场景 3：非管理员用户

1. 使用 Viewer 或 Operator 角色登录
2. 点击「升级方案」按钮
3. 点击升级按钮
4. 应该看到「只有管理员可以升级方案」提示

---

## 📞 需要帮助？

如果仍然遇到问题，请检查：

1. ✅ Node.js 版本 >= 18
2. ✅ npm 版本 >= 9
3. ✅ 开发服务器正在运行
4. ✅ 浏览器已清除缓存
5. ✅ 开发者工具无错误信息

**调试命令：**

```bash
# 检查开发服务器
lsof -ti:5173  # 查看端口占用

# 完全清理并重启
cd frontend
rm -rf node_modules/.vite dist
npm run dev
```

---

## 🎉 成功标志

当一切正常时，您应该看到：

- ✅ 点击「升级方案」按钮后立即弹出对话框
- ✅ 对话框内容完整，样式美观
- ✅ 可以看到三个方案的详细对比
- ✅ 当前方案有明显标识
- ✅ 升级按钮可以正常点击
- ✅ 升级成功后页面刷新
- ✅ 模块商店解锁对应权限

**下一步：** 整合付款系统（ECPay / Stripe）

