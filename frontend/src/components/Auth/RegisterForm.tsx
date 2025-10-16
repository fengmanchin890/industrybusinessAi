import { useState } from 'react';
import { useAuth } from '../../../Contexts/AuthContext';
import { UserPlus, User, Building, Mail, Lock, Eye, EyeOff, Briefcase, Loader2, Check, X } from 'lucide-react';

const industries = [
  { value: 'manufacturing', label: '製造業 (Manufacturing)' },
  { value: 'f&b', label: '餐飲業 (F&B)' },
  { value: 'retail', label: '零售/電商 (Retail/E-commerce)' },
  { value: 'logistics', label: '物流/倉儲 (Logistics)' },
  { value: 'healthcare', label: '醫療/健康 (Healthcare)' },
  { value: 'finance', label: '金融/保險 (Finance)' },
  { value: 'government', label: '政府 (Government)' },
  { value: 'education', label: '教育 (Education)' },
  { value: 'sme', label: '中小企業 (SME)' },
];

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    industry: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  // 密碼強度檢查
  const passwordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: '弱', color: 'bg-red-500' };
    if (password.length < 10) return { strength: 2, text: '中等', color: 'bg-yellow-500' };
    return { strength: 3, text: '強', color: 'bg-green-500' };
  };

  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密碼長度至少需要 6 個字元');
      return;
    }

    if (!formData.industry) {
      setError('請選擇產業類別');
      return;
    }

    setLoading(true);

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.companyName,
        formData.industry
      );
      setSuccess('註冊成功！正在為您準備工作空間...');
    } catch (err: any) {
      const errMsg = err.message || '建立帳戶失敗';
      // 如果是自動登入成功的情況
      if (errMsg.includes('已註冊但密碼不正確')) {
        setError(errMsg);
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
            姓名
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              required
              className="input-field pl-10"
              placeholder="您的姓名"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-2">
            公司名稱
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              required
              className="input-field pl-10"
              placeholder="您的公司"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
          產業類別
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Briefcase className="h-5 w-5 text-slate-400" />
          </div>
          <select
            id="industry"
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            required
            className="input-field pl-10 appearance-none"
            disabled={loading}
          >
            <option value="">選擇產業...</option>
            {industries.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
          電子郵件
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className="input-field pl-10"
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
          密碼
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            required
            className="input-field pl-10 pr-10"
            placeholder="至少 6 個字元"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            disabled={loading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {formData.password && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${(strength.strength / 3) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium text-slate-600">{strength.text}</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
          確認密碼
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-slate-400" />
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            required
            className={`input-field pl-10 pr-10 ${
              passwordsMatch ? 'border-green-500 focus:ring-green-500' : 
              passwordsDontMatch ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="再次輸入密碼"
            disabled={loading}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            {passwordsMatch && <Check className="h-5 w-5 text-green-500" />}
            {passwordsDontMatch && <X className="h-5 w-5 text-red-500" />}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              disabled={loading}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2 animate-slide-up">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 animate-slide-up">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            建立帳戶中...
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            建立帳戶
          </>
        )}
      </button>

      <p className="text-xs text-slate-600 text-center mt-4">
        建立帳戶即表示您同意我們的
        <button type="button" className="text-blue-600 hover:text-blue-700 font-medium mx-1">
          服務條款
        </button>
        和
        <button type="button" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
          隱私政策
        </button>
      </p>
    </form>
  );
}
