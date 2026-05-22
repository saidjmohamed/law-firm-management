'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { seedDatabase } from '@/lib/db';
import { AppShell } from '@/components/app-shell';
import { Dashboard } from '@/components/dashboard';
import { Clients } from '@/components/clients';
import { Cases } from '@/components/cases';
import { Sessions } from '@/components/sessions';
import { PaymentsManager } from '@/components/payments';
import { DelaysManager } from '@/components/delays';
import { ArchivesManager } from '@/components/archives';
import { BackupManager } from '@/components/backup';
import { SettingsManager } from '@/components/settings';

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
      seedDatabase()
        .then(() => {
          console.log('[App] Database seeded successfully');
          setSeeded(true);
        })
        .catch((err) => {
          console.error('[App] Seed failed, will retry:', err);
          // محاولة إعادة البذرة بعد ثانيتين
          setTimeout(() => {
            seedDatabase()
              .then(() => setSeeded(true))
              .catch(() => setSeeded(true));
          }, 2000);
        });
    }
  }, [seeded]);
  return null;
}

export default function Home() {
  const activeSection = useAppStore((s) => s.activeSection);

  const sections: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    clients: <Clients />,
    cases: <Cases />,
    sessions: <Sessions />,
    payments: <PaymentsManager />,
    delays: <DelaysManager />,
    archives: <ArchivesManager />,
    backup: <BackupManager />,
    settings: <SettingsManager />,
  };

  return (
    <>
      <RegisterSW />
      <SeedData />
      <AppShell>{sections[activeSection] ?? <Dashboard />}</AppShell>
    </>
  );
}
