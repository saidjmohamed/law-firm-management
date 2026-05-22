import Dexie, { type Table } from 'dexie';

// ============================================================================
// أنواع البيانات
// ============================================================================

export interface Client {
  id?: number;
  name?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  wilaya?: number;
  nationalId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Case {
  id?: number;
  caseNumber?: string;
  subject?: string;
  caseNature?: string;
  litigationStage?: string;
  origCaseNumber?: string;
  customStage?: string;
  status?: string;

  clientId?: number;

  councilName?: string;
  courtName?: string;
  chamber?: string;

  totalFees?: number;
  paidAmount?: number;

  registrationDate?: string;
  firstSessionDate?: string;
  delibDate?: string;

  barPhone?: string;
  lawyer?: string;
  notes?: string;
  judgment?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface Party {
  id?: number;
  caseId: number;
  role?: string;
  name?: string;
  phone?: string;
  lawyerName?: string;
  lawyerPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Delay {
  id?: number;
  caseId: number;
  delayDate?: string;
  reason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id?: number;
  caseId?: number;
  caseNumber?: string;
  date?: string;
  time?: string;
  court?: string;
  chamber?: string;
  roomNumber?: string;
  notes?: string;
  status?: string;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id?: number;
  caseId?: number;
  caseNumber?: string;
  amount?: number;
  type?: string;
  category?: string;
  date?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Archive {
  id?: number;
  caseId: number;
  caseData: string;
  archiveDate: string;
  reason?: string;
  createdAt: Date;
}

export interface Setting {
  key: string;
  value: string;
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

    this.version(5).stores({
      clients: '++id, name, phone, nationalId, wilaya, createdAt',
      cases: '++id, caseNumber, subject, caseNature, litigationStage, status, courtName, councilName, clientId, registrationDate, firstSessionDate, createdAt',
      sessions: '++id, caseId, date, status, court, createdAt',
      payments: '++id, caseId, type, category, date, createdAt',
      delays: '++id, caseId, delayDate, createdAt',
      parties: '++id, caseId, role, name, createdAt',
      archives: '++id, caseId, archiveDate, createdAt',
      settings: 'key',
    });
  }
}

export const db = new LawFirmDB();

// ============================================================================
// بذرة البيانات - 19 قضية حقيقية + 16 موكل
// ============================================================================

const CURRENT_SEED_VERSION = 5;

const DEFAULT_SETTINGS: Setting[] = [
  { key: 'lawyerName', value: JSON.stringify('سايج محمد') },
  { key: 'lawyerTitle', value: JSON.stringify('محام لدى المجلس') },
  { key: 'lawyerAddress', value: JSON.stringify('الجزائر العاصمة') },
  { key: 'lawyerPhone', value: JSON.stringify('0558873333') },
];

// الموكلون الـ 16 من ملفات القضايا
const SEED_CLIENTS: { name: string; phone?: string }[] = [
  { name: 'مدور كريمو', phone: '00213555390201' },
  { name: 'بلخوجة محمد ياسر', phone: '00213542819233' },
  { name: 'كبور صالح', phone: '00213551050488' },
  { name: 'بدر الدين عبد الرحيم', phone: '00213551525881' },
  { name: 'عماري سي احمد', phone: '00213698084523' },
  { name: 'بودبة منير', phone: '00213791449280' },
  { name: 'بن يمنية نصرالدين', phone: '00213774968339' },
  { name: 'بوجادي محمد زكرياء', phone: '00213676169592' },
  { name: 'عباسي رتيبة', phone: '0558367689' },
  { name: 'بلقاسم بوزيدة اسامة', phone: '00213777250603' },
  { name: 'خلالفة عزالدين', phone: '00213783257551' },
  { name: 'حمزة ميباركي' },
  { name: 'فوغالي أميمة' },
  { name: 'فوغالي سيرين' },
  { name: 'فوغالي ياسر' },
  { name: 'سايج محمد', phone: '0558873333' },
];

interface SeedCase {
  caseNumber: string;
  subject: string;
  caseNature: string;
  litigationStage: string;
  origCaseNumber?: string;
  status: string;
  clientName?: string;
  councilName?: string;
  courtName?: string;
  chamber?: string;
  totalFees?: number;
  paidAmount?: number;
  registrationDate?: string;
  firstSessionDate?: string;
  delibDate?: string;
  barPhone?: string;
  judgment?: string;
  delays?: { delayDate: string; reason: string }[];
  parties?: { role: string; name: string; phone?: string; lawyerName?: string; lawyerPhone?: string }[];
}

const REAL_CASES: SeedCase[] = [
  {
    caseNumber: 'طعن رقم 2018912',
    subject: 'النصب الموجه للجمهور - النصب الثلاثي',
    caseNature: 'جنحة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'مدور كريمو',
    councilName: 'المحكمة العليا',
    courtName: 'المحكمة العليا',
    chamber: 'الغرفة الجزائية',
    totalFees: 150000,
    paidAmount: 100000,
    delays: [
      { delayDate: '2026-03-16', reason: 'تاريخ التصريح بالطعن' },
      { delayDate: '2026-04-28', reason: 'تسجيل مذكرة الطعن النقض' },
    ],
    parties: [
      { role: 'مستأنف', name: 'مدور كريمو', phone: '00213555390201', lawyerName: 'سايج محمد' },
      { role: 'طرف مدني', name: 'مسعودي ابراهيم', phone: 'رقم الهاتف' },
      { role: 'متهم', name: 'شمام احمد', phone: '00213541956393' },
    ],
  },
  {
    caseNumber: '26/00239',
    subject: 'تعويض عن الضرر من قضية نصب ثلاثي',
    caseNature: 'مدني',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'بلخوجة محمد ياسر',
    councilName: 'مجلس قضاء تيزي وزو',
    courtName: 'محكمة الاربعاء ناث ايراثن',
    chamber: 'المدني',
    totalFees: 700000,
    paidAmount: 300000,
    registrationDate: '2026-04-08',
    firstSessionDate: '2026-04-22',
    delays: [
      { delayDate: '2026-05-20', reason: 'لجواب المدعى عليه' },
    ],
    parties: [
      { role: 'مدعي', name: 'السي ناصر عبد النور', lawyerName: 'زورداني محمد', lawyerPhone: '00213552764665' },
      { role: 'مدعى عليه', name: 'بلخوجة محمد ياسر', phone: '00213542819233', lawyerName: 'سايج محمد' },
    ],
  },
  {
    caseNumber: '26/01002',
    subject: 'دعوى ضمان الاستحقاق و رد الثمن و تعويض عن الضرر',
    caseNature: 'مدني',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'كبور صالح',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة بئرمرادراريس',
    chamber: 'مدني',
    totalFees: 60000,
    paidAmount: 60000,
    registrationDate: '2026-02-08',
    firstSessionDate: '2026-03-02',
    delibDate: '2026-05-27',
    parties: [
      { role: 'مدعي', name: 'كبور صالح', phone: '00213551050488', lawyerName: 'سايج محمد' },
      { role: 'مدعى عليه', name: 'ناصري جمال' },
    ],
  },
  {
    caseNumber: '25/18381',
    subject: 'إصدار شيك بدون رصيد',
    caseNature: 'جنحة',
    litigationStage: 'استئنافية',
    origCaseNumber: '25/03842',
    status: 'مؤرشفة',
    clientName: 'بدر الدين عبد الرحيم',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'مجلس قضاء الجزائر',
    chamber: 'الغرفة الجزائية الخامسة',
    totalFees: 100000,
    paidAmount: 100000,
    barPhone: '023716257',
    registrationDate: '2025-12-02',
    firstSessionDate: '2025-12-02',
    judgment: 'عام حبس نافذ للمتهم\nتعويض قيمة الشيك 340 مليون للطرف المدني',
    parties: [
      { role: 'ضحية', name: 'بدر الدين عبد الرحيم', phone: '00213551525881', lawyerName: 'سايج محمد' },
      { role: 'متهم', name: 'مدني محمد أمين', phone: 'رقم الهاتف' },
    ],
  },
  {
    caseNumber: '26/00901',
    subject: 'إلغاء قرار إداري صادر عن وزارة الدفاع',
    caseNature: 'اداري استئنافي',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'عماري سي احمد',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'المحكمة الادارية الاستئنافية بالجزائر',
    chamber: 'الإداري العادي',
    totalFees: 80000,
    paidAmount: 60000,
    registrationDate: '2026-03-02',
    parties: [
      { role: 'مدعي', name: 'عماري سي احمد', phone: '00213698084523', lawyerName: 'سايج محمد' },
      { role: 'مدعى عليه', name: 'وزارة الدفاع الوطني' },
    ],
  },
  {
    caseNumber: '26/00153',
    subject: 'النصب الموجه للجمهور (النصب الثلاثي)',
    caseNature: 'جنحة',
    litigationStage: 'استئنافية',
    origCaseNumber: '25/07238',
    status: 'جارية',
    clientName: 'بودبة منير',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'الغرفة الجزائية السادسة',
    chamber: 'جنح',
    barPhone: '023716257',
    registrationDate: '2026-03-15',
    firstSessionDate: '2026-05-10',
    delays: [
      { delayDate: '2026-05-31', reason: 'مؤجلة' },
    ],
    parties: [
      { role: 'متهم', name: 'بودبة منير', phone: '00213791449280', lawyerName: 'سايج محمد' },
      { role: 'متهم', name: 'بن يمنية نصرالدين', phone: '00213774968339', lawyerName: 'سايج' },
      { role: 'طرف مدني', name: 'بحري الصادق', phone: '00213794019201', lawyerName: 'زنبوط', lawyerPhone: '00213658885214' },
    ],
  },
  {
    caseNumber: '25/03255',
    subject: 'النصب الموجه للجمهور - نصب ثلاثي',
    caseNature: 'جنحة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'مؤرشفة',
    clientName: 'بوجادي محمد زكرياء',
    councilName: 'مجلس قضاء تيبازة',
    courtName: 'محكمة تيبازة',
    chamber: 'القسم الجزائي',
    barPhone: '0562724340',
    registrationDate: '2025-02-03',
    firstSessionDate: '2026-03-10',
    delibDate: '2026-04-07',
    judgment: 'عام حبس نافذ لبوجادي محمد زكرياء\nو براءة للضحية',
    parties: [
      { role: 'متهم', name: 'بوجادي محمد زكرياء', phone: '00213676169592', lawyerName: 'سايج محمد' },
      { role: 'طرف مدني', name: 'لمختار يمينة', phone: '00213784939372' },
      { role: 'طرف مدني', name: 'بريد الجزائر', phone: 'رقم الهاتف' },
    ],
  },
  {
    caseNumber: '25/00952',
    subject: 'الضرب و الجرح العمدي',
    caseNature: 'مخالفة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'مؤرشفة',
    clientName: 'عباسي رتيبة',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة الشراقة',
    chamber: 'جزائي',
    totalFees: 40000,
    paidAmount: 40000,
    barPhone: '0549111248',
    delibDate: '2024-10-16',
    judgment: 'غيايا للمتهمة و حضوريا للضحية\nفي الدعوى العمومية سته عشر الفا غرامة مالية\nفي الدعوى المدنية خمس ملايين تعويض لكلا الضحيتين',
    parties: [
      { role: 'متهم', name: 'عباسي رتيبة', phone: 'رقم الهاتف', lawyerName: 'سايج محمد', lawyerPhone: '0558367689' },
      { role: 'طرف مدني', name: 'بوقريوة عائشة', phone: 'نسرين حسان', lawyerName: 'حسان نسرين', lawyerPhone: '0549351590' },
    ],
  },
  {
    caseNumber: '25/07881',
    subject: 'النصب الموجه للجمهور (نص ثلاثي)',
    caseNature: 'جنحة',
    litigationStage: 'استئنافية',
    status: 'مؤرشفة',
    clientName: 'بلقاسم بوزيدة اسامة',
    councilName: 'مجلس قضاء المدية',
    courtName: 'غرفة جزائية',
    chamber: 'الجزائية',
    totalFees: 80000,
    paidAmount: 80000,
    registrationDate: '2026-01-01',
    firstSessionDate: '2026-04-30',
    delibDate: '2026-04-30',
    judgment: 'البراءة في حق المتهم',
    parties: [
      { role: 'متهم', name: 'بلقاسم بوزيدة اسامة', phone: '00213777250603', lawyerName: 'سايج محمد' },
      { role: 'طرف مدني', name: 'دحماني رانية' },
    ],
  },
  {
    caseNumber: '25/08100',
    subject: 'نزاع حول محل تجاري',
    caseNature: 'مدني',
    litigationStage: 'استئنافية',
    status: 'جارية',
    clientName: 'خلالفة عزالدين',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'الغرفة المدنية',
    chamber: 'عقاري 02',
    totalFees: 100000,
    paidAmount: 90000,
    registrationDate: '2025-10-16',
    delibDate: '2026-01-08',
    judgment: 'تأيد الحكم',
    parties: [
      { role: 'مستأنف', name: 'خلالفة عزالدين', phone: '00213783257551', lawyerName: 'سايج محمد' },
      { role: 'مستأنف عليه', name: 'فراح رتيبة', lawyerName: 'بلعابد عزيز', lawyerPhone: '00213771242236' },
    ],
  },
  {
    caseNumber: '25/07238',
    subject: 'النصب الموجه للجمهور (النصب الثلاثي)',
    caseNature: 'جنحة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'مؤرشفة',
    clientName: 'بودبة منير',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة بئرمرادراريس',
    chamber: 'جنح',
    registrationDate: '2026-05-01',
    judgment: 'الحكم ببراءة كل من بودبة منير\nبن يمينة نصر الدين\nو الادانة لكل من\nحمزة ميباركي\nخطاطبة محمد الامين ب عامين حبس نافذ و 400 الف دينار تعويض',
    parties: [
      { role: 'متهم', name: 'بودبة منير', phone: 'رقم الهاتف', lawyerName: 'سايج محمد' },
      { role: 'متهم', name: 'بن يمنية نصرالدين', phone: 'رقم الهاتف', lawyerName: 'سايج' },
      { role: 'طرف مدني', name: 'بحري الصادق' },
    ],
  },
  {
    caseNumber: '25/01724',
    subject: 'الضرب و الجرح العمدي علي قاصر اقل من 16 سنة',
    caseNature: 'مخالفة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'مؤرشفة',
    clientName: 'عباسي رتيبة',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة الشراقة',
    chamber: 'جزائي',
    totalFees: 40000,
    paidAmount: 40000,
    registrationDate: '2024-12-18',
    firstSessionDate: '2025-12-18',
    delibDate: '2026-01-08',
    judgment: 'البراءة في حق المتهمين\nالحكم كان غيابي في حق متهمين و حضوري في حق الضحايا',
    parties: [
      { role: 'متهم', name: 'عباسي رتيبة و فوغالي اميمة و فوغالي ياسر', phone: 'رقم الهاتف', lawyerName: 'سايج محمد', lawyerPhone: '0558367689' },
      { role: 'طرف مدني', name: 'بوشيرب امال و بوشيرب امينة و بوقرية عائشة', phone: 'نسرين حسان', lawyerName: 'حسان نسرين', lawyerPhone: '0549351590' },
    ],
  },
  {
    caseNumber: '26/00618',
    subject: 'النصب الموجه للجمهور (نص ثلاثي)',
    caseNature: 'جنحة',
    litigationStage: 'معارضة',
    origCaseNumber: '25/07238',
    status: 'مؤرشفة',
    clientName: 'حمزة ميباركي',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة بئرمرادراريس',
    registrationDate: '2026-02-11',
    delibDate: '2026-02-25',
    judgment: 'البراءة للمتهمين',
    parties: [
      { role: 'متهم', name: 'حمزة ميباركي', lawyerName: 'سايج محمد' },
      { role: 'متهم', name: 'خطاطبة محمد الامين', phone: 'ر' },
      { role: 'طرف مدني', name: 'صادق بحري' },
    ],
  },
  {
    caseNumber: '26/01939',
    subject: 'النصب الموجه للجمهور - نصب ثلاثي',
    caseNature: 'جنحة',
    litigationStage: 'استئنافية',
    origCaseNumber: '26/00002',
    status: 'جارية',
    clientName: 'بودبة منير',
    councilName: 'مجلس قضاء البويرة',
    courtName: 'مجلس قضاء البويرة',
    chamber: 'الغرفة الجزائية رقم 3',
    totalFees: 100000,
    paidAmount: 15000,
    barPhone: '0655572657',
    registrationDate: '2026-04-13',
    delays: [
      { delayDate: '2026-05-13', reason: 'لحضور الاطراف' },
    ],
    parties: [
      { role: 'متهم', name: 'بودبة منير', phone: '00213791449280', lawyerName: 'سايج محمد' },
      { role: 'طرف مدني', name: 'سحنون ليلى', phone: 'رقم الهاتف' },
    ],
  },
  {
    caseNumber: '25/01989',
    subject: 'الضرب و الجرح العمدي على قاصر أقل من 16 سنة',
    caseNature: 'جنحة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'مؤرشفة',
    clientName: 'عباسي رتيبة',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة الشراقة',
    chamber: 'قسم الجنح',
    totalFees: 40000,
    paidAmount: 40000,
    barPhone: '0549111248',
    registrationDate: '2024-02-18',
    firstSessionDate: '2025-02-24',
    delibDate: '2025-06-02',
    judgment: 'في الدعوى المدنية تعويض مئة الف دينار عن الضرر\nفي الدعوى العمومية عام حبس نافذ لكل منهما و خمسون الف دينار جزائري تعويض',
    parties: [
      { role: 'ضحية', name: 'عباسي رتيبة', phone: 'رقم الهاتف', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي أميمة', phone: 'قاصرة', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي سيرين', phone: 'قاصر', lawyerName: 'سايج محمد' },
      { role: 'معارض ضده', name: 'بوشيرب امال حديجة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين', lawyerPhone: '0549351590' },
      { role: 'متهم', name: 'بوقريوة عائشة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين' },
    ],
  },
  {
    caseNumber: '25/02438',
    subject: 'الضرب و الجرح العمدي على قاصر أقل من 16 سنة',
    caseNature: 'مخالفة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'مؤرشفة',
    clientName: 'عباسي رتيبة',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة الشراقة',
    chamber: 'قسم الجنح',
    barPhone: '0549111248',
    registrationDate: '2024-03-07',
    firstSessionDate: '2025-03-03',
    delibDate: '2025-05-05',
    judgment: 'إدانة المتهمين بعام حكم نافذ\nو غرامة مالية نافذة لكل واحدة منهن في الدعوى المدنية\n80000 دج للضرر عن كل واحدة\nحكم غيابي للمتهمين',
    parties: [
      { role: 'ضحية', name: 'عباسي رتيبة', phone: 'رقم الهاتف', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي أميمة', phone: 'قاصرة', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي ياسر', phone: 'قاصر', lawyerName: 'سايج محمد' },
      { role: 'معارض ضده', name: 'بوشيرب امال خديجة/ بوشيرب امينة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين', lawyerPhone: '0549351590' },
      { role: 'متهم', name: 'بوقريوة عائشة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين' },
    ],
  },
  {
    caseNumber: '26/04216',
    subject: 'الضرب و الجرح العمدي على قاصر أقل من 16 سنة',
    caseNature: 'جنحة',
    litigationStage: 'معارضة',
    origCaseNumber: '25/02438',
    status: 'جارية',
    clientName: 'عباسي رتيبة',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة الشراقة',
    chamber: 'قسم الجنح',
    totalFees: 40000,
    paidAmount: 0,
    barPhone: '0549111248',
    registrationDate: '2026-04-08',
    firstSessionDate: '2026-05-04',
    delays: [
      { delayDate: '2026-06-01', reason: 'لحضور الاطراف' },
    ],
    parties: [
      { role: 'ضحية', name: 'عباسي رتيبة', phone: 'رقم الهاتف', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي أميمة', phone: 'قاصرة', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي ياسر', phone: 'قاصر', lawyerName: 'سايج محمد' },
      { role: 'معارض ضده', name: 'بوشيرب امال خديجة/ بوشيرب امينة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين', lawyerPhone: '0549351590' },
      { role: 'متهم', name: 'بوقريوة عائشة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين' },
    ],
  },
  {
    caseNumber: '26/04221',
    subject: 'الضرب و الجرح العمدي على قاصر أقل من 16 سنة',
    caseNature: 'جنحة',
    litigationStage: 'معارضة',
    origCaseNumber: '25/01989',
    status: 'جارية',
    clientName: 'عباسي رتيبة',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة الشراقة',
    chamber: 'قسم الجنح',
    totalFees: 40000,
    paidAmount: 0,
    barPhone: '0549111248',
    registrationDate: '2026-04-08',
    firstSessionDate: '2026-05-04',
    delays: [
      { delayDate: '2026-06-01', reason: 'لحضور الاطراف' },
    ],
    parties: [
      { role: 'ضحية', name: 'عباسي رتيبة', phone: 'رقم الهاتف', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي أميمة', phone: 'قاصرة', lawyerName: 'سايج محمد' },
      { role: 'ضحية', name: 'فوغالي سيرين', phone: 'قاصر', lawyerName: 'سايج محمد' },
      { role: 'معارض ضده', name: 'بوشيرب امال خديجة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين', lawyerPhone: '0549351590' },
      { role: 'متهم', name: 'بوقريوة عائشة', phone: 'رقم الهاتف', lawyerName: 'حسان نسرين' },
    ],
  },
  {
    caseNumber: '26/002',
    subject: 'النصب الموجه للجمهور (النصب الثلاثي)',
    caseNature: 'جنحة',
    litigationStage: 'معارضة',
    status: 'مؤرشفة',
    clientName: 'بودبة منير',
    councilName: 'مجلس قضاء البويرة',
    courtName: 'محكمة امشدالة',
    chamber: 'جنح',
    barPhone: '0655572567',
    registrationDate: '2026-04-30',
    firstSessionDate: '2026-04-30',
    delibDate: '2026-04-30',
    judgment: 'البراءة للمتهم\nفي حق بودبة منير',
    parties: [
      { role: 'متهم', name: 'بودبة منير', phone: '00213791449280', lawyerName: 'سايج محمد' },
      { role: 'طرف مدني', name: 'سحنون ليلى' },
    ],
  },
];

export async function seedDatabase() {
  try {
    // تحقق من إصدار البذرة
    const seedVersionSetting = await db.settings.get('seedVersion');
    const currentVersion = seedVersionSetting ? JSON.parse(seedVersionSetting.value) : 0;

    if (currentVersion >= CURRENT_SEED_VERSION) {
      // البذرة محدثة، لا حاجة لإعادة البذرة
      return;
    }

    console.log('[Seed] Starting database seed, version:', currentVersion, '->', CURRENT_SEED_VERSION);

    // إذا كانت هناك بيانات قديمة و الإصدار أقل، نقوم بالمسح و إعادة البذرة
    if (currentVersion > 0 && currentVersion < CURRENT_SEED_VERSION) {
      console.log('[Seed] Upgrading seed, clearing old data...');
      await db.transaction('rw', [db.clients, db.cases, db.sessions, db.payments, db.delays, db.parties, db.archives, db.settings], async () => {
        await db.clients.clear();
        await db.cases.clear();
        await db.sessions.clear();
        await db.payments.clear();
        await db.delays.clear();
        await db.parties.clear();
        await db.archives.clear();
        await db.settings.clear();
      });
    }

    const now = new Date();

    // إدراج الموكلين أولاً
    const clientIdMap: Record<string, number> = {};
    for (const seedClient of SEED_CLIENTS) {
      const clientId = await db.clients.add({
        name: seedClient.name,
        phone: seedClient.phone || '',
        createdAt: now,
        updatedAt: now,
      });
      clientIdMap[seedClient.name] = clientId as number;
    }
    console.log('[Seed] Created', SEED_CLIENTS.length, 'clients');

    // إدراج القضايا
    for (const seedCase of REAL_CASES) {
      // البحث عن clientId المناسب
      let clientId: number | undefined;
      if (seedCase.clientName && clientIdMap[seedCase.clientName]) {
        clientId = clientIdMap[seedCase.clientName];
      }

      const caseId = await db.cases.add({
        caseNumber: seedCase.caseNumber,
        subject: seedCase.subject,
        caseNature: seedCase.caseNature,
        litigationStage: seedCase.litigationStage,
        origCaseNumber: seedCase.origCaseNumber,
        status: seedCase.status,
        clientId: clientId,
        councilName: seedCase.councilName,
        courtName: seedCase.courtName,
        chamber: seedCase.chamber,
        totalFees: seedCase.totalFees,
        paidAmount: seedCase.paidAmount,
        registrationDate: seedCase.registrationDate,
        firstSessionDate: seedCase.firstSessionDate,
        delibDate: seedCase.delibDate,
        barPhone: seedCase.barPhone,
        lawyer: 'سايج محمد',
        judgment: seedCase.judgment,
        createdAt: now,
        updatedAt: now,
      });

      // إدراج الأطراف
      if (seedCase.parties) {
        for (const party of seedCase.parties) {
          await db.parties.add({
            caseId: caseId as number,
            role: party.role,
            name: party.name,
            phone: party.phone,
            lawyerName: party.lawyerName,
            lawyerPhone: party.lawyerPhone,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // إدراج التأجيلات
      if (seedCase.delays) {
        for (const delay of seedCase.delays) {
          await db.delays.add({
            caseId: caseId as number,
            delayDate: delay.delayDate,
            reason: delay.reason,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // أرشفة القضايا المؤرشفة
      if (seedCase.status === 'مؤرشفة') {
        const cParties = seedCase.parties || [];
        const cDelays = seedCase.delays || [];
        await db.archives.add({
          caseId: caseId as number,
          caseData: JSON.stringify({
            caseNumber: seedCase.caseNumber,
            subject: seedCase.subject,
            caseNature: seedCase.caseNature,
            litigationStage: seedCase.litigationStage,
            status: seedCase.status,
            councilName: seedCase.councilName,
            courtName: seedCase.courtName,
            chamber: seedCase.chamber,
            totalFees: seedCase.totalFees,
            paidAmount: seedCase.paidAmount,
            judgment: seedCase.judgment,
            parties: cParties,
            delays: cDelays,
          }),
          archiveDate: now.toISOString(),
          reason: 'أرشفة تلقائية',
          createdAt: now,
        });
      }
    }
    console.log('[Seed] Created', REAL_CASES.length, 'cases');

    // إدراج الإعدادات
    await db.settings.bulkAdd(DEFAULT_SETTINGS);
    await db.settings.put({ key: 'seedVersion', value: JSON.stringify(CURRENT_SEED_VERSION) });

    console.log('[Seed] Database seeded successfully');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    // محاولة إعادة البذرة بإصدار جديد
    throw error;
  }
}

/** إعادة تعيين قاعدة البيانات بالكامل */
export async function resetDatabase() {
  console.log('[DB] Resetting database...');
  await db.delete();
  // إعادة فتح قاعدة البيانات
  await db.open();
  await seedDatabase();
  console.log('[DB] Database reset complete');
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
export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '0 د.ج';
  return `${amount.toLocaleString('en-US')} د.ج`;
}
