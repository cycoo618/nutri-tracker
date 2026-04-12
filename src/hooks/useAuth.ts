// ============================================
// 认证状态 Hook
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../services/auth';
import { onAuthChange, signInWithGoogle, signInWithApple, signOut } from '../services/auth';
import { getUserProfile, saveUserProfile } from '../services/firestore';
import type { UserProfile } from '../types/user';
import { DEFAULT_USER_PROFILE } from '../types/user';

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  // 监听认证状态
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setState({ user, profile, loading: false, error: null });
          } else {
            // 新用户，profile 为 null 触发 onboarding
            setState({ user, profile: null, loading: false, error: null });
          }
        } catch (err) {
          console.error('获取用户数据失败:', err);
          // Firestore 出错时也要放行，让 onboarding 继续
          setState({ user, profile: null, loading: false, error: null });
        }
      } else {
        setState({ user: null, profile: null, loading: false, error: null });
      }
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      setState(s => ({ ...s, error: null }));
      await signInWithGoogle();
    } catch (err) {
      setState(s => ({ ...s, error: '登录失败，请重试' }));
      console.error(err);
    }
  }, []);

  const loginWithApple = useCallback(async () => {
    try {
      setState(s => ({ ...s, error: null }));
      await signInWithApple();
    } catch (err) {
      setState(s => ({ ...s, error: '登录失败，请重试' }));
      console.error(err);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  /** 完成 onboarding，创建用户 profile */
  const completeOnboarding = useCallback(async (profileData: Partial<UserProfile>) => {
    if (!state.user) return;
    const now = new Date().toISOString();
    const profile: UserProfile = {
      uid: state.user.uid,
      displayName: state.user.displayName || '',
      email: state.user.email || '',
      photoURL: state.user.photoURL || undefined,
      ...DEFAULT_USER_PROFILE,
      ...profileData,
      createdAt: now,
      updatedAt: now,
    } as UserProfile;
    try {
      await saveUserProfile(profile);
      setState(s => ({ ...s, profile, error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败，请重试';
      console.error('保存用户数据失败:', err);
      setState(s => ({ ...s, error: msg }));
      throw err;
    }
  }, [state.user]);

  /** 更新 profile */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.profile) return;
    const updated = { ...state.profile, ...updates, updatedAt: new Date().toISOString() };
    await saveUserProfile(updated);
    setState(s => ({ ...s, profile: updated }));
  }, [state.profile]);

  return {
    ...state,
    isAuthenticated: !!state.user,
    needsOnboarding: !!state.user && !state.profile,
    loginWithGoogle,
    loginWithApple,
    logout,
    completeOnboarding,
    updateProfile,
  };
}
