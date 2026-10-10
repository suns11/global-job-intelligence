import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Global Job Intelligence", description: "Understand job requirements and prepare evidence-based applications." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
