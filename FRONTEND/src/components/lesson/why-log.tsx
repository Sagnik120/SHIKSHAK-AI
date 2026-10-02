"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowDown, ArrowUp, BookOpen, Brain, Hand, Lightbulb, Map, RefreshCw, Search, SkipForward, Wand2 } from "lucide-react";
import { api } from "@/core/api";
import type { WhyEntry } from "@/core/types";
import { useI18n } from "@/providers/i18n";
import { cn, EASE } from "@/lib/utils";

type Lang = "en" | "hi";
const list = (xs: unknown) => (Array.isArray(xs) ? xs.filter(Boolean).join(", ") : "");
const tag = (t: unknown) => (typeof t === "string" ? t.replace(/_/g, " ") : "");

/* One sentence per decision, in the learner's language. */
function phrase(e: WhyEntry, lang: Lang): { text: string; icon: React.ReactNode; tone: string } | null {
  const p = e.params, c = e.concept ? `“${e.concept}”` : lang === "hi" ? "इस हिस्से" : "this part";
  const hi = lang === "hi";
  switch (e.kind) {
    case "memory":
      return { icon: <Brain />, tone: "text-sky-700 bg-sky-50", text: hi
        ? `पिछले पाठों से याद रखा: ${list(p.weak) || list(p.misconceptions)} पर आपको और मदद चाहिए थी, इसलिए योजना में इसे ध्यान में रखा।`
        : `Remembered from earlier lessons: you found ${list(p.weak) || list(p.misconceptions)} hard, so the plan accounts for it.` };
    case "plan":
      return { icon: <Map />, tone: "text-sky-700 bg-sky-50", text: hi
        ? `${p.parts ?? ""} हिस्सों की योजना बनाई${p.from_document ? ", आपके दस्तावेज़ से" : ""}${p.used_memory ? ", आपकी पिछली प्रगति के अनुसार" : ""}।`
        : `Planned ${p.parts ?? ""} parts${p.from_document ? " from your document" : ""}${p.used_memory ? ", shaped by your past progress" : ""}.` };
    case "path": {
      const bits = hi
        ? [`यह पाठ “${p.goal}” तक के आपके रास्ते का एक कदम है।`,
           list(p.skipped) && `${list(p.skipped)} आप जानते हैं, इसलिए दोबारा नहीं पढ़ाया।`,
           list(p.recap) && `${list(p.recap)} की छोटी दोहराई जोड़ी।`,
           p.retry_percent != null && `पिछली बार ${p.retry_percent}% आया था, इसलिए नए तरीके से समझाया।`,
           p.next && `अंत में “${p.next}” से जोड़ा।`]
        : [`This lesson is a step on your route to “${p.goal}”.`,
           list(p.skipped) && `Didn't re-teach ${list(p.skipped)}: you know it.`,
           list(p.recap) && `Added a quick recap of ${list(p.recap)}.`,
           p.retry_percent != null && `You scored ${p.retry_percent}% last time, so it's explained from a new angle.`,
           p.next && `Ends with a bridge to “${p.next}”.`];
      return { icon: <SkipForward />, tone: "text-sky-700 bg-sky-50", text: bits.filter(Boolean).join(" ") };
    }
    case "refined_search":
      return { icon: <Search />, tone: "text-ink-2 bg-paper-3", text: hi ? `${c} के लिए आपके दस्तावेज़ में बेहतर खोज की।` : `Searched your document again with a sharper query for ${c}.` };
    case "no_context":
      return { icon: <BookOpen />, tone: "text-amber bg-amber-100", text: hi ? `आपके नोट्स में ${c} नहीं था, इसलिए सामान्य ज्ञान से पढ़ाया।` : `Your notes didn't cover ${c}, so it was taught from general knowledge.` };
    case "adapt_modify":
      return { icon: <RefreshCw />, tone: "text-marigold-600 bg-marigold-100", text: hi
        ? `${c} को नए उदाहरण से फिर समझाया${p.misconception ? ` (आपके उत्तर में “${tag(p.misconception)}” वाली गलती दिखी)` : ""}।`
        : `Re-explained ${c} with a new example${p.misconception ? `: your answer showed “${tag(p.misconception)}”` : ""}.` };
    case "adapt_regenerate":
      return { icon: <Wand2 />, tone: "text-marigold-600 bg-marigold-100", text: hi
        ? `${c} को शुरू से सरल कदमों में दोबारा बनाया: यह ${p.attempt ?? 2}वाँ प्रयास था।`
        : `Rebuilt ${c} from scratch in simpler steps: attempt ${p.attempt ?? 2} on the same idea.` };
    case "adapt_human":
    case "mentor":
}
