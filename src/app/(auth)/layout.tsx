import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Grain } from "@/components/marketing/grain";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="dark relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden bg-background p-4 py-10 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, color-mix(in oklch, var(--primary), transparent 82%), transparent)",
        }}
      />
      <Grain />
      <Link href="/" className="relative">
        <Logo size={34} />
      </Link>
      <div className="relative w-full max-w-sm">{children}</div>
    </main>
  );
}
