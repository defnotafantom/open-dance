import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden bg-background p-4 py-10 text-foreground">
      <ThemeToggle className="fixed top-4 right-4 z-40" />
      <Link href="/" className="relative">
        <Logo size={34} wordmark={false} />
      </Link>
      <div className="relative w-full max-w-sm">{children}</div>
    </main>
  );
}
