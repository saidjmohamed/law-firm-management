import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ============================================================================
// MCP Server - Model Context Protocol (StreamableHTTP)
// قراءة فقط - يحتاج API Key للمصادقة
// ============================================================================

const API_KEY = process.env.MCP_API_KEY || 'lawfirm-mcp-2026-secure';

// أداة تعريف الأدوات - أوصاف قصيرة للنافذة السياقية الصغيرة
const TOOLS = [
  {
    name: 'search_cases',
    description: 'Search cases by number, subject, client, or court. Returns top 10 matches.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Search term (case number, subject, client name, court)' },
        status: { type: 'string' as const, description: 'Filter by status: جارية, مؤرشفة, مفصول فيها, للجدولة' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_case',
    description: 'Get full details of a case by its ID including parties, delays, and payments.',
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
    description: 'Get cases with upcoming dates (delays, sessions, deliberations) in the next 7 days.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'search_clients',
    description: 'Search clients by name or phone. Returns top 10 matches.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string' as const, description: 'Search term (name or phone)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_court_phones',
    description: 'Get phone numbers for courts and judicial bodies by name or wilaya.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Court name (partial match)' },
      },
    },
  },
  {
    name: 'financial_summary',
    description: 'Get financial summary: total fees, paid, remaining, collection rate.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ============================================================================
// معالجة الأدوات
// ============================================================================

async function handleToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'search_cases':
      return await searchCases(args.query as string, args.status as string | undefined);
    case 'get_case':
      return await getCase(args.id as number);
    case 'get_upcoming':
      return await getUpcoming();
    case 'search_clients':
      return await searchClients(args.query as string);
    case 'get_court_phones':
      return await getCourtPhones(args.name as string | undefined);
    case 'financial_summary':
      return await financialSummary();
    default:
      return `Unknown tool: ${name}`;
  }
}

// البحث في القضايا
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

  const cases = await prisma.case.findMany({
    where,
    include: { client: true },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  });

  if (cases.length === 0) return 'No cases found matching your search.';

  return cases.map((c: any) => {
    const paid = c.paidAmount || 0;
    const total = c.totalFees || 0;
    const remaining = total - paid;
    return `ID:${c.id} | ${c.caseNumber} | ${c.subject} | ${c.status} | ${c.courtName || '-'} | Client: ${c.client?.name || '-'} | Fees: ${total} | Paid: ${paid} | Remaining: ${remaining}`;
  }).join('\n');
}

// تفاصيل قضية
async function getCase(id: number): Promise<string> {
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      client: true,
      parties: true,
      delays: { orderBy: { delayDate: 'desc' } },
      sessions: { orderBy: { date: 'desc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!c) return `Case with ID ${id} not found.`;

  const lines: string[] = [];
  lines.push(`=== Case ${c.caseNumber} (ID: ${c.id}) ===`);
  lines.push(`Subject: ${c.subject}`);
  lines.push(`Nature: ${c.caseNature || '-'} | Stage: ${c.litigationStage || '-'}`);
  lines.push(`Status: ${c.status}`);
  lines.push(`Client: ${c.client?.name || '-'} | Phone: ${c.client?.phone || '-'}`);
  lines.push(`Court: ${c.courtName || '-'} | Council: ${c.councilName || '-'}`);
  lines.push(`Chamber: ${c.chamber || '-'} | Bar Phone: ${c.barPhone || '-'}`);
  lines.push(`Registration: ${c.registrationDate || '-'} | First Session: ${c.firstSessionDate || '-'} | Deliberation: ${c.delibDate || '-'}`);
  lines.push(`Total Fees: ${c.totalFees || 0} | Paid: ${c.paidAmount || 0} | Remaining: ${(c.totalFees || 0) - (c.paidAmount || 0)}`);
  if (c.lawyer) lines.push(`Lawyer: ${c.lawyer}`);
  if (c.judgment) lines.push(`Judgment: ${c.judgment}`);
  if (c.caseResult) lines.push(`Result: ${c.caseResult === 'won' ? 'Won' : 'Lost'}`);
  if (c.notes) lines.push(`Notes: ${c.notes}`);

  if (c.parties.length > 0) {
    lines.push(`--- Parties ---`);
    c.parties.forEach((p: any) => {
      lines.push(`  ${p.side === 'for' ? 'For' : 'Against'} | ${p.role || '-'}: ${p.name || '-'} | Phone: ${p.phone || '-'} | Lawyer: ${p.lawyerName || '-'}`);
    });
  }

  if (c.delays.length > 0) {
    lines.push(`--- Delays (last 5) ---`);
    c.delays.slice(0, 5).forEach((d: any) => {
      lines.push(`  ${d.delayDate || '-'} | Reason: ${d.reason || '-'}`);
    });
  }

  if (c.sessions.length > 0) {
    lines.push(`--- Sessions (last 5) ---`);
    c.sessions.slice(0, 5).forEach((s: any) => {
      lines.push(`  ${s.date || '-'} | Time: ${s.time || '-'} | Status: ${s.status || '-'}`);
    });
  }

  return lines.join('\n');
}

// القضايا القادمة في 7 أيام
async function getUpcoming(): Promise<string> {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

  const cases = await prisma.case.findMany({
    where: { status: { not: 'مؤرشفة' } },
    include: { client: true, delays: true, sessions: true },
  });

  const result: string[] = [];

  for (const c of cases) {
    const allDates: { date: string; label: string }[] = [];

    c.delays.forEach((d: any) => {
      if (d.delayDate) {
        const dateStr = d.delayDate.length > 10 ? d.delayDate.substring(0, 10) : d.delayDate;
        allDates.push({ date: dateStr, label: `Delay: ${d.reason || 'Adjournment'}` });
      }
    });

    c.sessions.forEach((s: any) => {
      if (s.date) {
        const dateStr = s.date.length > 10 ? s.date.substring(0, 10) : s.date;
        allDates.push({ date: dateStr, label: 'Session' });
      }
    });

    if (c.delibDate) {
      const dateStr = c.delibDate.length > 10 ? c.delibDate.substring(0, 10) : c.delibDate;
      allDates.push({ date: dateStr, label: 'Deliberation' });
    }

    if (allDates.length === 0) continue;

    const latest = allDates.sort((a, b) => b.date.localeCompare(a.date))[0];

    if (latest.date >= todayStr && latest.date <= nextWeekStr) {
      const daysDiff = Math.round((new Date(latest.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      result.push(`${c.caseNumber} | ${c.subject} | ${latest.date} (${latest.label}) | ${daysDiff === 0 ? 'TODAY' : daysDiff === 1 ? 'TOMORROW' : `In ${daysDiff} days`} | Court: ${c.courtName || '-'} | Client: ${c.client?.name || '-'}`);
    }
  }

  if (result.length === 0) return 'No upcoming cases in the next 7 days.';
  return `Upcoming cases (${result.length}):\n` + result.join('\n');
}

// البحث في الموكلين
async function searchClients(query: string): Promise<string> {
  const q = query.trim();
  if (!q) return 'Please provide a search term.';

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { phone2: { contains: q } },
      ],
    },
    include: { cases: { select: { id: true, caseNumber: true, status: true, subject: true } } },
    take: 10,
  });

  if (clients.length === 0) return 'No clients found.';

  return clients.map((cl: any) => {
    const caseCount = cl.cases.length;
    return `ID:${cl.id} | ${cl.name} | Phone: ${cl.phone}${cl.phone2 ? ` / ${cl.phone2}` : ''} | Cases: ${caseCount}`;
  }).join('\n');
}

// أرقام هواتف المحاكم
async function getCourtPhones(name?: string): Promise<string> {
  const where: any = {};
  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }

  const bodies = await prisma.judicialBody.findMany({
    where,
    take: 20,
    orderBy: { name: 'asc' },
  });

  const withPhones = bodies.filter((b: any) => {
    if (!b.phones) return false;
    try {
      const p = JSON.parse(b.phones);
      return Array.isArray(p) && p.length > 0;
    } catch { return false; }
  });

  if (withPhones.length === 0) return 'No courts with phone numbers found.';

  return withPhones.map((b: any) => {
    const phones = JSON.parse(b.phones).filter((x: string) => x.trim());
    return `${b.name} (${b.type}): ${phones.join(' / ')}`;
  }).join('\n');
}

// الملخص المالي
async function financialSummary(): Promise<string> {
  const cases = await prisma.case.findMany({
    select: { totalFees: true, paidAmount: true, status: true },
  });

  const totalFees = cases.reduce((s: number, c: any) => s + (c.totalFees || 0), 0);
  const totalPaid = cases.reduce((s: number, c: any) => s + (c.paidAmount || 0), 0);
  const remaining = totalFees - totalPaid;
  const rate = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0;

  const byStatus: Record<string, { count: number; fees: number; paid: number }> = {};
  cases.forEach((c: any) => {
    const st = c.status || 'Unknown';
    if (!byStatus[st]) byStatus[st] = { count: 0, fees: 0, paid: 0 };
    byStatus[st].count++;
    byStatus[st].fees += c.totalFees || 0;
    byStatus[st].paid += c.paidAmount || 0;
  });

  const lines: string[] = [
    `Total Cases: ${cases.length}`,
    `Total Fees: ${totalFees.toLocaleString()} | Paid: ${totalPaid.toLocaleString()} | Remaining: ${remaining.toLocaleString()} | Rate: ${rate}%`,
    '',
    'By Status:',
  ];

  Object.entries(byStatus).forEach(([status, data]) => {
    lines.push(`  ${status}: ${data.count} cases | Fees: ${data.fees.toLocaleString()} | Paid: ${data.paid.toLocaleString()}`);
  });

  return lines.join('\n');
}

// ============================================================================
// معالج MCP StreamableHTTP
// ============================================================================

export async function POST(request: NextRequest) {
  // التحقق من API Key
  const authHeader = request.headers.get('x-api-key');
  if (authHeader !== API_KEY) {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized: invalid API key' }, id: null }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // التعامل مع طلبات متعددة (batch)
  if (Array.isArray(body)) {
    const results = await Promise.all(body.map((req: any) => handleRequest(req)));
    const filtered = results.filter((r: any) => r !== null);
    return new Response(JSON.stringify(filtered), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = await handleRequest(body);

  // الإشعارات لا ترجع رد
  if (response === null) {
    return new Response(null, { status: 202 });
  }

  // استخراج sessionId من initialize ووضعه في header
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (response._mcp_session_id) {
    headers['Mcp-Session-Id'] = response._mcp_session_id;
    delete response._mcp_session_id;
  }

  return new Response(JSON.stringify(response), { headers });
}

async function handleRequest(body: any): Promise<any> {
  const { jsonrpc, id, method, params } = body;

  // التأكد من إصدار JSON-RPC
  if (jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id: id || null };
  }

  // إشعارات (بدون id) - لا نرجع شيء
  if (id === undefined && method) {
    return null;
  }

  switch (method) {
    case 'initialize': {
      const sessionId = `mcp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'law-firm-mcp',
            version: '1.0.0',
          },
        },
        _mcp_session_id: sessionId,
      };
    }

    case 'notifications/initialized':
    case 'notifications/cancelled': {
      return null;
    }

    case 'ping': {
      return { jsonrpc: '2.0', id, result: {} };
    }

    case 'tools/list': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS,
        },
      };
    }

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      if (!toolName) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing tool name' },
        };
      }

      try {
        const result = await handleToolCall(toolName, toolArgs);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          },
        };
      } catch (error: any) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message || 'Unknown error'}`,
              },
            ],
            isError: true,
          },
        };
      }
    }

    default: {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    }
  }
}

// GET - معلومات المخدم (لاستكشاف الأخطاء)
export async function GET() {
  return new Response(JSON.stringify({
    name: 'law-firm-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    description: 'MCP Server for Law Firm Management - Read Only',
    tools: TOOLS.map(t => t.name),
    auth: 'Required: X-API-Key header',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
