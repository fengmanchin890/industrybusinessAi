/**
 * 移除開發者用戶腳本
 * 使用 Supabase JavaScript 客戶端刪除 dev@example.com 用戶
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ergqqdirsvmamowpklia.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ 請設置 SUPABASE_SERVICE_KEY 環境變數');
  console.log('使用方法: SUPABASE_SERVICE_KEY=your-service-key node remove-dev-user.js');
  process.exit(1);
}

// 使用 service key 創建管理員客戶端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function removeDevUser() {
  console.log('🔍 正在查找開發者用戶...');
  
  try {
    // 1. 查找用戶記錄
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, company_id, email')
      .eq('email', 'dev@example.com')
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!userData) {
      console.log('✅ 開發者用戶不存在，無需刪除');
      return;
    }

    console.log('👤 找到用戶:', userData.email, 'Company ID:', userData.company_id);

    // 2. 刪除相關資料
    console.log('🗑️ 刪除相關資料...');
    
    // 刪除公司模組
    const { error: modulesError } = await supabase
      .from('company_modules')
      .delete()
      .eq('company_id', userData.company_id);
    
    if (modulesError) console.warn('⚠️ 刪除公司模組時出錯:', modulesError.message);

    // 刪除提醒
    const { error: alertsError } = await supabase
      .from('alerts')
      .delete()
      .eq('company_id', userData.company_id);
    
    if (alertsError) console.warn('⚠️ 刪除提醒時出錯:', alertsError.message);

    // 刪除報告
    const { error: reportsError } = await supabase
      .from('reports')
      .delete()
      .eq('company_id', userData.company_id);
    
    if (reportsError) console.warn('⚠️ 刪除報告時出錯:', reportsError.message);

    // 刪除資料連接
    const { error: connectionsError } = await supabase
      .from('data_connections')
      .delete()
      .eq('company_id', userData.company_id);
    
    if (connectionsError) console.warn('⚠️ 刪除資料連接時出錯:', connectionsError.message);

    // 3. 刪除用戶記錄
    console.log('👤 刪除用戶記錄...');
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userData.id);

    if (userDeleteError) throw userDeleteError;

    // 4. 刪除公司記錄
    console.log('🏢 刪除公司記錄...');
    const { error: companyDeleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', userData.company_id);

    if (companyDeleteError) throw companyDeleteError;

    // 5. 刪除 auth 用戶（這需要管理員權限）
    console.log('🔐 刪除認證用戶...');
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userData.id);

    if (authDeleteError) {
      console.warn('⚠️ 無法刪除認證用戶（可能需要手動刪除）:', authDeleteError.message);
    }

    console.log('✅ 開發者用戶已成功移除');
    
    // 6. 驗證刪除結果
    const { data: remainingUsers } = await supabase
      .from('users')
      .select('email')
      .eq('email', 'dev@example.com');

    if (!remainingUsers || remainingUsers.length === 0) {
      console.log('✅ 驗證完成：用戶已完全移除');
    } else {
      console.log('⚠️ 警告：用戶可能仍然存在');
    }

  } catch (error) {
    console.error('❌ 刪除失敗:', error.message);
    console.error('詳細錯誤:', error);
  }
}

// 執行
removeDevUser()
  .then(() => {
    console.log('🎉 腳本執行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 腳本執行失敗:', error);
    process.exit(1);
  });





