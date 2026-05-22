'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { seedDatabase } from '@/lib/db';
import { AppShell } from '@/components/app-shell';
import { Dashboard } from '@/components/dashboard';
import { Clients } from '@/components/clients';
import { Cases } from '@/components/cases';
import { Sessions } from '@/components/sessions';
import { Finance } from '@/components/finance';
import { Documents } from '@/components/documents';

function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed, app still works
      });
    }
  }, []);
  return null;
}

function SeedData() {
  const [seeded, setSeeded] = React.useState(false);
  useEffect(() => {
    if (!seeded) {
      seedDatabase().then(() => setSeeded(true)).catch(() => setSeeded(true));
    }
  }, [seeded]);
  return null;
}

export default function Home() {
  const activeSection = useAppStore((s) => s.activeSection);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <Clients />;
      case 'cases':
        return <Cases />;
      case 'sessions':
        return <Sessions />;
      case 'finance':
        return <Finance />;
      case 'documents':
        return <Documents />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <RegisterSW />
      <SeedData />
      <AppShell>{renderSection()}</AppShell>
    </>
  );
}
