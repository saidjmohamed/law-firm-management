'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Lock, Eye, EyeOff, Loader2, ShieldCheck, Scale } from 'lucide-react';

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

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setError('تعذر الاتصال بالخادم، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main dir="rtl" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scale className="h-7 w-7" strokeWidth={1.6} />
          </div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">مكتب المحاماة</p>
          <h1 className="text-[22px] font-semibold leading-[1.5] text-foreground">
            منظومة إدارة مكتب المحاماة
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أدخل كلمة المرور للمتابعة إلى النظام
          </p>
        </div>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Lock className="h-[17px] w-[17px]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">تسجيل الدخول</h2>
              <p className="text-xs text-muted-foreground">الوصول محمي بكلمة مرور</p>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute inset-y-0 right-3.5 my-auto h-[18px] w-[18px] text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="أدخل كلمة المرور"
                  className="h-12 w-full rounded-lg border border-input bg-background pe-11 ps-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center px-3.5 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جارٍ التحقق</span>
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4" />
                  <span>دخول إلى النظام</span>
                </>
              )}
            </button>
          </form>
        </section>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          نظام داخلي لتنظيم أعمال المكتب ومتابعة الملفات القضائية
        </p>
      </div>
    </main>
  );
}
