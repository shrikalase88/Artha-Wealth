import { SplashScreen } from "@/components/splash-screen";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#09090b] text-white">
      <SplashScreen isLoading={true} />
    </div>
  );
}
