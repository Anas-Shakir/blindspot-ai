import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blindspot AI — Turn Passive Lectures into Active Teachers",
  description:
    "Your lecture recording, taught properly — with receipts. Turn passive audio into structured pedagogical phases, concept graphs, and verifiable source timestamps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07080a] font-sans text-neutral-100 antialiased selection:bg-blue-600/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
