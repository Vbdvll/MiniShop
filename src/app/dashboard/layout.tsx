import { MobileDashboardNav } from "@/components/mobile-dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pb-24 lg:pb-0">{children}</div>
      <MobileDashboardNav />
    </>
  );
}
