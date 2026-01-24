import { Suspense } from "react";
import { LoginForm } from "../../../components/auth/form/login-form";
import { AuthCard } from "@/components/auth/auth-card";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <AuthCard title="Welcome back" subtitle="Please enter your details">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
      </div>
    </AuthCard>
  );
}
