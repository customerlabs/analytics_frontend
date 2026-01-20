import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  className,
}: AuthCardProps) {
  return (
    <Card className={cn("w-full max-w-md shadow-lg", className)}>
      <CardHeader className="space-y-1 pb-4">
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
