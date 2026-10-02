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

}
