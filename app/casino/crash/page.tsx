import { CrashGamePage } from "@/components/casino/crash/CrashGamePage";
import { AuthGuard } from "@/components/layout/AuthGuard";

export default function CrashPage() {
  return (
    <AuthGuard>
      <CrashGamePage />
    </AuthGuard>
  );
}
