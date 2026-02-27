import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flashcards Learning",
  description: "Spaced repetition flashcard app with SM-2 algorithm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
