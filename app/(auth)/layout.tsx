import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)]">
      {/* Subtle radial glow behind logo */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--accent-glow)] opacity-20 blur-[120px]" />

      {/* Logo */}
      <div className="relative z-10 mb-8 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] shadow-[var(--shadow-glow)]">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          SalesIntel
        </span>
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">{children}</div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-xs text-[var(--text-tertiary)]">
        AI-powered sales intelligence &middot; Secure &amp; SOC 2 compliant
      </p>
    </div>
  );
}
