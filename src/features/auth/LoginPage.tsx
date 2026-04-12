// ============================================
// 登录页面
// ============================================

interface LoginPageProps {
  onGoogleLogin: () => void;
  onAppleLogin: () => void;
  error: string | null;
}

export function LoginPage({ onGoogleLogin, onAppleLogin, error }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">🥗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">NutriTrack</h1>
          <p className="text-gray-500 mt-2">智能饮食记录 · 科学营养管理</p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-3">
          <button
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-gray-700 font-medium hover:bg-gray-50 hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            使用 Google 账号登录
          </button>

          <button
            onClick={onAppleLogin}
            className="w-full flex items-center justify-center gap-3 bg-black text-white rounded-xl px-4 py-3.5 font-medium hover:bg-gray-900 hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            使用 Apple 账号登录
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
