import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-accent/40 p-4">
      <Link href="/">
        <Logo size={36} />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
