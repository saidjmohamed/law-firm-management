import Dexie, { type Table } from 'dexie';

export interface Client {
  id?: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  nationalId: string;
  type: 'individual' | 'company';
  notes: string;
  createdAt: Date;
}

export interface Case {
  id?: number;
  caseNumber: string;
  title: string;
  clientId: number;
  clientName: string;
  court: string;
  caseType: string;
  status: 'active' | 'closed' | 'pending' | 'archived';
  description: string;
  opposingParty: string;
  opposingLawyer: string;
  startDate: Date;
  endDate?: Date;
  notes: string;
  createdAt: Date;
}

export interface Session {
  id?: number;
  caseId: number;
  caseTitle: string;
  caseNumber: string;
  date: Date;
  time: string;
  court: string;
  hall: string;
  judgeName: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'postponed' | 'cancelled';
  result?: string;
  createdAt: Date;
}

export interface Transaction {
  id?: number;
  caseId?: number;
  caseTitle?: string;
  clientId?: number;
  clientName?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
}

export interface Document {
  id?: number;
  caseId?: number;
  caseTitle?: string;
  clientId?: number;
  clientName?: string;
  title: string;
  docType: string;
  content: string;
  createdAt: Date;
}

class LawFirmDB extends Dexie {
  clients!: Table<Client>;
  cases!: Table<Case>;
  sessions!: Table<Session>;
  transactions!: Table<Transaction>;
  documents!: Table<Document>;

  constructor() {
    super('LawFirmDB');
    this.version(1).stores({
      clients: '++id, name, phone, nationalId, type, createdAt',
      cases: '++id, caseNumber, title, clientId, caseType, status, createdAt',
      sessions: '++id, caseId, date, status, createdAt',
      transactions: '++id, caseId, clientId, type, category, date, createdAt',
      documents: '++id, caseId, clientId, docType, createdAt',
    });
  }
}

export const db = new LawFirmDB();

export async function seedDatabase() {
  const clientCount = await db.clients.count();
  if (clientCount > 0) return;

  const now = new Date();

  const clients = await db.clients.bulkAdd([
    {
      name: 'أحمد محمد علي',
      phone: '0512345678',
      email: 'ahmed@example.com',
      address: 'الرياض، حي النزهة، شارع الملك فهد',
      nationalId: '1234567890',
      type: 'individual',
      notes: 'عميل قديم - قضايا تجارية',
      createdAt: now,
    },
    {
      name: 'شركة النور التجارية',
      phone: '0112345678',
      email: 'info@alnour.com',
      address: 'جدة، حي الروضة، طريق المدينة',
      nationalId: '9876543210',
      type: 'company',
      notes: 'شركة مساهمة - قضايا عمالية وتجارية',
      createdAt: now,
    },
    {
      name: 'فاطمة حسن',
      phone: '0598765432',
      email: 'fatima@example.com',
      address: 'الدمام، حي الفيصلية، شارع الأمير سعد',
      nationalId: '1122334455',
      type: 'individual',
      notes: 'قضايا أحوال شخصية',
      createdAt: now,
    },
  ]);

  const case1 = await db.cases.add({
    caseNumber: '2024-م-001',
    title: 'نزاع تجاري مع شركة الأمل',
    clientId: 1,
    clientName: 'أحمد محمد علي',
    court: 'المحكمة التجارية بالرياض',
    caseType: 'تجاري',
    status: 'active',
    description: 'نزاع حول عقد توريد بمبلغ 500,000 ريال',
    opposingParty: 'شركة الأمل للتوريدات',
    opposingLawyer: 'م. خالد العمري',
    startDate: new Date('2024-01-15'),
    notes: 'تأجيل الجلسة لاستكمال المستندات',
    createdAt: now,
  });

  const case2 = await db.cases.add({
    caseNumber: '2024-خ-002',
    title: 'دعوى خلع وطلاق',
    clientId: 3,
    clientName: 'فاطمة حسن',
    court: 'المحكمة العامة بالدمام',
    caseType: 'أحوال شخصية',
    status: 'pending',
    description: 'دعوى خلع مع نفقة وأولاد',
    opposingParty: 'عبدالله سعيد',
    opposingLawyer: 'أ. سالم الدوسري',
    startDate: new Date('2024-03-20'),
    notes: 'مطلوب تسوية ودية',
    createdAt: now,
  });

  await db.cases.add({
    caseNumber: '2024-ع-003',
    title: 'مطالبة برواتب متأخرة',
    clientId: 2,
    clientName: 'شركة النور التجارية',
    court: 'المحكمة العمالية بجدة',
    caseType: 'عمالي',
    status: 'closed',
    description: 'مطالبة موظف برواتب 3 أشهر متأخرة',
    opposingParty: 'محمد سالم العتيبي',
    opposingLawyer: 'أ. ناصر القحطاني',
    startDate: new Date('2024-02-10'),
    endDate: new Date('2024-05-15'),
    notes: 'تم الحكم لصالح الشركة جزئياً',
    createdAt: now,
  });

  await db.sessions.bulkAdd([
    {
      caseId: case1 as number,
      caseTitle: 'نزاع تجاري مع شركة الأمل',
      caseNumber: '2024-م-001',
      date: new Date('2025-06-01'),
      time: '10:00',
      court: 'المحكمة التجارية بالرياض',
      hall: 'القاعة 3',
      judgeName: 'القاضي عبدالرحمن الشهري',
      notes: 'جلسة استماع شهود',
      status: 'scheduled',
      createdAt: now,
    },
    {
      caseId: case1 as number,
      caseTitle: 'نزاع تجاري مع شركة الأمل',
      caseNumber: '2024-م-001',
      date: new Date('2025-05-15'),
      time: '09:30',
      court: 'المحكمة التجارية بالرياض',
      hall: 'القاعة 5',
      judgeName: 'القاضي عبدالرحمن الشهري',
      notes: 'تم تأجيل الجلسة',
      status: 'postponed',
      result: 'تأجيل لاستكمال المستندات',
      createdAt: now,
    },
    {
      caseId: case2 as number,
      caseTitle: 'دعوى خلع وطلاق',
      caseNumber: '2024-خ-002',
      date: new Date('2025-06-05'),
      time: '11:00',
      court: 'المحكمة العامة بالدمام',
      hall: 'القاعة 2',
      judgeName: 'القاضي فهد المالكي',
      notes: 'جلسة صلح',
      status: 'scheduled',
      createdAt: now,
    },
  ]);

  await db.transactions.bulkAdd([
    {
      caseId: case1 as number,
      caseTitle: 'نزاع تجاري مع شركة الأمل',
      clientId: 1,
      clientName: 'أحمد محمد علي',
      type: 'income',
      category: 'أتعاب',
      amount: 15000,
      description: 'أتعاب تقديم الدعوى',
      date: new Date('2024-01-20'),
      createdAt: now,
    },
    {
      caseId: case2 as number,
      caseTitle: 'دعوى خلع وطلاق',
      clientId: 3,
      clientName: 'فاطمة حسن',
      type: 'income',
      category: 'أتعاب',
      amount: 8000,
      description: 'أتعاب المرافعة',
      date: new Date('2024-04-01'),
      createdAt: now,
    },
    {
      type: 'expense',
      category: 'إيجار',
      amount: 5000,
      description: 'إيجار المكتب - شهر مايو',
      date: new Date('2024-05-01'),
      createdAt: now,
    },
    {
      caseId: case1 as number,
      caseTitle: 'نزاع تجاري مع شركة الأمل',
      type: 'expense',
      category: 'مصاريف قضية',
      amount: 2000,
      description: 'رسوم المحكمة',
      date: new Date('2024-01-18'),
      createdAt: now,
    },
    {
      type: 'income',
      category: 'استشارات',
      amount: 3000,
      description: 'استشارة قانونية - شركة النور',
      clientId: 2,
      clientName: 'شركة النور التجارية',
      date: new Date('2024-03-15'),
      createdAt: now,
    },
  ]);

  await db.documents.bulkAdd([
    {
      caseId: case1 as number,
      caseTitle: 'نزاع تجاري مع شركة الأمل',
      clientId: 1,
      clientName: 'أحمد محمد علي',
      title: 'عقد التوريد',
      docType: 'عقد',
      content: 'عقد توريد بضائع بين شركة الأمل وأحمد محمد علي بمبلغ 500,000 ريال سعودي، مؤرخ في 15/06/2023',
      createdAt: now,
    },
    {
      caseId: case2 as number,
      caseTitle: 'دعوى خلع وطلاق',
      clientId: 3,
      clientName: 'فاطمة حسن',
      title: 'وكالة محاماة',
      docType: 'وكالة',
      content: 'وكالة من فاطمة حسن للمحامي بموجب الصك رقم 4567 صادر من كتابة عدل الدمام',
      createdAt: now,
    },
  ]);
}
