"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFooter } from "@/components/auth/auth-footer";
import { SocialButton } from "@/components/auth/social-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loginAction, initiateKeycloakLogin } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorFromUrl = searchParams.get("error");
  const messageFromUrl = searchParams.get("message");

  const [state, formAction, isPending] = useActionState(loginAction, null);

  // Handle redirect after successful login
  useEffect(() => {
    if (state?.redirect) {
      router.push(state.redirect);
    }
  }, [state, router]);

  const handleSocialLogin = async () => {
    await initiateKeycloakLogin("/ws");
  };

  return (
    <AuthCard title="Welcome back" subtitle="Please enter your details">
      <form action={formAction} className="space-y-4">
        {/* Show success message from URL */}
        {messageFromUrl === "account_created" && (
          <div className="p-3 status-success rounded-lg">
            <p className="text-sm">
              Account created successfully! Please sign in.
            </p>
          </div>
        )}

        {/* Show error from URL or state */}
        {(errorFromUrl || state?.error) && (
          <div className="p-3 status-error rounded-lg">
            <p className="text-sm">
              {errorFromUrl || state?.error}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Email address"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            required
            disabled={isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" name="remember" />
            <Label
              htmlFor="remember"
              className="cursor-pointer text-sm font-normal"
            >
              Remember for 30 days
            </Label>
          </div>
          <Link
            href="/forget-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Sign In
        </Button>

        <SocialButton
          provider="google"
          onClick={handleSocialLogin}
          disabled={isPending}
        />

        <AuthFooter
          text="Don't have an account?"
          linkText="Sign up"
          linkHref="/sign-up"
        />
      </form>
    </AuthCard>
  );
}
