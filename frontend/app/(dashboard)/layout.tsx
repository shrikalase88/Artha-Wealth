import { DashboardNav } from "@/components/dashboard-nav";
import { TopBar } from "@/components/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#09090b] text-zinc-50 relative overflow-x-clip font-sans antialiased">
      {/* Subtle, restrained ambient lighting - Apple / Google HIG style */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08)_0%,transparent_70%)] filter blur-[60px]" />
      </div>

      <DashboardNav />
      <div className="flex-grow min-w-0 flex flex-col relative z-10">
        <TopBar />
        <main className="flex-1 pb-24 lg:pb-8 page-transition">
          {children}
        </main>
      </div>
    </div>
  );
}
