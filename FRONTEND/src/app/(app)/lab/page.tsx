"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Brain, Code2, Eye, FlaskConical, Mountain, Spline, Trophy } from "lucide-react";
import { useI18n } from "@/providers/i18n";
import { Card } from "@/components/ui/primitives";
import { LABS, Lab, type LabId } from "@/components/lab/labs";
import { CHALLENGES, CodeChallenges } from "@/components/lab/code-challenge";
import { cn, EASE } from "@/lib/utils";

type Tab = "sim" | "code";

const META: Record<LabId, { icon: React.ReactNode; en: string; hi: string }> = {
  gd: { icon: <Mountain className="h-4 w-4" />, en: "How a model walks downhill to learn", hi: "मॉडल ढलान पर चलकर कैसे सीखता है" },
  fit: { icon: <Spline className="h-4 w-4" />, en: "When memorising beats understanding", hi: "जब रटना समझ से आगे निकल जाए" },
  neuron: { icon: <Brain className="h-4 w-4" />, en: "Draw one line to split the data", hi: "एक रेखा से डेटा बाँटिए" },
  attn: { icon: <Eye className="h-4 w-4" />, en: "Which words a word looks at", hi: "एक शब्द किन शब्दों को देखता है" },
};

export default function LabPage() {
  const { lang } = useI18n();
  const hi = lang === "hi";
  const [tab, setTab] = useState<Tab>("sim");
  const [sim, setSim] = useState<LabId>("gd");
  const [solved, setSolved] = useState(0);
  const onSolved = useCallback((n: number) => setSolved(n), []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const want = p.get("sim");
    if (LABS.some((l) => l.id === want)) setSim(want as LabId);
    if (p.get("tab") === "code") setTab("code");
    try { setSolved(JSON.parse(localStorage.getItem("shikshak.codeSolved") || "[]").length); } catch { /* storage blocked */ }
  }, []);
  const go = (t: Tab, id: LabId = sim) => {
    setTab(t); setSim(id);
    window.history.replaceState(null, "", t === "code" ? "/lab?tab=code" : `/lab?sim=${id}`);
  };
  const tabs: Array<{ id: Tab; icon: React.ReactNode; label: string }> = [
    { id: "sim", icon: <FlaskConical className="h-4 w-4" />, label: hi ? "सिमुलेशन" : "Simulations" },
    { id: "code", icon: <Code2 className="h-4 w-4" />, label: hi ? "कोड चुनौतियाँ" : "Code challenges" },
  ];
  const current = LABS.find((l) => l.id === sim)!;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <h1 className="flex items-center gap-3 font-display text-5xl text-ink sm:text-6xl"><FlaskConical className="h-9 w-9 text-sky-600" />{hi ? "प्रैक्टिस लैब" : "Practice Lab"}</h1>
          <p className="mt-2 text-ink-2">{hi ? "AI को करके सीखें: अनुमान लगाइए, चलाइए, फिर कोड लिखकर साबित कीजिए।" : "Learn AI by doing: predict, run it, then prove it in code."}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-2">
          <Trophy className="h-4 w-4 text-marigold-600" />
          <span className="font-semibold text-ink">{solved}/{CHALLENGES.length}</span>{hi ? "चुनौतियाँ हल" : "challenges solved"}
        </span>
      </header>

      <div className="inline-flex rounded-2xl border border-line bg-paper-2 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => go(t.id)} className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium">
            {tab === t.id && <motion.span layoutId="lab-tab" className="absolute inset-0 rounded-xl bg-surface shadow-[var(--shadow-soft)]" transition={{ ease: EASE, duration: 0.3 }} />}
            <span className={cn("relative flex items-center gap-2", tab === t.id ? "text-ink" : "text-ink-3")}>{t.icon}{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "sim" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {LABS.map((l) => (
              <button key={l.id} onClick={() => go("sim", l.id)}
                className={cn("flex shrink-0 items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors lg:w-full",
                  sim === l.id ? "border-sky-400 bg-sky-50 shadow-[var(--shadow-soft)]" : "border-line bg-surface hover:border-sky-300")}>
                <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", sim === l.id ? "bg-sky-600 text-white" : "bg-paper-3 text-ink-3")}>{META[l.id].icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{hi ? l.hi : l.en}</span>
                  <span className="hidden text-xs text-ink-3 lg:block">{hi ? META[l.id].hi : META[l.id].en}</span>
                </span>
              </button>
            ))}
          </nav>
          <Card className="min-w-0 p-5 sm:p-6">
            <h2 className="font-display text-3xl text-ink">{hi ? current.hi : current.en}</h2>
            <p className="mb-5 mt-1 text-sm text-ink-2">{hi ? META[sim].hi : META[sim].en}</p>
            <Lab key={sim} id={sim} />
          </Card>
        </div>
      ) : (
        <CodeChallenges onSolvedChange={onSolved} />
      )}
    </div>
  );
}
