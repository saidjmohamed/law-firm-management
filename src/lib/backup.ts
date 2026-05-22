// ============================================================================
// خدمة النسخ الاحتياطي والاستعادة - بدون تشفير
// ============================================================================

import { db, type Client, type Case, type Session, type Payment, type Delay, type Party, type Archive, type Setting } from './db';

export interface BackupData {
  version: string;
  exportDate: string;
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

const APP_VERSION = '2.0.0';

/** تصدير قاعدة البيانات بالكامل */
export async function exportBackup(): Promise<void> {
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

  const backupData: BackupData = {
    version: APP_VERSION,
    exportDate: new Date().toISOString(),
    data: { clients, cases, sessions, payments, delays, parties, archives, settings },
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const dateStr = new Date().toISOString().split('T')[0];
  const blob = new Blob([jsonString], { type: 'application/json' });
  const filename = `backup_${dateStr}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // حفظ تاريخ آخر نسخة
  await db.settings.put({ key: 'lastBackupDate', value: JSON.stringify(new Date().toISOString()) });
}

/** استيراد نسخة احتياطية من ملف JSON */
export async function importBackup(file: File): Promise<void> {
  const jsonString = await file.text();
  const backupData: BackupData = JSON.parse(jsonString);

  if (!backupData.version || !backupData.data) {
    throw new Error('ملف النسخة الاحتياطية غير صالح');
  }

  await db.transaction('rw', [db.clients, db.cases, db.sessions, db.payments, db.delays, db.parties, db.archives, db.settings], async () => {
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

    if (backupData.data.clients?.length) await db.clients.bulkPut(backupData.data.clients);
    if (backupData.data.cases?.length) await db.cases.bulkPut(backupData.data.cases);
    if (backupData.data.sessions?.length) await db.sessions.bulkPut(backupData.data.sessions);
    if (backupData.data.payments?.length) await db.payments.bulkPut(backupData.data.payments);
    if (backupData.data.delays?.length) await db.delays.bulkPut(backupData.data.delays);
    if (backupData.data.parties?.length) await db.parties.bulkPut(backupData.data.parties);
    if (backupData.data.archives?.length) await db.archives.bulkPut(backupData.data.archives);
    if (backupData.data.settings?.length) await db.settings.bulkPut(backupData.data.settings);
  });
}

/** استيراد من ملفات نصية قديمة */
export async function importFromTxtFiles(files: FileList): Promise<number> {
  let imported = 0;
  const now = new Date();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await file.text();

    try {
      // محاولة تحليل الملف النصي
      const lines = text.split('\n').filter((l) => l.trim());
      const data: Record<string, string> = {};

      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.substring(0, colonIdx).trim();
          const value = line.substring(colonIdx + 1).trim();
          data[key] = value;
        }
      }

      if (Object.keys(data).length > 0) {
        await db.cases.add({
          caseNumber: data['رقم القضية'] || data['caseNumber'] || file.name,
          subject: data['الموضوع'] || data['subject'] || '',
          caseNature: data['طبيعة القضية'] || data['caseNature'] || '',
          status: data['الحالة'] || data['status'] || 'جارية',
          courtName: data['المحكمة'] || data['courtName'] || '',
          councilName: data['المجلس'] || data['councilName'] || '',
          notes: text,
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      }
    } catch {
      // تخطي الملفات التي لا يمكن تحليلها
    }
  }

  return imported;
}
