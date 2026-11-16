import { SplashScreen } from "@/components/splash-screen";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-[#09090b] text-zinc-900 dark:text-white transition-colors duration-200">
      <SplashScreen isLoading={true} />
    </div>
  );
}
