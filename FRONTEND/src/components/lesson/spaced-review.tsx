"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, Check, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/core/api";
import type { ReviewResult, ReviewSet } from "@/core/types";
import { useI18n } from "@/providers/i18n";
import { Skeleton, Textarea } from "@/components/ui/primitives";
import { cn, EASE } from "@/lib/utils";

const TXT = {
  en: {
    card: "Time to refresh", cardSub: "{n} concepts are fading. A quick review keeps them.", start: "Review now",
    ago: "learned {d} days ago", title: "Refresh", sub: "Concepts come back just before you'd forget them. Two quick questions each.",
    none: "Nothing to refresh right now. Concepts you master come back here after a few days.",
    begin: "Start", check: "Check", passed: "Refreshed! Next review in {d} days.", failed: "That one has faded. It's back on your learning path to practise; next check in {d} days.",
    model: "Answer:", next: "Back to the list",
  },
  hi: {
    card: "दोहराने का समय", cardSub: "{n} अवधारणाएँ धुंधली हो रही हैं। एक छोटी दोहराई उन्हें ताज़ा रखेगी।", start: "अभी दोहराएँ",
    ago: "{d} दिन पहले सीखा", title: "दोहराई", sub: "अवधारणाएँ भूलने से ठीक पहले लौटती हैं। हर एक पर दो छोटे प्रश्न।",
    none: "अभी दोहराने को कुछ नहीं। जिनमें महारत होगी, वे कुछ दिनों बाद यहाँ लौटेंगी।",
    begin: "शुरू करें", check: "जाँचें", passed: "ताज़ा हो गया! अगली दोहराई {d} दिनों में।", failed: "यह धुंधला गया है। इसे आपके रास्ते पर अभ्यास के लिए वापस रखा गया; अगली जाँच {d} दिनों में।",
    model: "उत्तर:", next: "सूची पर वापस",
  },
};
const useTx = () => { const { lang } = useI18n(); return TXT[lang === "hi" ? "hi" : "en"]; };

/* Home-page nudge; renders nothing when nothing is due. */
export function ReviewDueCard() {
  const tx = useTx();
  const { n } = useI18n();
  const q = useQuery({ queryKey: ["spaced-review"], queryFn: api.reviewDue, refetchOnMount: "always" });
  const due = q.data?.due ?? [];
  if (!due.length) return null;
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }}
      className="flex flex-wrap items-center gap-4 rounded-[24px] border border-marigold-200 bg-marigold-50 p-5">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface text-marigold-600"><RotateCcw className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{tx.card}</p>
        <p className="text-sm text-ink-2">{tx.cardSub.replace("{n}", n(due.length))} <span className="text-ink-3">· {due.slice(0, 3).map((d) => d.title).join(", ")}</span></p>
      </div>
      <Link href="/refresh" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90">{tx.start}<ArrowRight className="h-4 w-4" /></Link>
    </motion.section>
  );
}

/* The /refresh page body. */
export function SpacedReview() {
  const tx = useTx();
  const { n } = useI18n();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["spaced-review"], queryFn: api.reviewDue, refetchOnMount: "always" });
  const [set, setSet] = useState<ReviewSet | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  const open = async (cid: string) => {
    setOpening(cid);
    try { setSet(await api.reviewStart(cid)); } catch (e) { toast.error((e as Error).message); } finally { setOpening(null); }
  };
  const done = () => { setSet(null); qc.invalidateQueries({ queryKey: ["spaced-review"] }); qc.invalidateQueries({ queryKey: ["skill-map"] }); };

  if (set) return <ReviewRun set={set} onDone={done} />;
  if (q.isLoading) return <Skeleton className="mt-6 h-40 rounded-[24px]" />;
  const due = q.data?.due ?? [];
}
