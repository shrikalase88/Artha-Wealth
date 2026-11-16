import { DashboardNav } from "@/components/dashboard-nav";
import { TopBar } from "@/components/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground relative overflow-x-clip font-sans antialiased transition-colors duration-200">
      {/* Top subtle ambient light */}
      <div 
        className="absolute top-0 left-0 right-0 h-96 pointer-events-none opacity-40 dark:opacity-50"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12), transparent)"
        }}
      />
      
      {/* Desktop Persistent Left Nav & Mobile Header / Drawer */}
      <DashboardNav />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopBar />
        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
