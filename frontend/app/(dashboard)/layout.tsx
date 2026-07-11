import { DashboardNav } from "@/components/dashboard-nav";
import { TopBar } from "@/components/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#070a13] text-slate-100 relative overflow-hidden">
      {/* Background Liquid Glass Ambient Glows */}
      <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25)_0%,rgba(6,182,212,0.08)_40%,transparent_70%)] pointer-events-none filter blur-[80px] animate-glow-1" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22)_0%,rgba(20,184,166,0.08)_45%,transparent_70%)] pointer-events-none filter blur-[80px] animate-glow-2" />
      <div className="absolute top-[35%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.20)_0%,rgba(168,85,247,0.06)_50%,transparent_70%)] pointer-events-none filter blur-[80px] animate-glow-3" />

      <DashboardNav />
      <div className="flex-grow min-w-0 flex flex-col relative z-10">
        <TopBar />
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
