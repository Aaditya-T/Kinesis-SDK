import React from "react";
import { Check } from "lucide-react";
import { pricingTiers } from "@/data/pricing-tiers";
import { Button } from "@/components/ui/button";

export function Pricing() {
  return (
    <section className="py-24 bg-secondary/10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-display font-bold mb-4">Start free. Scale when you're ready.</h2>
          <p className="text-muted-foreground text-lg">Self-host forever, or let us manage the infrastructure.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pricingTiers.map(tier => (
            <div 
              key={tier.id}
              className={`p-8 rounded-2xl border ${tier.highlighted ? 'border-primary bg-primary/5 relative' : 'border-border bg-card'}`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Recommended
                </div>
              )}
              <h3 className="text-2xl font-display font-bold mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-extrabold">{tier.price}</span>
                {tier.priceCadence && <span className="text-muted-foreground">/ {tier.priceCadence}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-8 min-h-[40px]">
                {tier.tagline}
              </p>
              
              <Button 
                variant={tier.highlighted ? "default" : "outline"} 
                className="w-full mb-8"
                asChild
              >
                <a href={tier.cta.href}>{tier.cta.label}</a>
              </Button>

              <ul className="space-y-4">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className={`w-5 h-5 shrink-0 ${tier.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
