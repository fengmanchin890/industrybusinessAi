/**
 * 完整诊断脚本 - 检查升级功能状态
 * 复制此脚本到浏览器控制台运行
 */

console.clear();
console.log('🔍 ============ 完整诊断开始 ============\n');

// 1. 检查当前页面
console.log('📍 第1步：检查当前页面');
console.log('   URL:', window.location.href);
console.log('   路径:', window.location.pathname);

// 检查页面标题
const pageTitle = document.querySelector('h2')?.textContent;
console.log('   页面标题:', pageTitle || '未找到');

// 检查是否在设定页面
const isSettingsPage = 
  window.location.pathname.includes('settings') ||
  pageTitle?.includes('設定') ||
  pageTitle?.includes('设定') ||
  document.body.textContent.includes('訂閱方案');

console.log('   是否在设定页面:', isSettingsPage ? '✅ 是' : '❌ 否\n');

if (!isSettingsPage) {
  console.log('⚠️  您不在设定页面！请按以下步骤操作：\n');
  console.log('   1. 查看页面底部导航栏');
  console.log('   2. 点击「设定」或「設定」图标');
  console.log('   3. 等待页面加载完成');
  console.log('   4. 重新运行此脚本\n');
  
  // 尝试查找导航按钮
  const navButtons = Array.from(document.querySelectorAll('button, a')).filter(el => 
    el.textContent.includes('設定') || 
    el.textContent.includes('设定') ||
    el.textContent.includes('Settings')
  );
  
  if (navButtons.length > 0) {
    console.log('   💡 找到设定按钮，尝试自动导航...');
    navButtons[0].click();
    console.log('   ✅ 已点击，请等待页面加载后重新运行诊断\n');
  }
  
  console.log('🔍 ============ 诊断结束 ============\n');
  return;
}

// 2. 检查React是否加载
console.log('\n📦 第2步：检查应用状态');
const reactRoot = document.querySelector('#root');
console.log('   React根元素:', reactRoot ? '✅ 存在' : '❌ 不存在');

// 3. 检查所有按钮
console.log('\n🔘 第3步：检查页面按钮');
const allButtons = Array.from(document.querySelectorAll('button'));
console.log('   页面总按钮数:', allButtons.length);

// 列出所有按钮的文本
console.log('\n   按钮列表（前20个）:');
allButtons.slice(0, 20).forEach((btn, idx) => {
  const text = btn.textContent.trim().substring(0, 30);
  if (text) {
    console.log(`   ${idx + 1}. "${text}"`);
  }
});

// 4. 专门查找升级按钮
console.log('\n🔍 第4步：查找升级按钮');
const upgradeButtons = allButtons.filter(btn => 
  btn.textContent.includes('升級') ||
  btn.textContent.includes('升级') ||
  btn.textContent.includes('Upgrade')
);

console.log('   找到升级按钮:', upgradeButtons.length > 0 ? `✅ ${upgradeButtons.length} 个` : '❌ 0个');

if (upgradeButtons.length > 0) {
  upgradeButtons.forEach((btn, idx) => {
    console.log(`\n   按钮 ${idx + 1}:`);
    console.log('     文本:', btn.textContent.trim());
    console.log('     类名:', btn.className);
    console.log('     是否禁用:', btn.disabled);
    console.log('     是否可见:', btn.offsetParent !== null);
  });
}

// 5. 检查订阅方案卡片
console.log('\n💳 第5步：检查订阅方案区域');
const subscriptionSection = Array.from(document.querySelectorAll('h3, div')).find(el =>
  el.textContent.includes('訂閱方案') || 
  el.textContent.includes('订阅方案') ||
  el.textContent.includes('Subscription')
);

console.log('   订阅方案区域:', subscriptionSection ? '✅ 找到' : '❌ 未找到');

if (subscriptionSection) {
  console.log('   区域内容预览:', subscriptionSection.textContent.substring(0, 100));
}

// 6. 尝试点击升级按钮
if (upgradeButtons.length > 0) {
  console.log('\n🧪 第6步：测试点击升级按钮');
  console.log('   正在点击第一个升级按钮...');
  
  try {
    upgradeButtons[0].click();
    console.log('   ✅ 点击成功！');
    
    // 延迟检查对话框
    setTimeout(() => {
      console.log('\n📋 第7步：检查对话框');
      
      // 多种方式查找对话框
      const dialog1 = document.querySelector('[role="dialog"]');
      const dialog2 = Array.from(document.querySelectorAll('div')).find(div =>
        div.textContent.includes('選擇最適合您的方案') ||
        div.textContent.includes('选择最适合您的方案')
      );
      const dialog3 = Array.from(document.querySelectorAll('h3')).find(h3 =>
        h3.textContent.includes('選擇最適合您的方案')
      );
      const fixedOverlay = document.querySelector('.fixed.inset-0');
      
      const dialogFound = dialog1 || dialog2 || dialog3 || fixedOverlay;
      
      console.log('   对话框状态:', dialogFound ? '✅ 已弹出！' : '❌ 未弹出');
      
      if (dialogFound) {
        console.log('   🎉 成功！升级对话框已经弹出！');
        console.log('   对话框元素:', dialogFound);
      } else {
        console.log('\n   ⚠️  对话框未弹出，可能的原因：');
        console.log('   1. React状态更新延迟（请等待1-2秒后刷新页面）');
        console.log('   2. 条件渲染逻辑阻止显示');
        console.log('   3. CSS问题导致对话框被隐藏');
        console.log('   4. JavaScript错误（检查控制台是否有红色错误）');
        
        // 检查是否有错误
        console.log('\n   检查最近的错误...');
        console.log('   （如果上方有红色错误信息，请截图反馈）');
      }
      
      console.log('\n🔍 ============ 诊断结束 ============\n');
    }, 500);
    
  } catch (error) {
    console.error('   ❌ 点击失败:', error);
    console.log('\n🔍 ============ 诊断结束 ============\n');
  }
} else {
  console.log('\n⚠️  未找到升级按钮！');
  console.log('\n可能的原因：');
  console.log('1. ❌ 页面未完全加载（等待几秒后重试）');
  console.log('2. ❌ 不在设定页面（点击底部导航的"设定"）');
  console.log('3. ❌ 组件渲染失败（检查控制台是否有错误）');
  console.log('4. ❌ 代码未更新（尝试 Ctrl+Shift+R 硬刷新）');
  
  console.log('\n📋 建议操作：');
  console.log('1. 硬刷新页面: Ctrl + Shift + R');
  console.log('2. 确认在设定页面（底部导航有"设定"高亮）');
  console.log('3. 等待5秒后重新运行诊断');
  console.log('4. 检查开发服务器是否在运行\n');
  
  console.log('🔍 ============ 诊断结束 ============\n');
}

