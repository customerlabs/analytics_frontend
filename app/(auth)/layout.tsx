import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="p-6">
        <Link href="/" className="flex w-fit items-center gap-2">
          <Image
            src="/logo_full.png"
            alt="CustomerLabs"
            width={168}
            height={32}
            // className="size-8"
          />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
