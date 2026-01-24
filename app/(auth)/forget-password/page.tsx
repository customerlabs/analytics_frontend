import { Suspense } from "react";
import { ForgotPasswordForm } from "../../../components/auth/form/forgot-password-form";
import { AuthCard } from "@/components/auth/auth-card";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordSkeleton />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordSkeleton() {
  return (
    <AuthCard
      title="Forgot password?"
      subtitle="No worries, we'll send you reset instructions."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
      </div>
    </AuthCard>
  );
}
