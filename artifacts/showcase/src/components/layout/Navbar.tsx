import React from "react";
import { Link } from "wouter";
import { Github, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GITHUB_REPO_URL } from "@/lib/links";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Kineses<span className="text-primary">.SDK</span>
          </span>
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
            aria-label="View the Kineses SDK repository on GitHub"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-5 h-5" />
          </a>
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <a href="mailto:hello@kineses.dev">Contact Us</a>
          </Button>
        </div>
      </div>
    </nav>
  );
}
