import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "SalesIntel — AI Sales Intelligence",
  description:
    "Real-time buying signals, AI-powered research, and actionable intelligence to close deals faster.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider dynamic>
      <html lang="en">
        <body className="dark antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
