"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

// Dynamic import of Clerk to avoid SSG issues when keys aren't configured
export default function SignInPage() {
  const [ClerkSignIn, setClerkSignIn] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import("@clerk/nextjs").then((mod) => {
      setClerkSignIn(() => mod.SignIn);
    }).catch(() => {
      // Clerk not configured
    });
  }, []);

  return (
    <div className="flex justify-center">
      {ClerkSignIn ? (
        <ClerkSignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] rounded-[var(--radius-lg)]",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      ) : (
        <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-[var(--accent)]" />
          <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
            Sign In to SalesIntel
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Configure Clerk authentication keys to enable sign in.
          </p>
        </div>
      )}
    </div>
  );
}
