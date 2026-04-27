import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Demo } from "@/components/sections/Demo";
import { CodeExamples } from "@/components/sections/CodeExamples";
import { Pricing } from "@/components/sections/Pricing";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Demo />
        <CodeExamples />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
