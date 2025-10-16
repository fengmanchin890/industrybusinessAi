import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// 生成 UUID（優先使用瀏覽器的 crypto.randomUUID）
const generateUUID = (): string => {
  const g: any = (globalThis as any) || (window as any);
  const c = g?.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // 簡易退化實作
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface UserProfile {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  subscription_tier: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  company: Company | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, companyName: string, industry: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 強制使用真實 Supabase 認證
const isDevelopmentMode = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing...');
    console.log('🔍 Environment check:');
    console.log('  - VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('  - isDevelopmentMode:', isDevelopmentMode);
    console.log('✅ 使用真實 Supabase 認證');
    
    // 直接使用真實 Supabase 認證
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session ? `✅ Logged in as ${session.user.email}` : '❌ Not logged in');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 Loading user profile for:', session.user.id);
        loadUserProfile(session.user.id);
      } else {
        console.log('⏭️  No session, skipping profile load');
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session ? `User: ${session.user.email}` : 'No session');
      
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Auth change: Loading user profile');
          await loadUserProfile(session.user.id);
        } else {
          console.log('👤 Auth change: Clearing user data');
          setProfile(null);
          setCompany(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('🔄 Loading user profile for user_id:', userId);
      
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('👤 User profile result:', {
        found: !!userProfile,
        error: profileError,
        company_id: userProfile?.company_id
      });

      if (profileError) throw profileError;

      if (userProfile) {
        setProfile(userProfile);
        console.log('✅ User profile loaded:', userProfile.full_name);

        console.log('🔄 Loading company for company_id:', userProfile.company_id);

        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', userProfile.company_id)
          .maybeSingle();

        console.log('🏢 Company result:', {
          found: !!companyData,
          error: companyError,
          name: companyData?.name,
          industry: companyData?.industry
        });

        if (companyError) throw companyError;

        if (companyData) {
          setCompany(companyData);
          console.log('✅ Company loaded:', companyData.name, `(${companyData.industry})`);
        } else {
          console.error('❌ No company found for company_id:', userProfile.company_id);
        }
      } else {
        console.error('❌ No user profile found for user_id:', userId);
        // Fallback: 如果沒有 profile，為使用者建立默認公司與 profile（避免 insert 後 select）
        const signupInProgress = (typeof localStorage !== 'undefined' && localStorage.getItem('signup_in_progress') === '1');
        if (signupInProgress) {
          console.log('⏭️ Signup in progress, skip fallback provisioning');
          return; // 等下一次 onAuthStateChange 或 signUp 完成後再載入
        }
        console.log('🧩 Auto-provisioning company & profile for first-time login...');
        try {
          const { data: authUser } = await supabase.auth.getUser();
          const email = authUser.user?.email || 'unknown@local';
          const fullName = authUser.user?.user_metadata?.full_name || email.split('@')[0];

          // 用 client 先產生 companyId，insert 不 select
          const companyId = generateUUID();
          const savedIndustry = (typeof localStorage !== 'undefined' && localStorage.getItem('signup_industry')) || 'sme';
          console.log('🏢 Creating fallback company for:', email, 'companyId:', companyId);
          const { error: companyErr } = await supabase
            .from('companies')
            .insert({
              id: companyId,
              name: `${fullName} 的公司`,
              industry: savedIndustry,
              employee_count: 1,
              subscription_tier: 'basic',
            });

          if (companyErr) {
            console.error('❌ Failed to create fallback company:', companyErr);
            throw companyErr;
          }

          console.log('👤 Creating fallback user profile...');
          const { error: upsertErr } = await supabase.from('users').upsert({
            id: userId,
            company_id: companyId,
            email,
            full_name: fullName,
            role: 'admin',
          });

          if (upsertErr) {
            console.error('❌ Failed to create fallback profile:', upsertErr);
            throw upsertErr;
          }

          setProfile({ id: userId, company_id: companyId, email, full_name: fullName, role: 'admin' });

          // 再查公司（此時已具備 profile → RLS 允許）
          const { data: createdCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .maybeSingle();
          if (createdCompany) setCompany(createdCompany);
          console.log('✅ Successfully provisioned profile & company for first login');
        } catch (provisionErr: any) {
          console.error('❌ Auto provision failed:', provisionErr);
          console.error('Error details:', {
            message: provisionErr?.message,
            code: provisionErr?.code,
            details: provisionErr?.details
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
    } finally {
      console.log('✅ Profile loading complete, setting loading = false');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 嘗試使用真實 Supabase 登入:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    companyName: string,
    industry: string
  ) => {
    console.log('📝 Starting registration:', { email, fullName, companyName, industry });
    try { localStorage.setItem('signup_in_progress', '1'); } catch {}
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('🔐 Auth user created:', { 
      success: !!authData.user, 
      user_id: authData.user?.id,
      error: authError 
    });

    if (authError) {
      // 如果 email 已註冊（Supabase 會返回 "invalid" 錯誤），自動嘗試登入
      const errorMsg = authError.message?.toLowerCase() || '';
      if (errorMsg.includes('invalid') || errorMsg.includes('already') || errorMsg.includes('exists')) {
        console.warn('⚠️ Email already registered, attempting auto sign-in...');
        try {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) throw signInErr;
          console.log('✅ Auto signed in existing user');
          // loadUserProfile 會被 onAuthStateChange 自動觸發，若沒 profile 會自動建立
          return;
        } catch (signInErr) {
          throw new Error('此 Email 已註冊但密碼不正確，請使用登入功能');
        }
      }
      throw authError;
    }
    if (!authData.user) throw new Error('用戶創建失敗');

    // 等待並確認 session（避免 RLS 無法建立資料）
    let session = authData.session;
    if (!session) {
      console.log('⏳ Waiting for session...');
      await new Promise((r) => setTimeout(r, 2000));
      const { data } = await supabase.auth.getSession();
      session = data.session;
      console.log('🔑 Session after wait:', session ? '✅ Found' : '❌ Still missing');
    }
    
    // 如果還是沒有 session，嘗試用密碼登入（處理某些邊緣情況）
    if (!session) {
      console.warn('⚠️ No session after signup, trying sign-in with password...');
      try {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        if (!signInErr && signInData.session) {
          session = signInData.session;
          console.log('✅ Successfully obtained session via sign-in');
        }
      } catch (e) {
        console.error('Failed to sign in after signup:', e);
      }
    }
    
    // 最後檢查：如果仍然無 session，表示需要 email 確認或有其他問題
    if (!session) {
      throw new Error('註冊成功但無法立即登入。請檢查您的信箱確認 Email，或稍後重新登入');
    }

    // 使用 client 產生 companyId → insert 不 select，避免 RLS 阻擋
    const companyId = generateUUID();
    console.log('🏢 Creating company:', { name: companyName, industry, companyId });

    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        id: companyId,
        name: companyName,
        industry,
        employee_count: 1,
        subscription_tier: 'basic',
      });

    if (companyError) throw companyError;

    console.log('👤 Creating user profile:', { 
      user_id: authData.user.id, 
      company_id: companyId 
    });

    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      company_id: companyId,
      email,
      full_name: fullName,
      role: 'admin',
    });

    console.log('👤 User profile created:', { 
      success: !userError, 
      error: userError 
    });

    if (userError) throw userError;

    // 立即同步前端狀態，避免 fallback 再次建公司
    setProfile({ id: authData.user.id, company_id: companyId, email, full_name: fullName, role: 'admin' });
    setCompany({ id: companyId, name: companyName, industry, subscription_tier: 'basic' } as any);

    console.log('✅ Registration complete! User will be logged in automatically.');

    try {
      // 記錄本次註冊的產業，供首次登入 fallback 使用
      localStorage.setItem('signup_industry', industry);
      localStorage.removeItem('signup_in_progress');
    } catch {}
  };

  const signOut = async () => {
    console.log('🔐 使用真實 Supabase 登出');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, company, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
