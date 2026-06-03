// ============================================================================
// SWR Hooks - استبدال useLiveQuery من Dexie
// ============================================================================

import useSWR, { mutate } from 'swr';

// Generic fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'حدث خطأ في الشبكة' }));
    throw new Error(error.message || 'حدث خطأ في الشبكة');
  }
  return res.json();
};

// ============================================================================
// الموكلون
// ============================================================================
export function useClients() {
  const { data, error, isLoading } = useSWR('/api/clients', fetcher);
  return { clients: data || [], error, isLoading };
}

export function useClient(id: number | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/clients/${id}` : null,
    fetcher
  );
  return { client: data, error, isLoading };
}

export async function createClient(data: Record<string, unknown>) {
  const res = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 409) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'موكل بنفس الاسم موجود بالفعل');
    }
    throw new Error('فشل في إنشاء الموكل');
  }
  const result = await res.json();
  await mutate('/api/clients');
  return result;
}

export async function updateClient(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث الموكل');
  const result = await res.json();
  await mutate('/api/clients');
  await mutate(`/api/clients/${id}`);
  return result;
}

export async function deleteClient(id: number) {
  const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف الموكل');
  await mutate('/api/clients');
}

/**
 * مزامنة جميع الأطراف مع جدول الموكلين
 * كل طرف (سواء في حقه أو ضده) يضاف كموكل إذا لم يكن موجوداً
 */
export async function syncPartiesToClients() {
  const res = await fetch('/api/clients/sync-parties', { method: 'POST' });
  if (!res.ok) throw new Error('فشل في مزامنة الأطراف مع الموكلين');
  const result = await res.json();
  await mutate('/api/clients');
  return result;
}

// ============================================================================
// القضايا
// ============================================================================
export function useCases() {
  const { data, error, isLoading } = useSWR('/api/cases', fetcher);
  return { cases: data || [], error, isLoading };
}

export function useCase(id: number | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/cases/${id}` : null,
    fetcher
  );
  return { caseData: data, error, isLoading };
}

export async function createCase(data: Record<string, unknown>) {
  const res = await fetch('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 409) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'قضية بنفس الرقم موجودة بالفعل');
    }
    throw new Error('فشل في إنشاء القضية');
  }
  const result = await res.json();
  await mutate('/api/cases');
  return result;
}

export async function updateCase(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث القضية');
  const result = await res.json();
  await mutate('/api/cases');
  await mutate(`/api/cases/${id}`);
  return result;
}

export async function deleteCase(id: number) {
  const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف القضية');
  await mutate('/api/cases');
}

// ============================================================================
// الجلسات
// ============================================================================
export function useSessions() {
  const { data, error, isLoading } = useSWR('/api/sessions', fetcher);
  return { sessions: data || [], error, isLoading };
}

export async function createSession(data: Record<string, unknown>) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في إنشاء الجلسة');
  const result = await res.json();
  await mutate('/api/sessions');
  return result;
}

export async function updateSession(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/sessions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث الجلسة');
  const result = await res.json();
  await mutate('/api/sessions');
  return result;
}

export async function deleteSession(id: number) {
  const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف الجلسة');
  await mutate('/api/sessions');
}

// ============================================================================
// المدفوعات
// ============================================================================
export function usePayments() {
  const { data, error, isLoading } = useSWR('/api/payments', fetcher);
  return { payments: data || [], error, isLoading };
}

export async function createPayment(data: Record<string, unknown>) {
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في إنشاء الدفعة');
  const result = await res.json();
  await mutate('/api/payments');
  return result;
}

export async function updatePayment(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث الدفعة');
  const result = await res.json();
  await mutate('/api/payments');
  return result;
}

export async function deletePayment(id: number) {
  const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف الدفعة');
  await mutate('/api/payments');
}

// ============================================================================
// الآجال
// ============================================================================
export function useDelays() {
  const { data, error, isLoading } = useSWR('/api/delays', fetcher);
  return { delays: data || [], error, isLoading };
}

export async function createDelay(data: Record<string, unknown>) {
  const res = await fetch('/api/delays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في إنشاء الأجل');
  const result = await res.json();
  await mutate('/api/delays');
  return result;
}

export async function updateDelay(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/delays/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث الأجل');
  const result = await res.json();
  await mutate('/api/delays');
  return result;
}

export async function deleteDelay(id: number) {
  const res = await fetch(`/api/delays/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف الأجل');
  await mutate('/api/delays');
}

// ============================================================================
// الأطراف
// ============================================================================
export function useParties() {
  const { data, error, isLoading } = useSWR('/api/parties', fetcher);
  return { parties: data || [], error, isLoading };
}

export function useCaseParties(caseId: number | null) {
  const { data, error, isLoading } = useSWR(
    caseId ? `/api/parties?caseId=${caseId}` : null,
    fetcher
  );
  return { parties: data || [], error, isLoading };
}

export async function createParty(data: Record<string, unknown>) {
  const res = await fetch('/api/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في إنشاء الطرف');
  const result = await res.json();
  await mutate('/api/parties');
  if (data.caseId) await mutate(`/api/parties?caseId=${data.caseId}`);
  return result;
}

export async function updateParty(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/parties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث الطرف');
  const result = await res.json();
  await mutate('/api/parties');
  return result;
}

export async function deleteParty(id: number) {
  const res = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف الطرف');
  await mutate('/api/parties');
}

// ============================================================================
// الأرشيف
// ============================================================================
export function useArchives() {
  const { data, error, isLoading } = useSWR('/api/archives', fetcher);
  return { archives: data || [], error, isLoading };
}

export async function createArchive(data: Record<string, unknown>) {
  const res = await fetch('/api/archives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في إنشاء الأرشيف');
  const result = await res.json();
  await mutate('/api/archives');
  return result;
}

export async function deleteArchive(id: number) {
  const res = await fetch(`/api/archives/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف الأرشيف');
  await mutate('/api/archives');
}

// ============================================================================
// المحامون
// ============================================================================
export function useLawyers() {
  const { data, error, isLoading } = useSWR('/api/lawyers', fetcher);
  return { lawyers: data || [], error, isLoading };
}

export function useLawyer(id: number | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/lawyers/${id}` : null,
    fetcher
  );
  return { lawyer: data, error, isLoading };
}

export async function createLawyer(data: Record<string, unknown>) {
  const res = await fetch('/api/lawyers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 409) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'محامي بنفس الاسم موجود بالفعل');
    }
    throw new Error('فشل في إنشاء المحامي');
  }
  const result = await res.json();
  await mutate('/api/lawyers');
  await mutate('/api/lawyers/bar-associations');
  return result;
}

export async function updateLawyer(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/lawyers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث المحامي');
  const result = await res.json();
  await mutate('/api/lawyers');
  await mutate(`/api/lawyers/${id}`);
  await mutate('/api/lawyers/bar-associations');
  return result;
}

export async function deleteLawyer(id: number) {
  const res = await fetch(`/api/lawyers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف المحامي');
  await mutate('/api/lawyers');
}

// ============================================================================
// النقابات (Autocomplete تراكمي)
// ============================================================================
export function useBarAssociations() {
  const { data, error, isLoading } = useSWR<string[]>(
    '/api/lawyers/bar-associations',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );
  return {
    barAssociations: data || [],
    isLoading: !error && !data,
  };
}

// ============================================================================
// الهيئات القضائية
// ============================================================================
export function useJudicialBodies() {
  const { data, error, isLoading } = useSWR('/api/judicial-bodies', fetcher);
  return { judicialBodies: data || [], error, isLoading };
}

export async function createJudicialBody(data: Record<string, unknown>) {
  const res = await fetch('/api/judicial-bodies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 409) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'هيئة قضائية بنفس الاسم موجودة بالفعل');
    }
    throw new Error('فشل في إنشاء الهيئة القضائية');
  }
  const result = await res.json();
  await mutate('/api/judicial-bodies');
  return result;
}

export async function updateJudicialBody(id: number, data: Record<string, unknown>) {
  const res = await fetch(`/api/judicial-bodies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('فشل في تحديث الهيئة القضائية');
  const result = await res.json();
  await mutate('/api/judicial-bodies');
  return result;
}

export async function deleteJudicialBody(id: number) {
  const res = await fetch(`/api/judicial-bodies/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('فشل في حذف الهيئة القضائية');
  await mutate('/api/judicial-bodies');
}

// ============================================================================
// الإعدادات
// ============================================================================
export function useSettings() {
  const { data, error, isLoading } = useSWR('/api/settings', fetcher);
  return { settings: data || {}, error, isLoading };
}

export async function updateSetting(key: string, value: string) {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error('فشل في تحديث الإعدادات');
  const result = await res.json();
  await mutate('/api/settings');
  return result;
}

export function getSettingValue(settings: Record<string, string>, key: string): string {
  try {
    return JSON.parse(settings[key] || '""');
  } catch {
    return settings[key] || '';
  }
}

// ============================================================================
// إعادة تحميل البيانات
// ============================================================================
export async function refreshAll() {
  await mutate('/api/clients');
  await mutate('/api/cases');
  await mutate('/api/sessions');
  await mutate('/api/payments');
  await mutate('/api/delays');
  await mutate('/api/parties');
  await mutate('/api/archives');
  await mutate('/api/lawyers');
  await mutate('/api/judicial-bodies');
  await mutate('/api/settings');
}

// ============================================================================
// الخيارات المخصصة
// ============================================================================
export function useCustomOptions(field: string) {
  const { data, mutate } = useSWR<{ id: number; value: string; label: string }[]>(
    `/api/custom-options?field=${field}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const addOption = async (value: string, label?: string) => {
    await fetch('/api/custom-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value, label: label || value }),
    });
    mutate();
  };

  return { customOptions: data || [], addOption };
}

// ============================================================================
// البذرة
// ============================================================================
export async function seedDatabase() {
  const res = await fetch('/api/seed', { method: 'POST' });
  if (!res.ok) throw new Error('فشل في بذر البيانات');
  await refreshAll();
  return res.json();
}
