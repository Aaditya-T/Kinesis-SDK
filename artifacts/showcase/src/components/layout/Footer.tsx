import React from "react";
import { Link } from "wouter";
import { BookOpen, Github, Mail } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/links";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-12 mt-24">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Kinesis logo" className="w-8 h-8 rounded-md object-contain" />
            <span className="font-display font-bold text-lg tracking-tight">
              Kinesis<span className="text-primary">.SDK</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left max-w-sm">
            Built by Blockcelerate. Empowering indie developers to ship on-chain experiences without
            the blockchain learning curve.
          </p>
        </div>
        <div className="flex gap-6 flex-wrap justify-center">
          <Link href="/docs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <BookOpen className="w-4 h-4" />
            Docs
          </Link>
          <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a href="mailto:info@blockcelerate.net" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Mail className="w-4 h-4" />
            info@blockcelerate.net
          </a>
        </div>
      </div>
    </footer>
  );
}
