"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

export default function SignUpPage() {
  const [ClerkSignUp, setClerkSignUp] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import("@clerk/nextjs").then((mod) => {
      setClerkSignUp(() => mod.SignUp);
    }).catch(() => {
      // Clerk not configured
    });
  }, []);

  return (
    <div className="flex justify-center">
      {ClerkSignUp ? (
        <ClerkSignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-[var(--bg-secondary)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] rounded-[var(--radius-lg)]",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      ) : (
        <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-8 text-center">
          <Building2 className="mx-auto mb-4 h-10 w-10 text-[var(--accent)]" />
          <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
            Create Account
          </h2>
          <p className="text-sm text-[var(--text-tertiary)]">
            Configure Clerk authentication keys to enable sign up.
          </p>
        </div>
      )}
    </div>
  );
}
