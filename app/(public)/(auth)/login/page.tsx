"use client";

import { useState } from "react";
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
import { LoginSchema } from "@/schemas/loginSchema";
import { loginWithCredentials, initiateLogin } from "@/lib/actions/auth";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorFromUrl = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = LoginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormErrors;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const loginResult = await loginWithCredentials(email, password);

      if (!loginResult.success) {
        setErrors({ general: loginResult.error || "Login failed" });
        setIsLoading(false);
        return;
      }

      // Redirect to workspaces page for workspace selection
      router.push("/workspaces?redirect=/");
    } catch (error) {
      setErrors({ general: "An unexpected error occurred" });
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async () => {
    setIsSocialLoading(true);
    try {
      await initiateLogin("/");
    } catch (error) {
      // initiateLogin redirects, so this catch is for unexpected errors
      setErrors({ general: "Failed to initiate login" });
      setIsSocialLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Please enter your details">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Show error from URL or general error */}
        {(errorFromUrl || errors.general) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {errorFromUrl || errors.general}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Email adress"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          Sign In
        </Button>

        <SocialButton
          provider="google"
          onClick={handleSocialLogin}
          disabled={isSocialLoading || isLoading}
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
