import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { toDateOrNull } from '@/lib/date-utils';

// ============================================================================
// بذرة بيانات تجريبية (وهمية بالكامل) — لعرض ميزات النظام فقط
// ============================================================================
// تنبيه هام: هذه البيانات وهمية ولا تمثل أي شخص حقيقي. لا يجوز أبداً وضع بيانات
// حقيقية لموكلين أو أطراف قضايا في كود المصدر (خصوصاً في مستودع Git)، لأن ذلك
// يُعد خرقاً للسر المهني ويبقى بشكل دائم في تاريخ الإصدارات حتى بعد حذفه لاحقاً.
// لاستيراد بيانات حقيقية، استخدم واجهة الاستيراد (النسخ الاحتياطي JSON) بعد
// تسجيل الدخول، وليس عبر هذا المسار.
// ============================================================================

const SEED_CLIENTS: { name: string; phone?: string }[] = [
  { name: 'موكل تجريبي 1', phone: '0550000001' },
  { name: 'موكل تجريبي 2', phone: '0550000002' },
  { name: 'موكل تجريبي 3', phone: '0550000003' },
  { name: 'موكل تجريبي 4', phone: '0550000004' },
  { name: 'موكل تجريبي 5', phone: '0550000005' },
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
  { name: 'محكمة بئرمرادراريس', type: 'court', wilayaId: 16 },
  { name: 'محكمة الشراقة', type: 'court', wilayaId: 16 },
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

// بيانات وهمية بالكامل — الغرض منها فقط توضيح شكل التطبيق للمستخدم الجديد
const DEMO_CASES: SeedCase[] = [
  {
    caseNumber: 'تجريبي-2026-001',
    subject: 'دعوى مدنية تجريبية (مثال توضيحي)',
    caseNature: 'مدني',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'موكل تجريبي 1',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'محكمة بئرمرادراريس',
    courtLevel: 'court',
    chamber: 'مدني',
    wilayaId: 16,
    totalFees: 50000,
    paidAmount: 20000,
    registrationDate: '2026-02-01',
    firstSessionDate: '2026-03-01',
    delays: [{ delayDate: '2026-04-01', reason: 'لجواب المدعى عليه' }],
    parties: [
      { role: 'مدعي', name: 'موكل تجريبي 1', phone: '0550000001', lawyerName: 'اسم المحامي' },
      { role: 'مدعى عليه', name: 'طرف تجريبي أ' },
    ],
  },
  {
    caseNumber: 'تجريبي-2026-002',
    subject: 'قضية جزائية تجريبية (مثال توضيحي)',
    caseNature: 'جنحة',
    litigationStage: 'استئنافية',
    origCaseNumber: 'تجريبي-2025-010',
    status: 'مؤرشفة',
    clientName: 'موكل تجريبي 2',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'مجلس قضاء الجزائر',
    courtLevel: 'council',
    chamber: 'الغرفة الجزائية',
    wilayaId: 16,
    totalFees: 80000,
    paidAmount: 80000,
    registrationDate: '2025-11-01',
    firstSessionDate: '2025-11-15',
    delibDate: '2026-01-10',
    judgment: 'مثال توضيحي لنص الحكم — بيانات وهمية',
    parties: [
      { role: 'متهم', name: 'موكل تجريبي 2', phone: '0550000002', lawyerName: 'اسم المحامي' },
      { role: 'طرف مدني', name: 'طرف تجريبي ب' },
    ],
  },
  {
    caseNumber: 'تجريبي-2026-003',
    subject: 'طعن بالنقض تجريبي (مثال توضيحي)',
    caseNature: 'جنحة',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'موكل تجريبي 3',
    councilName: 'المحكمة العليا',
    courtName: 'المحكمة العليا',
    courtLevel: 'supreme',
    chamber: 'الغرفة الجزائية',
    totalFees: 150000,
    paidAmount: 100000,
    delays: [{ delayDate: '2026-05-01', reason: 'تسجيل مذكرة الطعن' }],
    parties: [
      { role: 'طاعن', name: 'موكل تجريبي 3', phone: '0550000003', lawyerName: 'اسم المحامي' },
      { role: 'مطعون ضده', name: 'طرف تجريبي ج' },
    ],
  },
  {
    caseNumber: 'تجريبي-2026-004',
    subject: 'دعوى إدارية تجريبية (مثال توضيحي)',
    caseNature: 'اداري استئنافي',
    litigationStage: 'افتتاحية (ابتدائي)',
    status: 'جارية',
    clientName: 'موكل تجريبي 4',
    councilName: 'مجلس قضاء الجزائر',
    courtName: 'المحكمة الإدارية الاستئنافية بالجزائر',
    courtLevel: 'admin_appeal',
    chamber: 'الإداري العادي',
    wilayaId: 16,
    totalFees: 70000,
    paidAmount: 40000,
    registrationDate: '2026-03-01',
    parties: [
      { role: 'مدعي', name: 'موكل تجريبي 4', phone: '0550000004', lawyerName: 'اسم المحامي' },
      { role: 'مدعى عليه', name: 'جهة إدارية تجريبية' },
    ],
  },
  {
    caseNumber: 'تجريبي-2026-005',
    subject: 'قضية مؤرشفة تجريبية (مثال توضيحي)',
    caseNature: 'مدني',
    litigationStage: 'استئنافية',
    status: 'مؤرشفة',
    clientName: 'موكل تجريبي 5',
    councilName: 'مجلس قضاء المدية',
    courtName: 'مجلس قضاء المدية',
    courtLevel: 'council',
    chamber: 'المدنية',
    wilayaId: 26,
    totalFees: 60000,
    paidAmount: 60000,
    registrationDate: '2026-01-01',
    delibDate: '2026-02-01',
    judgment: 'مثال توضيحي لنص الحكم — بيانات وهمية',
    parties: [
      { role: 'مستأنف', name: 'موكل تجريبي 5', phone: '0550000005', lawyerName: 'اسم المحامي' },
      { role: 'مستأنف عليه', name: 'طرف تجريبي د' },
    ],
  },
];

export async function POST() {
  try {
    // التحقق من وجود بيانات مسبقاً — استخدام seedVersion لمنع التكرار
    const seedSetting = await prisma.setting.findUnique({ where: { key: 'seedVersion' } });
    if (seedSetting?.value) {
      return NextResponse.json(
        { message: 'البيانات موجودة مسبقاً — لا يمكن إعادة البذرة', seedVersion: seedSetting.value },
        { status: 200 }
      );
    }

    // فحص إضافي: حتى لو لم يكن seedVersion، تحقق من وجود بيانات
    const existingCases = await prisma.case.count();
    const existingClients = await prisma.client.count();

    if (existingCases > 0 || existingClients > 0) {
      return NextResponse.json(
        { message: 'البيانات موجودة مسبقاً — لا يمكن إعادة البذرة' },
        { status: 200 }
      );
    }

    // بذر البيانات في معاملة واحدة
    const result = await prisma.$transaction(async (tx) => {
      // 1. إدراج الإعدادات (قيم افتراضية فارغة — يعدّلها المستخدم من صفحة الإعدادات)
      const settings = [
        { key: 'lawyerName', value: '' },
        { key: 'lawyerTitle', value: '' },
        { key: 'lawyerAddress', value: '' },
        { key: 'lawyerPhone', value: '' },
        { key: 'lawyerEmail', value: '' },
        { key: 'seedVersion', value: 'demo-9' },
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

      // 3. إدراج الموكلين (وهميون بالكامل)
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

      // 4. إدراج القضايا مع الأطراف والآجال والأرشيف (وهمية بالكامل)
      for (const seedCase of DEMO_CASES) {
        const clientId = seedCase.clientName
          ? clientIdMap[seedCase.clientName]
          : undefined;

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
            registrationDate: toDateOrNull(seedCase.registrationDate) ?? null,
            firstSessionDate: toDateOrNull(seedCase.firstSessionDate) ?? null,
            delibDate: toDateOrNull(seedCase.delibDate) ?? null,
            barPhone: seedCase.barPhone ?? '',
            lawyer: '',
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
                  delayDate: toDateOrNull(d.delayDate) ?? null,
                  reason: d.reason ?? '',
                  notes: '',
                })),
              },
            },
          },
        });

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
        cases: DEMO_CASES.length,
        courts: SEED_COURTS.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'تم بذر بيانات تجريبية وهمية بنجاح (لا تحتوي على أي بيانات حقيقية)',
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
