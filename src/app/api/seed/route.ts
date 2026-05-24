import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================================================
// بذرة البيانات - 19 قضية حقيقية + 16 موكل + الهيئات القضائية
// ============================================================================

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

const SEED_COURTS: {
  name: string;
  type: string;
  wilayaId?: number;
  chambers?: string;
}[] = [
  {
    name: 'المحكمة العليا',
    type: 'supreme',
    chambers:
      '[{"name":"الغرفة المدنية","number":null},{"name":"الغرفة العقارية","number":null},{"name":"غرفة شؤون الأسرة والمواريث","number":null},{"name":"الغرفة التجارية والبحرية","number":null},{"name":"الغرفة الاجتماعية","number":null},{"name":"الغرفة الجنائية","number":null},{"name":"غرفة الجنح والمخالفات","number":null}]',
  },
  {
    name: 'مجلس قضاء الجزائر',
    type: 'council',
    wilayaId: 16,
    chambers:
      '[{"name":"الغرفة المدنية","number":null},{"name":"الغرفة الجزائية","number":null},{"name":"غرفة الاتهام","number":null},{"name":"الغرفة الاستعجالية","number":null},{"name":"غرفة شؤون الأسرة","number":null},{"name":"غرفة الأحداث","number":null},{"name":"الغرفة الاجتماعية","number":null},{"name":"الغرفة العقارية","number":null},{"name":"الغرفة البحرية","number":null},{"name":"الغرفة التجارية","number":null}]',
  },
  { name: 'مجلس قضاء البويرة', type: 'council', wilayaId: 10 },
  { name: 'مجلس قضاء تيبازة', type: 'council', wilayaId: 42 },
  { name: 'مجلس قضاء المدية', type: 'council', wilayaId: 26 },
  { name: 'مجلس قضاء تيزي وزو', type: 'council', wilayaId: 15 },
  { name: 'محكمة بئرمرادراريس', type: 'court', wilayaId: 16 },
  { name: 'محكمة الشراقة', type: 'court', wilayaId: 16 },
  { name: 'محكمة تيبازة', type: 'court', wilayaId: 42 },
  { name: 'محكمة امشدالة', type: 'court', wilayaId: 10 },
  { name: 'محكمة الاربعاء ناث ايراثن', type: 'court', wilayaId: 15 },
  {
    name: 'المحكمة الإدارية الاستئنافية بالجزائر',
    type: 'admin_appeal',
    wilayaId: 16,
  },
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
  courtLevel?: string;
  chamber?: string;
  chamberNumber?: number;
  wilayaId?: number;
  totalFees?: number;
  paidAmount?: number;
  registrationDate?: string;
  firstSessionDate?: string;
  delibDate?: string;
  barPhone?: string;
  judgment?: string;
  delays?: { delayDate: string; reason: string }[];
  parties?: {
    role: string;
    name: string;
    phone?: string;
    lawyerName?: string;
    lawyerPhone?: string;
  }[];
}

const REAL_CASES: SeedCase[] = [
  {
    caseNumber: 'طعن رقم 2018912',
    subject: 'النصب الموجه للجمهور - النصب الثلاثي',
    caseNature: 'جنحة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'مدور كريمو',
    courtName: 'المحكمة العليا',
    courtLevel: 'supreme',
    councilName: 'المحكمة العليا',
    chamber: 'الغرفة الجزائية',
    totalFees: 150000,
    paidAmount: 100000,
    delays: [
      { delayDate: '2026-03-16', reason: 'تاريخ التصريح بالطعن' },
      { delayDate: '2026-04-28', reason: 'تسجيل مذكرة الطعن النقض' },
    ],
    parties: [
      {
        role: 'مستأنف',
        name: 'مدور كريمو',
        phone: '00213555390201',
        lawyerName: 'سايج محمد',
      },
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
    courtLevel: 'court',
    chamber: 'المدني',
    wilayaId: 15,
    totalFees: 700000,
    paidAmount: 300000,
    registrationDate: '2026-04-08',
    firstSessionDate: '2026-04-22',
    delays: [{ delayDate: '2026-05-20', reason: 'لجواب المدعى عليه' }],
    parties: [
      {
        role: 'مدعي',
        name: 'السي ناصر عبد النور',
        lawyerName: 'زورداني محمد',
        lawyerPhone: '00213552764665',
      },
      {
        role: 'مدعى عليه',
        name: 'بلخوجة محمد ياسر',
        phone: '00213542819233',
        lawyerName: 'سايج محمد',
      },
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
    courtLevel: 'court',
    chamber: 'مدني',
    wilayaId: 16,
    totalFees: 60000,
    paidAmount: 60000,
    registrationDate: '2026-02-08',
    firstSessionDate: '2026-03-02',
    delibDate: '2026-05-27',
    parties: [
      {
        role: 'مدعي',
        name: 'كبور صالح',
        phone: '00213551050488',
        lawyerName: 'سايج محمد',
      },
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
    courtLevel: 'council',
    chamber: 'الغرفة الجزائية الخامسة',
    wilayaId: 16,
    totalFees: 100000,
    paidAmount: 100000,
    barPhone: '023716257',
    registrationDate: '2025-12-02',
    firstSessionDate: '2025-12-02',
    judgment:
      'عام حبس نافذ للمتهم\nتعويض قيمة الشيك 340 مليون للطرف المدني',
    parties: [
      {
        role: 'ضحية',
        name: 'بدر الدين عبد الرحيم',
        phone: '00213551525881',
        lawyerName: 'سايج محمد',
      },
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
    courtLevel: 'admin_appeal',
    chamber: 'الإداري العادي',
    wilayaId: 16,
    totalFees: 80000,
    paidAmount: 60000,
    registrationDate: '2026-03-02',
    parties: [
      {
        role: 'مدعي',
        name: 'عماري سي احمد',
        phone: '00213698084523',
        lawyerName: 'سايج محمد',
      },
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
    courtLevel: 'council',
    chamber: 'جنح',
    wilayaId: 16,
    barPhone: '023716257',
    registrationDate: '2026-03-15',
    firstSessionDate: '2026-05-10',
    delays: [{ delayDate: '2026-05-31', reason: 'مؤجلة' }],
    parties: [
      {
        role: 'متهم',
        name: 'بودبة منير',
        phone: '00213791449280',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'متهم',
        name: 'بن يمنية نصرالدين',
        phone: '00213774968339',
        lawyerName: 'سايج',
      },
      {
        role: 'طرف مدني',
        name: 'بحري الصادق',
        phone: '00213794019201',
        lawyerName: 'زنبوط',
        lawyerPhone: '00213658885214',
      },
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
    courtLevel: 'court',
    chamber: 'القسم الجزائي',
    wilayaId: 42,
    barPhone: '0562724340',
    registrationDate: '2025-02-03',
    firstSessionDate: '2026-03-10',
    delibDate: '2026-04-07',
    judgment:
      'عام حبس نافذ لبوجادي محمد زكرياء\nو براءة للضحية',
    parties: [
      {
        role: 'متهم',
        name: 'بوجادي محمد زكرياء',
        phone: '00213676169592',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'طرف مدني',
        name: 'لمختار يمينة',
        phone: '00213784939372',
      },
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
    courtLevel: 'court',
    chamber: 'جزائي',
    wilayaId: 16,
    totalFees: 40000,
    paidAmount: 40000,
    barPhone: '0549111248',
    delibDate: '2024-10-16',
    judgment:
      'غيايا للمتهمة و حضوريا للضحية\nفي الدعوى العمومية سته عشر الفا غرامة مالية\nفي الدعوى المدنية خمس ملايين تعويض لكلا الضحيتين',
    parties: [
      {
        role: 'متهم',
        name: 'عباسي رتيبة',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج محمد',
        lawyerPhone: '0558367689',
      },
      {
        role: 'طرف مدني',
        name: 'بوقريوة عائشة',
        phone: 'نسرين حسان',
        lawyerName: 'حسان نسرين',
        lawyerPhone: '0549351590',
      },
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
    courtLevel: 'council',
    chamber: 'الجزائية',
    wilayaId: 26,
    totalFees: 80000,
    paidAmount: 80000,
    registrationDate: '2026-01-01',
    firstSessionDate: '2026-04-30',
    delibDate: '2026-04-30',
    judgment: 'البراءة في حق المتهم',
    parties: [
      {
        role: 'متهم',
        name: 'بلقاسم بوزيدة اسامة',
        phone: '00213777250603',
        lawyerName: 'سايج محمد',
      },
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
    courtLevel: 'council',
    chamber: 'عقاري 02',
    wilayaId: 16,
    totalFees: 100000,
    paidAmount: 90000,
    registrationDate: '2025-10-16',
    delibDate: '2026-01-08',
    judgment: 'تأيد الحكم',
    parties: [
      {
        role: 'مستأنف',
        name: 'خلالفة عزالدين',
        phone: '00213783257551',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'مستأنف عليه',
        name: 'فراح رتيبة',
        lawyerName: 'بلعابد عزيز',
        lawyerPhone: '00213771242236',
      },
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
    courtLevel: 'court',
    chamber: 'جنح',
    wilayaId: 16,
    registrationDate: '2026-05-01',
    judgment:
      'الحكم ببراءة كل من بودبة منير\nبن يمينة نصر الدين\nو الادانة لكل من\nحمزة ميباركي\nخطاطبة محمد الامين ب عامين حبس نافذ و 400 الف دينار تعويض',
    parties: [
      {
        role: 'متهم',
        name: 'بودبة منير',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'متهم',
        name: 'بن يمنية نصرالدين',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج',
      },
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
    courtLevel: 'court',
    chamber: 'جزائي',
    wilayaId: 16,
    totalFees: 40000,
    paidAmount: 40000,
    registrationDate: '2024-12-18',
    firstSessionDate: '2025-12-18',
    delibDate: '2026-01-08',
    judgment:
      'البراءة في حق المتهمين\nالحكم كان غيابي في حق متهمين و حضوري في حق الضحايا',
    parties: [
      {
        role: 'متهم',
        name: 'عباسي رتيبة و فوغالي اميمة و فوغالي ياسر',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج محمد',
        lawyerPhone: '0558367689',
      },
      {
        role: 'طرف مدني',
        name: 'بوشيرب امال و بوشيرب امينة و بوقرية عائشة',
        phone: 'نسرين حسان',
        lawyerName: 'حسان نسرين',
        lawyerPhone: '0549351590',
      },
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
    courtLevel: 'court',
    chamber: 'جنح',
    wilayaId: 16,
    registrationDate: '2026-02-11',
    delibDate: '2026-02-25',
    judgment: 'البراءة للمتهمين',
    parties: [
      {
        role: 'متهم',
        name: 'حمزة ميباركي',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'متهم',
        name: 'خطاطبة محمد الامين',
        phone: 'ر',
      },
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
    courtLevel: 'council',
    chamber: 'الغرفة الجزائية رقم 3',
    wilayaId: 10,
    totalFees: 100000,
    paidAmount: 15000,
    barPhone: '0655572657',
    registrationDate: '2026-04-13',
    delays: [{ delayDate: '2026-05-13', reason: 'لحضور الاطراف' }],
    parties: [
      {
        role: 'متهم',
        name: 'بودبة منير',
        phone: '00213791449280',
        lawyerName: 'سايج محمد',
      },
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
    courtLevel: 'court',
    chamber: 'قسم الجنح',
    wilayaId: 16,
    totalFees: 40000,
    paidAmount: 40000,
    barPhone: '0549111248',
    registrationDate: '2024-02-18',
    firstSessionDate: '2025-02-24',
    delibDate: '2025-06-02',
    judgment:
      'في الدعوى المدنية تعويض مئة الف دينار عن الضرر\nفي الدعوى العمومية عام حبس نافذ لكل منهما و خمسون الف دينار جزائري تعويض',
    parties: [
      {
        role: 'ضحية',
        name: 'عباسي رتيبة',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي أميمة',
        phone: 'قاصرة',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي سيرين',
        phone: 'قاصر',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'معارض ضده',
        name: 'بوشيرب امال حديجة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
        lawyerPhone: '0549351590',
      },
      {
        role: 'متهم',
        name: 'بوقريوة عائشة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
      },
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
    courtLevel: 'court',
    chamber: 'قسم الجنح',
    wilayaId: 16,
    barPhone: '0549111248',
    registrationDate: '2024-03-07',
    firstSessionDate: '2025-03-03',
    delibDate: '2025-05-05',
    judgment:
      'إدانة المتهمين بعام حكم نافذ\nو غرامة مالية نافذة لكل واحدة منهن في الدعوى المدنية\n80000 دج للضرر عن كل واحدة\nحكم غيابي للمتهمين',
    parties: [
      {
        role: 'ضحية',
        name: 'عباسي رتيبة',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي أميمة',
        phone: 'قاصرة',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي ياسر',
        phone: 'قاصر',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'معارض ضده',
        name: 'بوشيرب امال خديجة/ بوشيرب امينة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
        lawyerPhone: '0549351590',
      },
      {
        role: 'متهم',
        name: 'بوقريوة عائشة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
      },
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
    courtLevel: 'court',
    chamber: 'قسم الجنح',
    wilayaId: 16,
    totalFees: 40000,
    paidAmount: 0,
    barPhone: '0549111248',
    registrationDate: '2026-04-08',
    firstSessionDate: '2026-05-04',
    delays: [{ delayDate: '2026-06-01', reason: 'لحضور الاطراف' }],
    parties: [
      {
        role: 'ضحية',
        name: 'عباسي رتيبة',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي أميمة',
        phone: 'قاصرة',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي ياسر',
        phone: 'قاصر',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'معارض ضده',
        name: 'بوشيرب امال خديجة/ بوشيرب امينة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
        lawyerPhone: '0549351590',
      },
      {
        role: 'متهم',
        name: 'بوقريوة عائشة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
      },
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
    courtLevel: 'court',
    chamber: 'قسم الجنح',
    wilayaId: 16,
    totalFees: 40000,
    paidAmount: 0,
    barPhone: '0549111248',
    registrationDate: '2026-04-08',
    firstSessionDate: '2026-05-04',
    delays: [{ delayDate: '2026-06-01', reason: 'لحضور الاطراف' }],
    parties: [
      {
        role: 'ضحية',
        name: 'عباسي رتيبة',
        phone: 'رقم الهاتف',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي أميمة',
        phone: 'قاصرة',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'ضحية',
        name: 'فوغالي سيرين',
        phone: 'قاصر',
        lawyerName: 'سايج محمد',
      },
      {
        role: 'معارض ضده',
        name: 'بوشيرب امال خديجة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
        lawyerPhone: '0549351590',
      },
      {
        role: 'متهم',
        name: 'بوقريوة عائشة',
        phone: 'رقم الهاتف',
        lawyerName: 'حسان نسرين',
      },
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
    courtLevel: 'court',
    chamber: 'جنح',
    wilayaId: 10,
    barPhone: '0655572567',
    registrationDate: '2026-04-30',
    firstSessionDate: '2026-04-30',
    delibDate: '2026-04-30',
    judgment: 'البراءة للمتهم\nفي حق بودبة منير',
    parties: [
      {
        role: 'متهم',
        name: 'بودبة منير',
        phone: '00213791449280',
        lawyerName: 'سايج محمد',
      },
      { role: 'طرف مدني', name: 'سحنون ليلى' },
    ],
  },
];

export async function POST() {
  try {
    // التحقق من وجود بيانات مسبقاً
    const existingCases = await prisma.case.count();
    const existingClients = await prisma.client.count();

    if (existingCases > 0 || existingClients > 0) {
      return NextResponse.json(
        { message: 'البيانات موجودة مسبقاً' },
        { status: 200 }
      );
    }

    // بذر البيانات في معاملة واحدة
    const result = await prisma.$transaction(async (tx) => {
      // 1. إدراج الإعدادات
      const settings = [
        { key: 'lawyerName', value: 'سايج محمد' },
        { key: 'lawyerTitle', value: 'محام لدى المجلس' },
        {
          key: 'lawyerAddress',
          value: '12 شارع الإخوة بوعدو - بئر مراد رايس - الجزائر',
        },
        { key: 'lawyerPhone', value: '0558357689' },
        { key: 'lawyerEmail', value: 'SAIDJ.MOHAMED@GMAIL.COM' },
        { key: 'seedVersion', value: '8' },
      ];

      for (const setting of settings) {
        await tx.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value },
        });
      }

      // 2. إدراج الهيئات القضائية
      const courtIdMap: Record<string, number> = {};
      for (const seedCourt of SEED_COURTS) {
        const court = await tx.judicialBody.create({
          data: {
            name: seedCourt.name,
            type: seedCourt.type,
            wilayaId: seedCourt.wilayaId ?? 16,
            chambers: seedCourt.chambers ?? '',
          },
        });
        courtIdMap[seedCourt.name] = court.id;
      }

      // 3. إدراج الموكلين
      const clientIdMap: Record<string, number> = {};
      for (const seedClient of SEED_CLIENTS) {
        const client = await tx.client.create({
          data: {
            name: seedClient.name,
            phone: seedClient.phone ?? '',
          },
        });
        clientIdMap[seedClient.name] = client.id;
      }

      // 4. إدراج القضايا مع الأطراف والآجال والأرشيف
      for (const seedCase of REAL_CASES) {
        const clientId = seedCase.clientName
          ? clientIdMap[seedCase.clientName]
          : undefined;

        // البحث عن courtId
        const courtId = seedCase.courtName
          ? courtIdMap[seedCase.courtName]
          : undefined;

        const createdCase = await tx.case.create({
          data: {
            caseNumber: seedCase.caseNumber,
            subject: seedCase.subject,
            caseNature: seedCase.caseNature,
            litigationStage: seedCase.litigationStage,
            origCaseNumber: seedCase.origCaseNumber ?? '',
            status: seedCase.status,
            clientId: clientId,
            wilayaId: seedCase.wilayaId ?? 16,
            courtLevel: seedCase.courtLevel ?? '',
            courtId: courtId,
            councilName: seedCase.councilName ?? '',
            courtName: seedCase.courtName ?? '',
            chamber: seedCase.chamber ?? '',
            totalFees: seedCase.totalFees ?? 0,
            paidAmount: seedCase.paidAmount ?? 0,
            registrationDate: seedCase.registrationDate ?? '',
            firstSessionDate: seedCase.firstSessionDate ?? '',
            delibDate: seedCase.delibDate ?? '',
            barPhone: seedCase.barPhone ?? '',
            lawyer: 'سايج محمد',
            judgment: seedCase.judgment ?? '',
            parties: {
              createMany: {
                data: (seedCase.parties ?? []).map((p) => ({
                  role: p.role ?? '',
                  name: p.name ?? '',
                  phone: p.phone ?? '',
                  lawyerName: p.lawyerName ?? '',
                  lawyerPhone: p.lawyerPhone ?? '',
                })),
              },
            },
            delays: {
              createMany: {
                data: (seedCase.delays ?? []).map((d) => ({
                  delayDate: d.delayDate ?? '',
                  reason: d.reason ?? '',
                  notes: '',
                })),
              },
            },
          },
        });

        // إنشاء سجل أرشيف للقضايا المؤرشفة
        if (seedCase.status === 'مؤرشفة') {
          const caseData = JSON.stringify({
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
            parties: seedCase.parties ?? [],
            delays: seedCase.delays ?? [],
          });

          await tx.archive.create({
            data: {
              caseId: createdCase.id,
              caseData: caseData,
              archiveDate: new Date().toISOString(),
              reason: 'أرشفة تلقائية',
            },
          });
        }
      }

      return {
        clients: SEED_CLIENTS.length,
        cases: REAL_CASES.length,
        courts: SEED_COURTS.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'تم بذر البيانات بنجاح',
      stats: result,
    });
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'حدث خطأ أثناء بذر البيانات',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
