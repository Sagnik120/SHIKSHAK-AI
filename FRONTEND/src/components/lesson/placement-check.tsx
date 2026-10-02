"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ClipboardCheck, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/core/api";
import type { PlacementAnswer, PlacementStep, SkillMap } from "@/core/types";
import { useI18n } from "@/providers/i18n";
import { cn, EASE } from "@/lib/utils";

const TXT = {
  en: {
    offer: "Skip what you already know", offerSub: "A 2-minute placement check: about 6 questions, getting harder as you go right.",
    start: "Take the check", later: "Not now", q: "Question {a} of up to {b}", finishing: "Working out your level…",
    resultNone: "No problem: your path starts from the very beginning.", result: "You already know the foundations up to {c}.",
    resultSub: "Those concepts are marked known on your map and skipped in your path. Real lesson scores always override them.",
    done: "See my path", placed: "Placement: known up to {c}.", placedNone: "Placement: starting from the beginning.", retake: "Retake", reset: "Reset",
  },
  hi: {
    offer: "जो आप जानते हैं उसे छोड़ें", offerSub: "2 मिनट की जाँच: लगभग 6 प्रश्न, सही उत्तर पर कठिन होते जाते हैं।",
    start: "जाँच शुरू करें", later: "अभी नहीं", q: "प्रश्न {a} / अधिकतम {b}", finishing: "आपका स्तर निकाला जा रहा है…",
    resultNone: "कोई बात नहीं: आपका रास्ता बिल्कुल शुरुआत से शुरू होगा।", result: "आप {c} तक की बुनियाद पहले से जानते हैं।",
    resultSub: "ये अवधारणाएँ मैप पर ज्ञात मानी गईं और रास्ते में छोड़ी जाएँगी। असली पाठ के अंक हमेशा इन्हें बदल सकते हैं।",
    done: "मेरा रास्ता देखें", placed: "जाँच: {c} तक ज्ञात।", placedNone: "जाँच: शुरुआत से।", retake: "फिर से दें", reset: "हटाएँ",
  },
};

type Phase = { kind: "idle" } | { kind: "asking"; step: Extract<PlacementStep, { done: false }>["next"] } | { kind: "saving" } | { kind: "result"; upto: string | null };

export function PlacementCheck({ map }: { map: SkillMap }) {
  const { lang, n } = useI18n();
  const tx = TXT[lang === "hi" ? "hi" : "en"];
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const titleOf = (id: string | null) => (id ? map.concepts.find((c) => c.id === id)?.title ?? id : null);

  const advance = async (next: PlacementAnswer[]) => {
    setBusy(true);
    try {
      const out = await api.placementNext(next);
      setAnswers(next);
      if (!out.done) return setPhase({ kind: "asking", step: out.next });
      setPhase({ kind: "saving" });
      const saved = await api.placementSave(next);
      qc.setQueryData(["skill-map", "me"], saved.map);
      setPhase({ kind: "result", upto: saved.placement.known_upto });
    } catch (e) {
      toast.error((e as Error).message);
      setPhase({ kind: "idle" });
    } finally { setBusy(false); }
  };
  const start = () => { setAnswers([]); void advance([]); };
  const reset = async () => {
    setBusy(true);
    try { qc.setQueryData(["skill-map", "me"], await api.placementReset()); } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const shell = "@container rounded-[24px] border border-sky-200 bg-sky-50/40 p-5";

  if (phase.kind === "asking") {
    const q = phase.step;
    return (
      <div className={shell}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">{tx.q.replace("{a}", n(q.number)).replace("{b}", n(q.of))}</p>
}
