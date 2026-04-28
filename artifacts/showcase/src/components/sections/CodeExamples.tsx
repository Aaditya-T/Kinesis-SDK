import React, { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Check, Copy } from "lucide-react";
import { codeExamples } from "@/data/code-examples";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export function CodeExamples() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="code" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">Works where you build</h2>
          <p className="text-muted-foreground text-lg">Integrate directly into your game client, server, or community bot.</p>
        </div>

        <Tabs defaultValue={codeExamples[0].id} className="w-full">
          <TabsList className="w-full flex justify-start overflow-x-auto bg-transparent border-b border-border rounded-none h-auto p-0 pb-px mb-8 gap-6">
            {codeExamples.map(ex => (
              <TabsTrigger 
                key={ex.id} 
                value={ex.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 py-3 text-base text-muted-foreground data-[state=active]:text-foreground transition-none"
              >
                {ex.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {codeExamples.map((ex) => (
            <TabsContent key={ex.id} value={ex.id} className="mt-0 outline-none">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/95 border border-border/80 rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
                  <span className="text-sm text-muted-foreground font-mono">{ex.description}</span>
                  <button 
                    onClick={() => handleCopy(ex.code, ex.id)}
                    className="p-2 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedId === ex.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto text-sm">
                  <Highlight code={ex.code} language={ex.language} theme={themes.vsDark}>
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre className={`${className} bg-transparent font-mono`} style={{ ...style, backgroundColor: 'transparent' }}>
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
