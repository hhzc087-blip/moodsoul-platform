import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoodSoul Control Center",
  description: "Manage your AI hardware companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200">{children}</body>
    </html>
  );
}
