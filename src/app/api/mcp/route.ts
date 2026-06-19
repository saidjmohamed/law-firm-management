import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { toDateOrNull } from '@/lib/date-utils';
import { formatDate } from '@/lib/constants';

// ============================================================================
// MCP Server - Model Context Protocol (StreamableHTTP)
// قراءة + كتابة آمنة - يحتاج API Key للمصادقة
// ============================================================================

// مفتاح API يجب تعريفه في متغيرات البيئة (لا قيمة افتراضية لأسباب أمنية)
const API_KEY = process.env.MCP_API_KEY;

// ============================================================================
// تعريف الأدوات - أوصاف قصيرة للنافذة السياقية الصغيرة
// ============================================================================

const TOOLS = [
  // ── قراءة ──
  {
    name: 'search_cases',
    description: 'Search cases by number, subject, client, or court. Returns top 10.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Search term' },
        status: { type: 'string' as const, description: 'Filter: جارية, مؤرشفة, مفصول فيها, للجدولة' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_case',
    description: 'Get full case details by ID with parties, delays, payments.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'number' as const, description: 'Case ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_upcoming',
    description: 'Cases with upcoming dates in next 7 days.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_clients',
    description: 'Search clients by name or phone. Top 10.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Name or phone' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_client',
    description: 'Get client details with all their cases.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'number' as const, description: 'Client ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_court_phones',
    description: 'Get phone numbers for courts/judicial bodies.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Court name (partial)' },
      },
    },
  },
  {
    name: 'financial_summary',
    description: 'Financial summary: fees, paid, remaining, rate.',
    inputSchema: { type: 'object' as const, properties: {} },
  },
  {
    name: 'search_parties',
    description: 'Search parties (lawyers, opponents) by name across all cases.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Party or lawyer name' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_case_payments',
    description: 'Get payment history for a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
      },
      required: ['caseId'],
    },
  },
  {
    name: 'get_case_delays',
    description: 'Get all delays/adjournments for a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
      },
      required: ['caseId'],
    },
  },
  // ── إضافة (آمنة) ──
  {
    name: 'add_delay',
    description: 'Add adjournment/delay to a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        delayDate: { type: 'string' as const, description: 'Date YYYY-MM-DD' },
        reason: { type: 'string' as const, description: 'Reason for adjournment' },
      },
      required: ['caseId', 'delayDate'],
    },
  },
  {
    name: 'add_session',
    description: 'Add session to a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        date: { type: 'string' as const, description: 'Date YYYY-MM-DD' },
        time: { type: 'string' as const, description: 'Time HH:MM' },
      },
      required: ['caseId', 'date'],
    },
  },
  {
    name: 'add_payment',
    description: 'Record a payment for a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        amount: { type: 'number' as const, description: 'Payment amount' },
        note: { type: 'string' as const, description: 'Payment note' },
      },
      required: ['caseId', 'amount'],
    },
  },
  {
    name: 'add_client',
    description: 'Add a new client.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Client name' },
        phone: { type: 'string' as const, description: 'Phone number' },
        phone2: { type: 'string' as const, description: 'Second phone (optional)' },
        address: { type: 'string' as const, description: 'Address (optional)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_party',
    description: 'Add a party (opponent/lawyer) to a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        name: { type: 'string' as const, description: 'Party name' },
        side: { type: 'string' as const, description: 'for or against' },
        role: { type: 'string' as const, description: 'Role (optional)' },
        phone: { type: 'string' as const, description: 'Phone (optional)' },
        lawyerName: { type: 'string' as const, description: 'Lawyer name (optional)' },
        lawyerPhone: { type: 'string' as const, description: 'Lawyer phone (optional)' },
      },
      required: ['caseId', 'name', 'side'],
    },
  },
  {
    name: 'add_case',
    description: 'Create a new case with basic info.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseNumber: { type: 'string' as const, description: 'Case number' },
        subject: { type: 'string' as const, description: 'Case subject' },
        clientId: { type: 'number' as const, description: 'Client ID' },
        courtName: { type: 'string' as const, description: 'Court name (optional)' },
        caseNature: { type: 'string' as const, description: 'Case nature (optional)' },
        totalFees: { type: 'number' as const, description: 'Total fees amount (optional)' },
      },
      required: ['caseNumber', 'subject'],
    },
  },
  // ── تحديث آمن ──
  {
    name: 'update_case_status',
    description: 'Update case status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        status: { type: 'string' as const, description: 'New status: جارية, مؤرشفة, مفصول فيها, للجدولة' },
      },
      required: ['caseId', 'status'],
    },
  },
  {
    name: 'update_delib_date',
    description: 'Update deliberation date for a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        delibDate: { type: 'string' as const, description: 'New date YYYY-MM-DD' },
      },
      required: ['caseId', 'delibDate'],
    },
  },
  {
    name: 'update_bar_phone',
    description: 'Update bar chamber phone for a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        barPhone: { type: 'string' as const, description: 'Phone number' },
      },
      required: ['caseId', 'barPhone'],
    },
  },
  {
    name: 'update_case_result',
    description: 'Set case result (won/lost).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        result: { type: 'string' as const, description: 'won or lost' },
        judgment: { type: 'string' as const, description: 'Judgment text (optional)' },
      },
      required: ['caseId', 'result'],
    },
  },
  {
    name: 'update_client_phone',
    description: 'Update client phone number.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        clientId: { type: 'number' as const, description: 'Client ID' },
        phone: { type: 'string' as const, description: 'New phone number' },
      },
      required: ['clientId', 'phone'],
    },
  },
  {
    name: 'add_note',
    description: 'Add or update notes on a case.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        caseId: { type: 'number' as const, description: 'Case ID' },
        notes: { type: 'string' as const, description: 'Note text' },
      },
      required: ['caseId', 'notes'],
    },
  },
];

// ============================================================================
// معالجة الأدوات
// ============================================================================

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    // ── قراءة ──
    case 'search_cases': return await searchCases(args.query as string, args.status as string | undefined);
    case 'get_case': return await getCase(args.id as number);
    case 'get_upcoming': return await getUpcoming();
    case 'search_clients': return await searchClients(args.query as string);
    case 'get_client': return await getClient(args.id as number);
    case 'get_court_phones': return await getCourtPhones(args.name as string | undefined);
    case 'financial_summary': return await financialSummary();
    case 'search_parties': return await searchParties(args.query as string);
    case 'get_case_payments': return await getCasePayments(args.caseId as number);
    case 'get_case_delays': return await getCaseDelays(args.caseId as number);
    // ── إضافة ──
    case 'add_delay': return await addDelay(args.caseId as number, args.delayDate as string, args.reason as string | undefined);
    case 'add_session': return await addSession(args.caseId as number, args.date as string, args.time as string | undefined);
    case 'add_payment': return await addPayment(args.caseId as number, args.amount as number, args.note as string | undefined);
    case 'add_client': return await addClient(args.name as string, args.phone as string | undefined, args.phone2 as string | undefined, args.address as string | undefined);
    case 'add_party': return await addParty(args.caseId as number, args.name as string, args.side as string, args.role as string | undefined, args.phone as string | undefined, args.lawyerName as string | undefined, args.lawyerPhone as string | undefined);
    case 'add_case': return await addCase(args as Record<string, unknown>);
    // ── تحديث ──
    case 'update_case_status': return await updateCaseStatus(args.caseId as number, args.status as string);
    case 'update_delib_date': return await updateDelibDate(args.caseId as number, args.delibDate as string);
    case 'update_bar_phone': return await updateBarPhone(args.caseId as number, args.barPhone as string);
    case 'update_case_result': return await updateCaseResult(args.caseId as number, args.result as string, args.judgment as string | undefined);
    case 'update_client_phone': return await updateClientPhone(args.clientId as number, args.phone as string);
    case 'add_note': return await addNote(args.caseId as number, args.notes as string);
    default: return `Unknown tool: ${name}`;
  }
}

// ============================================================================
// أدوات القراءة
// ============================================================================

async function searchCases(query: string, status?: string): Promise<string> {
  const q = query.trim();
  if (!q) return 'Please provide a search term.';
  const where: any = {
    OR: [
      { caseNumber: { contains: q, mode: 'insensitive' } },
      { subject: { contains: q, mode: 'insensitive' } },
      { courtName: { contains: q, mode: 'insensitive' } },
      { councilName: { contains: q, mode: 'insensitive' } },
      { client: { name: { contains: q, mode: 'insensitive' } } },
      { notes: { contains: q, mode: 'insensitive' } },
    ],
  };
  if (status) where.status = status;
  const cases = await prisma.case.findMany({ where, include: { client: true }, take: 10, orderBy: { updatedAt: 'desc' } });
  if (cases.length === 0) return 'No cases found.';
  return cases.map((c: any) => `ID:${c.id} | ${c.caseNumber} | ${c.subject} | ${c.status} | ${c.courtName||'-'} | Client: ${c.client?.name||'-'} | Fees: ${c.totalFees||0} | Paid: ${c.paidAmount||0}`).join('\n');
}

async function getCase(id: number): Promise<string> {
  const c = await prisma.case.findUnique({
    where: { id },
    include: { client: true, parties: true, delays: { orderBy: { delayDate: 'desc' } }, sessions: { orderBy: { date: 'desc' } }, payments: { orderBy: { createdAt: 'desc' } } },
  });
  if (!c) return `Case ID ${id} not found.`;
  const l: string[] = [
    `=== Case ${c.caseNumber} (ID:${c.id}) ===`,
    `Subject: ${c.subject}`,
    `Nature: ${c.caseNature||'-'} | Stage: ${c.litigationStage||'-'} | Status: ${c.status}`,
    `Client: ${c.client?.name||'-'} | Phone: ${c.client?.phone||'-'}`,
    `Court: ${c.courtName||'-'} | Council: ${c.councilName||'-'} | Chamber: ${c.chamber||'-'}`,
    `Bar Phone: ${c.barPhone||'-'}`,
    `Registration: ${formatDate(c.registrationDate as any)} | First Session: ${formatDate(c.firstSessionDate as any)} | Deliberation: ${formatDate(c.delibDate as any)}`,
    `Fees: ${c.totalFees||0} | Paid: ${c.paidAmount||0} | Remaining: ${(c.totalFees||0)-(c.paidAmount||0)}`,
  ];
  if (c.lawyer) l.push(`Lawyer: ${c.lawyer}`);
  if (c.judgment) l.push(`Judgment: ${c.judgment}`);
  if (c.caseResult) l.push(`Result: ${c.caseResult==='won'?'Won':'Lost'}`);
  if (c.notes) l.push(`Notes: ${c.notes}`);
  if (c.parties.length>0) { l.push('--- Parties ---'); c.parties.forEach((p:any)=>l.push(`  ${p.side==='for'?'For':'Against'} | ${p.role||'-'}: ${p.name||'-'} | Ph: ${p.phone||'-'} | Lawyer: ${p.lawyerName||'-'}`)); }
  if (c.delays.length>0) { l.push('--- Delays (last 5) ---'); c.delays.slice(0,5).forEach((d:any)=>l.push(`  ${formatDate(d.delayDate as any)} | ${d.reason||'-'}`)); }
  if (c.sessions.length>0) { l.push('--- Sessions (last 5) ---'); c.sessions.slice(0,5).forEach((s:any)=>l.push(`  ${formatDate(s.date as any)} | ${s.time||'-'} | ${s.status||'-'}`)); }
  if (c.payments.length>0) { l.push('--- Payments (last 5) ---'); c.payments.slice(0,5).forEach((p:any)=>l.push(`  ${p.amount||0} | ${p.note||'-'} | ${p.createdAt?new Date(p.createdAt).toLocaleDateString():'-'}`)); }
  return l.join('\n');
}

async function getUpcoming(): Promise<string> {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const nextWeek = new Date(now.getTime()+7*24*60*60*1000); nextWeek.setHours(23,59,59,999);
  const cases = await prisma.case.findMany({ where: { status: { not: 'مؤرشفة' } }, include: { client: true, delays: true, sessions: true } });
  const result: string[] = [];
  for (const c of cases) {
    const allDates: {date:Date;label:string}[] = [];
    c.delays.forEach((d:any)=>{ if(d.delayDate){ allDates.push({date:new Date(d.delayDate),label:`Delay: ${d.reason||''}`}); }});
    c.sessions.forEach((s:any)=>{ if(s.date){ allDates.push({date:new Date(s.date),label:'Session'}); }});
    if(c.delibDate){ allDates.push({date:new Date(c.delibDate),label:'Deliberation'}); }
    if(allDates.length===0) continue;
    const latest = allDates.sort((a,b)=>b.date.getTime()-a.date.getTime())[0];
    if(latest.date>=todayStart && latest.date<=nextWeek){
      const days=Math.round((latest.date.getTime()-now.getTime())/(1000*60*60*24));
      const dateStr = latest.date.toISOString().slice(0,10);
      result.push(`${c.caseNumber} | ${c.subject} | ${dateStr} (${latest.label}) | ${days===0?'TODAY':days===1?'TOMORROW':`In ${days} days`} | ${c.courtName||'-'} | Client: ${c.client?.name||'-'}`);
    }
  }
  if(result.length===0) return 'No upcoming cases in 7 days.';
  return `Upcoming (${result.length}):\n`+result.join('\n');
}

async function searchClients(query: string): Promise<string> {
  const q = query.trim();
  if(!q) return 'Provide a search term.';
  const clients = await prisma.client.findMany({
    where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { phone2: { contains: q } }] },
    include: { cases: { select: { id:true, caseNumber:true, status:true, subject:true } } },
    take: 10,
  });
  if(clients.length===0) return 'No clients found.';
  return clients.map((cl:any)=>`ID:${cl.id} | ${cl.name} | Ph: ${cl.phone}${cl.phone2?` / ${cl.phone2}`:''} | Cases: ${cl.cases.length}`).join('\n');
}

async function getClient(id: number): Promise<string> {
  const cl = await prisma.client.findUnique({
    where: { id },
    include: { cases: { orderBy: { updatedAt: 'desc' } } },
  });
  if(!cl) return `Client ID ${id} not found.`;
  const l: string[] = [
    `=== Client: ${cl.name} (ID:${cl.id}) ===`,
    `Phone: ${cl.phone}${cl.phone2?` / ${cl.phone2}`:''}`,
    `Address: ${cl.address||'-'}`,
    `Cases: ${cl.cases.length}`,
  ];
  if(cl.cases.length>0){
    cl.cases.forEach((c:any)=>{
      const rem = (c.totalFees||0)-(c.paidAmount||0);
      l.push(`  ID:${c.id} | ${c.caseNumber} | ${c.subject} | ${c.status} | ${c.courtName||'-'} | Remaining: ${rem}`);
    });
  }
  return l.join('\n');
}

async function getCourtPhones(name?: string): Promise<string> {
  const where: any = {};
  if(name) where.name = { contains: name, mode: 'insensitive' };
  const bodies = await prisma.judicialBody.findMany({ where, take: 20, orderBy: { name: 'asc' } });
  const withPhones = bodies.filter((b:any)=>{ if(!b.phones) return false; try{ const p=JSON.parse(b.phones); return Array.isArray(p)&&p.length>0; }catch{return false;} });
  if(withPhones.length===0) return 'No courts with phones found.';
  return withPhones.map((b:any)=>{ const phones=JSON.parse(b.phones).filter((x:string)=>x.trim()); return `${b.name} (${b.type}): ${phones.join(' / ')}`; }).join('\n');
}

async function financialSummary(): Promise<string> {
  const cases = await prisma.case.findMany({ select: { totalFees:true, paidAmount:true, status:true } });
  const totalFees=cases.reduce((s:number,c:any)=>s+(c.totalFees||0),0);
  const totalPaid=cases.reduce((s:number,c:any)=>s+(c.paidAmount||0),0);
  const remaining=totalFees-totalPaid;
  const rate=totalFees>0?Math.round((totalPaid/totalFees)*100):0;
  const byStatus: Record<string,{count:number;fees:number;paid:number}>={};
  cases.forEach((c:any)=>{ const st=c.status||'?'; if(!byStatus[st])byStatus[st]={count:0,fees:0,paid:0}; byStatus[st].count++; byStatus[st].fees+=c.totalFees||0; byStatus[st].paid+=c.paidAmount||0; });
  const l: string[] = [
    `Cases: ${cases.length}`,
    `Fees: ${totalFees.toLocaleString()} | Paid: ${totalPaid.toLocaleString()} | Remaining: ${remaining.toLocaleString()} | Rate: ${rate}%`,
    'By Status:',
  ];
  Object.entries(byStatus).forEach(([st,d])=>l.push(`  ${st}: ${d.count} | Fees: ${d.fees.toLocaleString()} | Paid: ${d.paid.toLocaleString()}`));
  return l.join('\n');
}

async function searchParties(query: string): Promise<string> {
  const q = query.trim();
  if(!q) return 'Provide a search term.';
  const parties = await prisma.party.findMany({
    where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { lawyerName: { contains: q, mode: 'insensitive' } }] },
    include: { case: { select: { id:true, caseNumber:true, subject:true } } },
    take: 15,
  });
  if(parties.length===0) return 'No parties found.';
  return parties.map((p:any)=>`ID:${p.id} | ${p.name||'-'} | Side: ${p.side==='for'?'For':'Against'} | Role: ${p.role||'-'} | Ph: ${p.phone||'-'} | Lawyer: ${p.lawyerName||'-'} | Case: ${p.case?.caseNumber||'-'}`).join('\n');
}

async function getCasePayments(caseId: number): Promise<string> {
  const payments = await prisma.payment.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } });
  if(payments.length===0) return 'No payments found for this case.';
  const total = payments.reduce((s:number,p:any)=>s+(p.amount||0),0);
  const l = [`Payments for Case ID:${caseId} (Total: ${total.toLocaleString()}):`];
  payments.forEach((p:any)=>l.push(`  ${p.amount?.toLocaleString()||0} | ${p.note||'-'} | ${p.createdAt?new Date(p.createdAt).toLocaleDateString():'-'}`));
  return l.join('\n');
}

async function getCaseDelays(caseId: number): Promise<string> {
  const delays = await prisma.delay.findMany({ where: { caseId }, orderBy: { delayDate: 'desc' } });
  if(delays.length===0) return 'No delays found for this case.';
  const l = [`Delays for Case ID:${caseId}:`];
  delays.forEach((d:any)=>l.push(`  ${d.delayDate||'-'} | Reason: ${d.reason||'-'}`));
  return l.join('\n');
}

// ============================================================================
// أدوات الإضافة (آمنة)
// ============================================================================

async function addDelay(caseId: number, delayDate: string, reason?: string): Promise<string> {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  const d = await prisma.delay.create({ data: { caseId, delayDate: toDateOrNull(delayDate), reason: reason||'' } });
  return `Delay added: Case ${c.caseNumber} → ${delayDate}${reason?` (${reason})`:''} | Delay ID:${d.id}`;
}

async function addSession(caseId: number, date: string, time?: string): Promise<string> {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  const s = await prisma.session.create({ data: { caseId, date: toDateOrNull(date), time: time||'' } });
  return `Session added: Case ${c.caseNumber} → ${date}${time?` at ${time}`:''} | Session ID:${s.id}`;
}

async function addPayment(caseId: number, amount: number, note?: string): Promise<string> {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  if(amount<=0) return 'Amount must be positive.';
  const p = await prisma.payment.create({ data: { caseId, amount, notes: note||'' } });
  // تحديث المبلغ المدفوع في القضية
  const newPaid = (c.paidAmount||0) + amount;
  await prisma.case.update({ where: { id: caseId }, data: { paidAmount: newPaid } });
  const remaining = (c.totalFees||0) - newPaid;
  return `Payment recorded: ${amount.toLocaleString()} for Case ${c.caseNumber} | Total paid: ${newPaid.toLocaleString()} | Remaining: ${remaining.toLocaleString()} | Payment ID:${p.id}`;
}

async function addClient(name: string, phone?: string, phone2?: string, address?: string): Promise<string> {
  const cl = await prisma.client.create({ data: { name, phone: phone||'', phone2: phone2||'', address: address||'' } });
  return `Client added: ${name} (ID:${cl.id})${phone?` | Phone: ${phone}`:''}`;
}

async function addParty(caseId: number, name: string, side: string, role?: string, phone?: string, lawyerName?: string, lawyerPhone?: string): Promise<string> {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  if(!['for','against'].includes(side)) return 'Side must be "for" or "against".';
  const p = await prisma.party.create({ data: { caseId, name, side, role: role||'', phone: phone||'', lawyerName: lawyerName||'', lawyerPhone: lawyerPhone||'' } });
  return `Party added: ${name} (${side==='for'?'For':'Against'}) to Case ${c.caseNumber} | Party ID:${p.id}`;
}

async function addCase(args: Record<string, unknown>): Promise<string> {
  const caseNumber = args.caseNumber as string;
  const subject = args.subject as string;
  if(!caseNumber||!subject) return 'Case number and subject are required.';
  const data: any = { caseNumber, subject, status: 'جارية' };
  if(args.clientId) data.clientId = args.clientId as number;
  if(args.courtName) data.courtName = args.courtName as string;
  if(args.caseNature) data.caseNature = args.caseNature as string;
  if(args.totalFees) data.totalFees = args.totalFees as number;
  const c = await prisma.case.create({ data });
  return `Case created: ${caseNumber} - ${subject} (ID:${c.id})`;
}

// ============================================================================
// أدوات التحديث (آمنة)
// ============================================================================

const VALID_STATUSES = ['جارية', 'مؤرشفة', 'مفصول فيها', 'للجدولة'];

async function updateCaseStatus(caseId: number, status: string): Promise<string> {
  if(!VALID_STATUSES.includes(status)) return `Invalid status. Use: ${VALID_STATUSES.join(', ')}`;
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  await prisma.case.update({ where: { id: caseId }, data: { status } });
  return `Status updated: Case ${c.caseNumber} → ${status}`;
}

async function updateDelibDate(caseId: number, delibDate: string): Promise<string> {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  await prisma.case.update({ where: { id: caseId }, data: { delibDate: toDateOrNull(delibDate) } });
  return `Deliberation date updated: Case ${c.caseNumber} → ${delibDate}`;
}

async function updateBarPhone(caseId: number, barPhone: string): Promise<string> {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  await prisma.case.update({ where: { id: caseId }, data: { barPhone } });
  return `Bar phone updated: Case ${c.caseNumber} → ${barPhone}`;
}

async function updateCaseResult(caseId: number, result: string, judgment?: string): Promise<string> {
  if(!['won','lost'].includes(result)) return 'Result must be "won" or "lost".';
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  const data: any = { caseResult: result };
  if(judgment) data.judgment = judgment;
  if(result==='won'||result==='lost') data.status = 'مفصول فيها';
  await prisma.case.update({ where: { id: caseId }, data });
  return `Result updated: Case ${c.caseNumber} → ${result==='won'?'Won':'Lost'}${judgment?` | Judgment: ${judgment}`:''}`;
}

async function updateClientPhone(clientId: number, phone: string): Promise<string> {
  const cl = await prisma.client.findUnique({ where: { id: clientId } });
  if(!cl) return `Client ID ${clientId} not found.`;
  await prisma.client.update({ where: { id: clientId }, data: { phone } });
  return `Phone updated: ${cl.name} → ${phone}`;
}

async function addNote(caseId: number, notes: string): Promise<string> {
  const c = await prisma.case.findUnique({ where: { id: caseId } });
  if(!c) return `Case ID ${caseId} not found.`;
  const existing = c.notes||'';
  const updated = existing ? `${existing}\n${notes}` : notes;
  await prisma.case.update({ where: { id: caseId }, data: { notes: updated } });
  return `Note added to Case ${c.caseNumber}`;
}

// ============================================================================
// معالج MCP StreamableHTTP
// ============================================================================

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-api-key');
  // رفض الطلب إذا لم يُعرف MCP_API_KEY أو إذا لم يتطابق المفتاح
  if (!API_KEY || authHeader !== API_KEY) {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((req: any) => handleRequest(req)));
    const filtered = results.filter((r: any) => r !== null);
    return new Response(JSON.stringify(filtered), { headers: { 'Content-Type': 'application/json' } });
  }

  const response = await handleRequest(body);
  if (response === null) return new Response(null, { status: 202 });

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (response._mcp_session_id) {
    headers['Mcp-Session-Id'] = response._mcp_session_id;
    delete response._mcp_session_id;
  }

  return new Response(JSON.stringify(response), { headers });
}

async function handleRequest(body: any): Promise<any> {
  const { jsonrpc, id, method, params } = body;
  if (jsonrpc !== '2.0') return { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: id||null };
  if (id === undefined && method) return null;

  switch (method) {
    case 'initialize': {
      const sessionId = `mcp-${Date.now()}-${Math.random().toString(36).substring(2,8)}`;
      return {
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'law-firm-mcp', version: '2.0.0' },
        },
        _mcp_session_id: sessionId,
      };
    }
    case 'notifications/initialized':
    case 'notifications/cancelled': return null;
    case 'ping': return { jsonrpc: '2.0', id, result: {} };
    case 'tools/list': return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      if (!toolName) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing tool name' } };
      try {
        const result = await handleToolCall(toolName, toolArgs);
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: result }] } };
      } catch (error: any) {
        return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Error: ${error.message||'Unknown'}` }], isError: true } };
      }
    }
    default: return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    name: 'law-firm-mcp',
    version: '2.0.0',
    protocolVersion: '2024-11-05',
    description: 'MCP Server for Law Firm Management',
    tools: TOOLS.map(t => t.name),
    auth: 'Required: X-API-Key header',
  }), { headers: { 'Content-Type': 'application/json' } });
}
