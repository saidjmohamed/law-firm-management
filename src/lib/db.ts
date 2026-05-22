import Dexie, { type Table } from 'dexie';

// ============================================================================
// نوع الموكل
// ============================================================================
export interface Client {
  id?: number;
  name: string;              // الاسم واللقب
  phone: string;             // الهاتف
  phone2?: string;           // هاتف ثاني
  email?: string;
  address?: string;          // العنوان
  wilaya?: number;           // الولاية (1-58)
  nationalId?: string;       // رقم الهوية
  type: 'individual' | 'company';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// نوع القضية
// ============================================================================
export interface Case {
  id?: number;
  caseNumber: string;        // رقم القضية
  subject: string;           // الموضوع
  clientId?: number;         // ربط بالموكل
  clientName?: string;

  // التسلسل القضائي
  courtType: 'ordinary' | 'administrative' | 'supreme';  // نوع القضاء
  councilName?: string;      // المجلس القضائي
  courtName?: string;        // المحكمة
  sectionName?: string;      // القسم/الغرفة
  sectionNumber?: string;    // رقم القسم/الغرفة

  // تفاصيل القضية
  caseNature: string;        // طبيعة القضية (جنحة, مدني, عقاري, etc.)
  stage: string;             // مرحلة التقاضي (ابتدائي, استئنافية, معارضة, etc.)
  origCaseNumber?: string;   // رقم القضية الأصلية (للاستئناف/المعارضة)
  customStage?: string;      // مرحلة مخصصة
  status: 'active' | 'scheduling' | 'decided' | 'archived';  // جارية, للجدولة, مفصول فيها, مؤرشفة

  // المالية
  fees?: number;             // الأتعاب
  paid?: number;             // المدفوع

  // الخصم
  opposingParty?: string;    // الخصم
  opposingLawyer?: string;   // محامي الخصم

  // التواريخ
  registrationDate?: string; // تاريخ التسجيل
  firstSessionDate?: string; // أول جلسة
  delibDate?: string;        // تاريخ المداولة

  // معلومات إضافية
  barPhone?: string;         // هاتف قاعة المحامين
  notes?: string;
  judgment?: string;         // منطوق الحكم

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// نوع الجلسة
// ============================================================================
export interface Session {
  id?: number;
  caseId: number;
  caseNumber: string;
  caseSubject?: string;
  date: string;              // تاريخ الجلسة
  time?: string;             // الوقت
  court?: string;            // المحكمة
  hall?: string;             // القاعة
  judgeName?: string;        // اسم القاضي
  notes?: string;
  status: 'scheduled' | 'completed' | 'postponed' | 'cancelled';
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// نوع الدفع
// ============================================================================
export interface Payment {
  id?: number;
  caseId?: number;
  caseNumber?: string;
  caseSubject?: string;
  clientId?: number;
  clientName?: string;
  type: 'income' | 'expense';
  category: string;          // أتعاب, استشارات, مصاريف قضية, etc.
  amount: number;
  description?: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// نوع التأجيل
// ============================================================================
export interface Delay {
  id?: number;
  caseId: number;
  caseNumber: string;
  caseSubject?: string;
  delayDate: string;         // تاريخ التأجيل
  reason: string;            // سبب التأجيل
  newDate?: string;          // التاريخ الجديد
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// نوع أطراف النزاع
// ============================================================================
export interface Party {
  id?: number;
  caseId: number;
  role: string;              // المركز القانوني (مدعي, مدعى عليه, etc.)
  name: string;              // الاسم واللقب
  phone?: string;
  lawyerName?: string;       // اسم محاميه
  lawyerPhone?: string;      // هاتف المحامي
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// نوع الأرشيف
// ============================================================================
export interface Archive {
  id?: number;
  caseId: number;
  caseData: string;          // JSON snapshot of the case + related data
  archiveDate: string;
  reason?: string;
  createdAt: Date;
}

// ============================================================================
// نوع الإعدادات
// ============================================================================
export interface Setting {
  key: string;               // المفتاح الأساسي
  value: string;             // JSON string
}

// ============================================================================
// قاعدة البيانات - Dexie
// ============================================================================
class LawFirmDB extends Dexie {
  clients!: Table<Client>;
  cases!: Table<Case>;
  sessions!: Table<Session>;
  payments!: Table<Payment>;
  delays!: Table<Delay>;
  parties!: Table<Party>;
  archives!: Table<Archive>;
  settings!: Table<Setting>;

  constructor() {
    super('LawFirmDB');

    this.version(2).stores({
      clients: '++id, name, phone, nationalId, type, wilaya, createdAt',
      cases: '++id, caseNumber, subject, clientId, courtType, courtName, caseNature, stage, status, registrationDate, firstSessionDate, createdAt',
      sessions: '++id, caseId, date, status, court, createdAt',
      payments: '++id, caseId, clientId, type, category, date, createdAt',
      delays: '++id, caseId, delayDate, createdAt',
      parties: '++id, caseId, role, name, createdAt',
      archives: '++id, caseId, archiveDate, createdAt',
      settings: 'key',
    });
  }
}

/** نسخة واحدة من قاعدة البيانات للاستعمال في كل التطبيق */
export const db = new LawFirmDB();

// ============================================================================
// بذرة البيانات التجريبية - جزائرية
// ============================================================================

/** الإعدادات الافتراضية */
const DEFAULT_SETTINGS: Setting[] = [
  { key: 'lawyerName', value: JSON.stringify('الاستاذ سايج محمد محمد') },
  { key: 'lawyerTitle', value: JSON.stringify('محام لدى المجلس') },
  { key: 'lawyerAddress', value: JSON.stringify('الجزائر العاصمة') },
  { key: 'lawyerPhone', value: JSON.stringify('0550123456') },
  { key: 'encryptionEnabled', value: JSON.stringify(false) },
  { key: 'encryptionPassword', value: JSON.stringify('') },
];

/** بذرة قاعدة البيانات ببيانات جزائرية تجريبية */
export async function seedDatabase() {
  const clientCount = await db.clients.count();
  if (clientCount > 0) return;

  const now = new Date();

  // ---- الموكلون ----
  const clientId1 = await db.clients.add({
    name: 'كريم بوزيد',
    phone: '0551234567',
    phone2: '0770123456',
    email: 'karim.bouzid@email.com',
    address: 'شارع ديدوش مراد، الجزائر العاصمة',
    wilaya: 16,
    nationalId: '1602991234567',
    type: 'individual',
    notes: 'موكل قديم - قضايا عقارية وتجارية',
    createdAt: now,
    updatedAt: now,
  });

  const clientId2 = await db.clients.add({
    name: 'مؤسسة الإعمار للأشغال',
    phone: '021234567',
    phone2: '0552987654',
    email: 'contact@el-emaar.dz',
    address: 'حي 500 مسكن، البليدة',
    wilaya: 9,
    nationalId: '09B1234567',
    type: 'company',
    notes: 'شركة أشغال عمومية - قضايا عمالية وتجارية',
    createdAt: now,
    updatedAt: now,
  });

  const clientId3 = await db.clients.add({
    name: 'نادية بلقاسم',
    phone: '0661234567',
    email: 'nadia.belkacem@email.com',
    address: 'شارع الاستقلال، وهران',
    wilaya: 31,
    nationalId: '3112851234567',
    type: 'individual',
    notes: 'قضايا أحوال شخصية',
    createdAt: now,
    updatedAt: now,
  });

  const clientId4 = await db.clients.add({
    name: 'يوسف مراد',
    phone: '0770234567',
    address: 'حي بن عمر، قسنطينة',
    wilaya: 25,
    nationalId: '2505901234567',
    type: 'individual',
    notes: 'قضايا جنحة وجناية',
    createdAt: now,
    updatedAt: now,
  });

  // ---- القضايا ----
  const caseId1 = await db.cases.add({
    caseNumber: '2024/م/001',
    subject: 'نزاع عقاري حول قطعة أرض',
    clientId: clientId1 as number,
    clientName: 'كريم بوزيد',
    courtType: 'ordinary',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة الجزائر العاصمة',
    sectionName: 'الغرفة المدنية',
    sectionNumber: '03',
    caseNature: 'عقاري',
    stage: 'ابتدائي',
    status: 'active',
    fees: 80000,
    paid: 30000,
    opposingParty: 'محمد بن علي',
    opposingLawyer: 'الأستاذ رابح خلفي',
    registrationDate: '2024-01-15',
    firstSessionDate: '2024-03-10',
    barPhone: '0550987654',
    notes: 'نزاع حول ملكية قطعة أرض مساحتها 500 متر مربع',
    createdAt: now,
    updatedAt: now,
  });

  const caseId2 = await db.cases.add({
    caseNumber: '2024/م/002',
    subject: 'دعوى طلاق ونفقة',
    clientId: clientId3 as number,
    clientName: 'نادية بلقاسم',
    courtType: 'ordinary',
    councilName: 'مجلس قضاء وهران',
    courtName: 'محكمة وهران',
    sectionName: 'قسم الأحوال الشخصية',
    sectionNumber: '01',
    caseNature: 'أحوال شخصية',
    stage: 'ابتدائي',
    status: 'scheduling',
    fees: 50000,
    paid: 25000,
    opposingParty: 'عبد الرحمن بلقاسم',
    opposingLawyer: 'الأستاذ عمر بن حبيب',
    registrationDate: '2024-03-20',
    firstSessionDate: '2024-05-08',
    notes: 'دعوى طلاق مع نفقة أولاد وحضانة',
    createdAt: now,
    updatedAt: now,
  });

  const caseId3 = await db.cases.add({
    caseNumber: '2024/إ/001',
    subject: 'مطالبة بأتعاب أشغال',
    clientId: clientId2 as number,
    clientName: 'مؤسسة الإعمار للأشغال',
    courtType: 'administrative',
    councilName: 'مجلس قضاء البليدة',
    courtName: 'المحكمة الإدارية بالبليدة',
    sectionName: 'الغرفة الإدارية',
    sectionNumber: '01',
    caseNature: 'إداري',
    stage: 'استئنافية',
    origCaseNumber: '2023/إ/015',
    status: 'active',
    fees: 150000,
    paid: 60000,
    opposingParty: 'بلدية البليدة',
    registrationDate: '2024-02-10',
    firstSessionDate: '2024-04-15',
    notes: 'مطالبة بأتعاب أشغال عمومية - مرحلة استئنافية',
    createdAt: now,
    updatedAt: now,
  });

  const caseId4 = await db.cases.add({
    caseNumber: '2024/ج/001',
    subject: 'قضية سرقة مع سطو',
    clientId: clientId4 as number,
    clientName: 'يوسف مراد',
    courtType: 'ordinary',
    councilName: 'مجلس قضاء قسنطينة',
    courtName: 'محكمة قسنطينة',
    sectionName: 'الغرفة الجزائية',
    sectionNumber: '02',
    caseNature: 'جنحة',
    stage: 'ابتدائي',
    status: 'decided',
    fees: 40000,
    paid: 40000,
    opposingParty: 'الدولة الجزائرية',
    registrationDate: '2024-04-05',
    firstSessionDate: '2024-06-12',
    delibDate: '2024-09-20',
    judgment: 'براءة المتهم لانعدام الأدلة',
    notes: 'تم الفصل - براءة',
    createdAt: now,
    updatedAt: now,
  });

  // ---- الجلسات ----
  await db.sessions.bulkAdd([
    {
      caseId: caseId1 as number,
      caseNumber: '2024/م/001',
      caseSubject: 'نزاع عقاري حول قطعة أرض',
      date: '2025-06-15',
      time: '09:30',
      court: 'محكمة الجزائر العاصمة',
      hall: 'القاعة 3',
      judgeName: 'القاضي بلقاسم جلول',
      notes: 'جلسة استماع شهود',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId1 as number,
      caseNumber: '2024/م/001',
      caseSubject: 'نزاع عقاري حول قطعة أرض',
      date: '2025-05-20',
      time: '10:00',
      court: 'محكمة الجزائر العاصمة',
      hall: 'القاعة 5',
      judgeName: 'القاضي بلقاسم جلول',
      notes: 'تم تأجيل الجلسة لاستكمال المستندات',
      status: 'postponed',
      result: 'تأجيل لاستكمال المستندات',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId2 as number,
      caseNumber: '2024/م/002',
      caseSubject: 'دعوى طلاق ونفقة',
      date: '2025-06-10',
      time: '11:00',
      court: 'محكمة وهران',
      hall: 'القاعة 2',
      judgeName: 'القاضية هدى بن عمر',
      notes: 'جلسة صلح',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId3 as number,
      caseNumber: '2024/إ/001',
      caseSubject: 'مطالبة بأتعاب أشغال',
      date: '2025-06-22',
      time: '08:30',
      court: 'المحكمة الإدارية بالبليدة',
      hall: 'القاعة 1',
      judgeName: 'القاضي عبد الله مراد',
      notes: 'جلسة مرافعة',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // ---- المدفوعات ----
  await db.payments.bulkAdd([
    {
      caseId: caseId1 as number,
      caseNumber: '2024/م/001',
      caseSubject: 'نزاع عقاري حول قطعة أرض',
      clientId: clientId1 as number,
      clientName: 'كريم بوزيد',
      type: 'income',
      category: 'أتعاب',
      amount: 30000,
      description: 'دفعة أولى من الأتعاب - 30,000 د.ج',
      date: '2024-01-20',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId2 as number,
      caseNumber: '2024/م/002',
      caseSubject: 'دعوى طلاق ونفقة',
      clientId: clientId3 as number,
      clientName: 'نادية بلقاسم',
      type: 'income',
      category: 'أتعاب',
      amount: 25000,
      description: 'دفعة أولى من الأتعاب - 25,000 د.ج',
      date: '2024-04-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId3 as number,
      caseNumber: '2024/إ/001',
      caseSubject: 'مطالبة بأتعاب أشغال',
      clientId: clientId2 as number,
      clientName: 'مؤسسة الإعمار للأشغال',
      type: 'income',
      category: 'أتعاب',
      amount: 60000,
      description: 'دفعة أولى من الأتعاب - 60,000 د.ج',
      date: '2024-02-15',
      createdAt: now,
      updatedAt: now,
    },
    {
      type: 'expense',
      category: 'إيجار',
      amount: 40000,
      description: 'إيجار المكتب - شهر مارس 2024',
      date: '2024-03-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId1 as number,
      caseNumber: '2024/م/001',
      caseSubject: 'نزاع عقاري حول قطعة أرض',
      type: 'expense',
      category: 'مصاريف قضية',
      amount: 5000,
      description: 'رسوم المحكمة ووثائق - 5,000 د.ج',
      date: '2024-01-18',
      createdAt: now,
      updatedAt: now,
    },
    {
      clientId: clientId2 as number,
      clientName: 'مؤسسة الإعمار للأشغال',
      type: 'income',
      category: 'استشارات',
      amount: 15000,
      description: 'استشارة قانونية - مؤسسة الإعمار - 15,000 د.ج',
      date: '2024-03-15',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // ---- التأجيلات ----
  await db.delays.bulkAdd([
    {
      caseId: caseId1 as number,
      caseNumber: '2024/م/001',
      caseSubject: 'نزاع عقاري حول قطعة أرض',
      delayDate: '2025-05-20',
      reason: 'استكمال المستندات',
      newDate: '2025-06-15',
      notes: 'الخصم لم يحضر وطلب تأجيل',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId2 as number,
      caseNumber: '2024/م/002',
      caseSubject: 'دعوى طلاق ونفقة',
      delayDate: '2025-04-12',
      reason: 'غياب الخصم',
      newDate: '2025-06-10',
      notes: 'تم التأجيل لغياب المدعى عليه',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // ---- أطراف النزاع ----
  await db.parties.bulkAdd([
    {
      caseId: caseId1 as number,
      role: 'مدعي',
      name: 'كريم بوزيد',
      phone: '0551234567',
      lawyerName: 'الاستاذ سايج محمد محمد',
      lawyerPhone: '0550123456',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId1 as number,
      role: 'مدعى عليه',
      name: 'محمد بن علي',
      phone: '0660987654',
      lawyerName: 'الأستاذ رابح خلفي',
      lawyerPhone: '0550876543',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId2 as number,
      role: 'مدعية',
      name: 'نادية بلقاسم',
      phone: '0661234567',
      lawyerName: 'الاستاذ سايج محمد محمد',
      lawyerPhone: '0550123456',
      createdAt: now,
      updatedAt: now,
    },
    {
      caseId: caseId2 as number,
      role: 'مدعى عليه',
      name: 'عبد الرحمن بلقاسم',
      phone: '0770345678',
      lawyerName: 'الأستاذ عمر بن حبيب',
      lawyerPhone: '0550654321',
      createdAt: now,
      updatedAt: now,
    },
  ]);

  // ---- الإعدادات ----
  await db.settings.bulkAdd(DEFAULT_SETTINGS);
}

// ============================================================================
// دوال مساعدة
// ============================================================================

/** جلب إعداد من قاعدة البيانات */
export async function getSetting<T = string>(key: string): Promise<T | null> {
  const setting = await db.settings.get(key);
  if (!setting) return null;
  try {
    return JSON.parse(setting.value) as T;
  } catch {
    return setting.value as unknown as T;
  }
}

/** حفظ إعداد في قاعدة البيانات */
export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value: JSON.stringify(value) });
}

/** تنسيق المبلغ بالدينار الجزائري */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('en-US')} د.ج`;
}
