/**
 * 订阅升级功能诊断脚本
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具 (F12)
 * 2. 切换到 Console 面板
 * 3. 复制此脚本内容并粘贴执行
 */

console.log('🔍 开始诊断订阅升级功能...\n');

// 1. 检查页面是否在设定页面
const isSettingsPage = window.location.pathname.includes('/settings') || 
                       document.querySelector('h2')?.textContent.includes('設定');
console.log('✓ 当前页面:', isSettingsPage ? '✅ 设定页面' : '❌ 非设定页面（请先导航到设定页面）');

// 2. 检查升级按钮是否存在
const upgradeButtons = Array.from(document.querySelectorAll('button')).filter(
  btn => btn.textContent.includes('升級方案') || btn.textContent.includes('升级方案')
);
console.log('✓ 升级按钮:', upgradeButtons.length > 0 ? `✅ 找到 ${upgradeButtons.length} 个` : '❌ 未找到');

if (upgradeButtons.length > 0) {
  upgradeButtons.forEach((btn, idx) => {
    console.log(`  按钮 ${idx + 1}:`, btn);
    console.log(`    - 是否禁用:`, btn.disabled ? '❌ 是' : '✅ 否');
    console.log(`    - 是否有 onClick:`, btn.onclick ? '✅ 有' : '⚠️ 无（可能是 React 事件）');
  });
}

// 3. 检查 React 根元素
const reactRoot = document.querySelector('#root');
console.log('✓ React 根元素:', reactRoot ? '✅ 存在' : '❌ 不存在');

// 4. 检查是否有 JavaScript 错误
console.log('\n📊 最近的控制台消息:');
console.log('（请检查上方是否有红色错误信息）\n');

// 5. 尝试触发点击事件
if (upgradeButtons.length > 0) {
  console.log('🧪 尝试模拟点击升级按钮...');
  try {
    upgradeButtons[0].click();
    console.log('✅ 点击事件已触发');
    
    // 等待一下后检查对话框
    setTimeout(() => {
      const dialog = document.querySelector('[role="dialog"]') || 
                     document.querySelector('.fixed.inset-0') ||
                     Array.from(document.querySelectorAll('div')).find(
                       div => div.textContent.includes('選擇最適合您的方案')
                     );
      
      if (dialog) {
        console.log('🎉 ✅ 对话框已成功弹出！');
      } else {
        console.log('❌ 对话框未弹出，可能的原因：');
        console.log('   1. React 状态未更新');
        console.log('   2. 组件未正确挂载');
        console.log('   3. CSS z-index 问题导致对话框被遮挡');
        console.log('   4. 条件渲染逻辑错误');
      }
    }, 500);
  } catch (error) {
    console.error('❌ 点击事件触发失败:', error);
  }
}

// 6. 检查用户权限
console.log('\n👤 用户信息检查:');
console.log('（如果看到 undefined，可能是 AuthContext 未加载）');

// 7. 提供手动检查建议
console.log('\n📋 手动检查清单:');
console.log('□ 1. 页面是否完全加载完成？');
console.log('□ 2. 是否已登录？（右上角显示用户名）');
console.log('□ 3. 是否在设定页面？');
console.log('□ 4. 浏览器控制台是否有红色错误？');
console.log('□ 5. 是否使用了硬刷新？(Ctrl+Shift+R)');
console.log('□ 6. 开发服务器是否正在运行？');

console.log('\n💡 建议操作:');
console.log('1. 硬刷新页面: Ctrl + Shift + R');
console.log('2. 检查终端是否有编译错误');
console.log('3. 重启开发服务器: npm run dev');
console.log('4. 清除浏览器缓存');

console.log('\n✨ 诊断完成！\n');

