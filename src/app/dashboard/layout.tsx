import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
