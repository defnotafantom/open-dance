import Image from "next/image";
import { cn } from "cn";

export function Logo({
  size = 32,
  wordmark = true,
  className,
}: {
  size?: number;
  wordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/icons/icon-192.png"
        alt="Open Dance"
        width={size}
        height={size}
        className="rounded-[22%]"
        priority
      />
      {wordmark && (
        <span
          className="font-semibold tracking-tight"
          style={{ fontSize: size * 0.5 }}
        >
          Open Dance
        </span>
      )}
    </span>
  );
}
