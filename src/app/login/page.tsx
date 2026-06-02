'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scale, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {/* الشعار */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Scale className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              مكتب الاستاذ سايج محمد
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              محام لدى المجلس
            </p>
          </div>

          {/* نموذج تسجيل الدخول */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                  placeholder="أدخل كلمة المرور"
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
            نظام إدارة مكتب المحامي - الجزائر
          </p>
        </div>
      </div>
    </div>
  );
}
