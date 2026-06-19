'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* خلفية متدرّجة فاخرة */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, oklch(0.45 0.12 170 / 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.55 0.15 160 / 0.10) 0%, transparent 50%), radial-gradient(circle at 50% 100%, oklch(0.65 0.10 85 / 0.06) 0%, transparent 60%)',
        }}
      />
      <div className="absolute inset-0 -z-10 dark:hidden" style={{
        background: 'linear-gradient(135deg, oklch(0.99 0.003 165) 0%, oklch(0.96 0.012 170) 100%)'
      }} />
      <div className="absolute inset-0 -z-10 hidden dark:block" style={{
        background: 'linear-gradient(135deg, oklch(0.14 0.012 170) 0%, oklch(0.18 0.022 170) 100%)'
      }} />

      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-card/95 dark:bg-card/95 backdrop-blur-xl rounded-2xl shadow-elevated border border-border/60 p-8 md:p-10">
          {/* الشعار */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary shadow-elevated flex items-center justify-center">
                <Gavel className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-emerald-500 border-4 border-card flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground text-center">
              مكتب الأستاذ سايج محمد
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              محام لدى المجلس
            </p>
          </div>

          {/* نموذج تسجيل الدخول */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-foreground mb-2"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-11 pl-11 py-3 border border-input rounded-xl bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all text-[15px]"
                  placeholder="أدخل كلمة المرور"
                  autoFocus
                  disabled={loading}
                  dir="ltr"
                  style={{ textAlign: 'right' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="bg-destructive/10 text-destructive text-[13px] p-3 rounded-lg text-center border border-destructive/20 animate-fade-in"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="btn-luxe w-full py-3 bg-gradient-primary hover:shadow-elevated disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-[15px]"
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

          <div className="divider-gradient my-6" />

          <p className="text-[11px] text-muted-foreground text-center">
            نظام إدارة مكتب المحاماة — الجزائر
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center mt-4">
          © {new Date().getFullYear()} مكتب الأستاذ سايج محمد. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
