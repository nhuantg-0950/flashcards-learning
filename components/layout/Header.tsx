"use client";

import Link from "next/link";
import { LogoutButton } from "./LogoutButton";
import { BookOpen } from "lucide-react";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className ?? ""}`}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo & App Name */}
        <Link href="/decks" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span>Flashcards</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link
            href="/decks"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            My Decks
          </Link>

          {/* Logout Button */}
          <LogoutButton variant="ghost" size="sm" />
        </nav>
      </div>
    </header>
  );
}
