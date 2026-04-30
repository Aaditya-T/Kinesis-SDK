import React from "react";
import { Link } from "wouter";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO_URL } from "@/lib/links";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/70 bg-black/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Kinesis logo" className="w-9 h-9 rounded-md object-contain" />
          <div className="leading-tight">
            <div className="font-display font-bold text-lg tracking-tight">
              Kinesis<span className="text-primary">.SDK</span>
            </div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              by Blockcelerate
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Docs
          </Link>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="View the Kinesis SDK repository on GitHub"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <a href="mailto:info@blockcelerate.net">Contact Us</a>
          </Button>
        </div>
      </div>
    </nav>
  );
}
