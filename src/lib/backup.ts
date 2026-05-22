// ============================================================================
// خدمة النسخ الاحتياطي والاستعادة
// ============================================================================
// تصدير واستيراد قاعدة البيانات بالكامل مع:
// - بصمة SHA-256 للتحقق من سلامة البيانات
// - تشفير اختياري باستخدام AES-GCM
// - معرف فريد لكل جهاز
// ============================================================================

import { db, type Client, type Case, type Session, type Payment, type Delay, type Party, type Archive, type Setting } from './db';
import { encrypt, decrypt, uint8ArrayToBase64, base64ToUint8Array } from './crypto';

// ============================================================================
// أنواع البيانات
// ============================================================================

/** هيكل بيانات النسخ الاحتياطي */
export interface BackupData {
  /** إصدار التطبيق */
  version: string;
  /** تاريخ التصدير بصيغة ISO */
  exportDate: string;
  /** معرف الجهاز */
  deviceId: string;
  /** بصمة SHA-256 للتحقق من سلامة البيانات */
  checksum: string;
  /** البيانات الفعلية */
  data: {
    clients: Client[];
    cases: Case[];
    sessions: Session[];
    payments: Payment[];
    delays: Delay[];
    parties: Party[];
    archives: Archive[];
    settings: Setting[];
  };
}

/** إصدار التطبيق الحالي */
const APP_VERSION = '1.0.0';

/** مفتاح معرف الجهاز في التخزين المحلي */
const DEVICE_ID_KEY = 'lawfirm_device_id';

// ============================================================================
// معرف الجهاز
// ============================================================================

/**
 * جلب أو توليد معرف فريد للجهاز
 * @returns معرف الجهاز
 */
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // توليد معرف عشوائي
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// ============================================================================
// بصمة البيانات (SHA-256)
// ============================================================================

/**
 * حساب بصمة SHA-256 لبيانات النسخ الاحتياطي
 * @param data - البيانات المراد حساب بصمتها
 * @returns بصمة SHA-16 بالنظام الست عشري
 */
async function calculateChecksum(data: unknown): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // تحويل إلى نص ست عشري
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// التصدير
// ============================================================================

/**
 * تصدير قاعدة البيانات بالكامل إلى كائن JSON
 * @returns بيانات النسخ الاحتياطي
 */
export async function exportDatabase(): Promise<BackupData> {
  // جلب جميع البيانات من كل الجداول
  const [clients, cases, sessions, payments, delays, parties, archives, settings] = await Promise.all([
    db.clients.toArray(),
    db.cases.toArray(),
    db.sessions.toArray(),
    db.payments.toArray(),
    db.delays.toArray(),
    db.parties.toArray(),
    db.archives.toArray(),
    db.settings.toArray(),
  ]);

  const data = { clients, cases, sessions, payments, delays, parties, archives, settings };

  // حساب البصمة
  const checksum = await calculateChecksum(data);

  return {
    version: APP_VERSION,
    exportDate: new Date().toISOString(),
    deviceId: getDeviceId(),
    checksum,
    data,
  };
}

/**
 * تصدير قاعدة البيانات إلى ملف وتنزيله
 * @param encryptionEnabled - هل التشفير مفعّل
 * @param password - كلمة مرور التشفير (إذا كانت مفعّلة)
 */
export async function exportToFile(encryptionEnabled?: boolean, password?: string): Promise<void> {
  const backupData = await exportDatabase();
  const jsonString = JSON.stringify(backupData, null, 2);
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let blob: Blob;
  let filename: string;

  if (encryptionEnabled && password) {
    // تشفير البيانات
    const encryptedData = await encrypt(jsonString, password);
    const base64Data = uint8ArrayToBase64(encryptedData);
    blob = new Blob([base64Data], { type: 'application/octet-stream' });
    filename = `backup_${dateStr}.enc`;
  } else {
    // تصدير بدون تشفير
    blob = new Blob([jsonString], { type: 'application/json' });
    filename = `backup_${dateStr}.json`;
  }

  // تنزيل الملف
  triggerDownload(blob, filename);
}

// ============================================================================
// الاستعادة
// ============================================================================

/**
 * استيراد قاعدة البيانات من كائن JSON (يستبدل جميع البيانات)
 * @param backupData - بيانات النسخ الاحتياطي
 */
export async function importDatabase(backupData: BackupData): Promise<void> {
  // التحقق من البصمة
  const currentChecksum = await calculateChecksum(backupData.data);
  if (currentChecksum !== backupData.checksum) {
    throw new Error('بصمة البيانات غير متطابقة - قد تكون البيانات تالفة أو معدّلة');
  }

  // مسح جميع البيانات الحالية واستبدالها بالبيانات المستوردة
  await db.transaction('rw', [db.clients, db.cases, db.sessions, db.payments, db.delays, db.parties, db.archives, db.settings], async () => {
    // مسح كل الجداول
    await Promise.all([
      db.clients.clear(),
      db.cases.clear(),
      db.sessions.clear(),
      db.payments.clear(),
      db.delays.clear(),
      db.parties.clear(),
      db.archives.clear(),
      db.settings.clear(),
    ]);

    // إدراج البيانات المستوردة باستخدام bulkPut للكفاءة
    if (backupData.data.clients?.length) {
      await db.clients.bulkPut(backupData.data.clients);
    }
    if (backupData.data.cases?.length) {
      await db.cases.bulkPut(backupData.data.cases);
    }
    if (backupData.data.sessions?.length) {
      await db.sessions.bulkPut(backupData.data.sessions);
    }
    if (backupData.data.payments?.length) {
      await db.payments.bulkPut(backupData.data.payments);
    }
    if (backupData.data.delays?.length) {
      await db.delays.bulkPut(backupData.data.delays);
    }
    if (backupData.data.parties?.length) {
      await db.parties.bulkPut(backupData.data.parties);
    }
    if (backupData.data.archives?.length) {
      await db.archives.bulkPut(backupData.data.archives);
    }
    if (backupData.data.settings?.length) {
      await db.settings.bulkPut(backupData.data.settings);
    }
  });
}

/**
 * استيراد قاعدة البيانات من ملف (يدعم .json و .enc)
 * @param file - ملف النسخ الاحتياطي
 * @param password - كلمة مرور التشفير (للملفات المشفرة)
 * @returns بيانات النسخ الاحتياطي
 */
export async function importFromFile(file: File, password?: string): Promise<BackupData> {
  const fileName = file.name.toLowerCase();

  let jsonString: string;

  if (fileName.endsWith('.enc')) {
    // ملف مشفّر
    if (!password) {
      throw new Error('كلمة المرور مطلوبة لفك تشفير النسخة الاحتياطية');
    }

    const base64Data = await file.text();
    const encryptedData = base64ToUint8Array(base64Data);
    jsonString = await decrypt(encryptedData, password);
  } else {
    // ملف JSON عادي
    jsonString = await file.text();
  }

  // تحويل JSON إلى كائن
  const backupData: BackupData = JSON.parse(jsonString);

  // التحقق من بنية البيانات
  if (!backupData.version || !backupData.data || !backupData.checksum) {
    throw new Error('ملف النسخة الاحتياطية غير صالح - بنية البيانات غير صحيحة');
  }

  // استيراد البيانات
  await importDatabase(backupData);

  return backupData;
}

// ============================================================================
// دوال مساعدة
// ============================================================================

/**
 * تنزيل ملف من المتصفح
 * @param blob - محتوى الملف
 * @param filename - اسم الملف
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // تنظيف
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * جلب معلومات النسخة الاحتياطية دون استيرادها
 * @param file - ملف النسخة الاحتياطية
 * @param password - كلمة المرور (للملفات المشفرة)
 * @returns معلومات أساسية عن النسخة
 */
export async function getBackupInfo(file: File, password?: string): Promise<{
  version: string;
  exportDate: string;
  deviceId: string;
  counts: {
    clients: number;
    cases: number;
    sessions: number;
    payments: number;
    delays: number;
    parties: number;
    archives: number;
  };
} | null> {
  try {
    const fileName = file.name.toLowerCase();
    let jsonString: string;

    if (fileName.endsWith('.enc')) {
      if (!password) return null;
      const base64Data = await file.text();
      const encryptedData = base64ToUint8Array(base64Data);
      jsonString = await decrypt(encryptedData, password);
    } else {
      jsonString = await file.text();
    }

    const backupData: BackupData = JSON.parse(jsonString);

    return {
      version: backupData.version,
      exportDate: backupData.exportDate,
      deviceId: backupData.deviceId,
      counts: {
        clients: backupData.data.clients?.length ?? 0,
        cases: backupData.data.cases?.length ?? 0,
        sessions: backupData.data.sessions?.length ?? 0,
        payments: backupData.data.payments?.length ?? 0,
        delays: backupData.data.delays?.length ?? 0,
        parties: backupData.data.parties?.length ?? 0,
        archives: backupData.data.archives?.length ?? 0,
      },
    };
  } catch {
    return null;
  }
}
