// ============================================
// App 主入口 — 路由 & 状态管理
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useFoodLog } from './hooks/useFoodLog';
import { useNutrition } from './hooks/useNutrition';
import { initFoodDatabase } from './services/food-lookup';
import { LoginPage } from './features/auth/LoginPage';
import { OnboardingPage } from './features/onboarding/OnboardingPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { FirestoreDiag } from './components/ui/FirestoreDiag';

const DEV = import.meta.env.DEV;

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const auth = useAuth();
  const foodLog = useFoodLog(auth.profile?.uid);
  const nutritionStatus = useNutrition(auth.profile, foodLog.dailyLog);

  useEffect(() => {
    initFoodDatabase().then(() => setDbReady(true));
  }, []);

  // Loading
  if (auth.loading || !dbReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-3xl">🥗</span>
          </div>
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!auth.isAuthenticated) {
    return (
      <LoginPage
        onGoogleLogin={auth.loginWithGoogle}
        onAppleLogin={auth.loginWithApple}
        error={auth.error}
      />
    );
  }

  // Needs onboarding — show diag overlay in dev mode
  if (auth.needsOnboarding) {
    return (
      <>
        <OnboardingPage
          displayName={auth.user?.displayName || '用户'}
          onComplete={auth.completeOnboarding}
        />
        {DEV && <FirestoreDiag />}
      </>
    );
  }

  // Main dashboard
  if (auth.profile) {
    return (
      <DashboardPage
        profile={auth.profile}
        dailyLog={foodLog.dailyLog}
        nutritionStatus={nutritionStatus}
        currentDate={foodLog.currentDate}
        recentFoods={foodLog.recentFoods}
        onDateChange={foodLog.setCurrentDate}
        onAddFood={foodLog.addFood}
        onRemoveFood={foodLog.removeFood}
        onLogout={auth.logout}
      />
    );
  }

  return null;
}
