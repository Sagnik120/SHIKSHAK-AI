"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Lock, RotateCcw } from "lucide-react";
import { api } from "@/core/api";
import type { Lesson } from "@/core/types";
import { useI18n } from "@/providers/i18n";
import { Badge, Card, Skeleton, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/* A fixed AI curriculum. Each step is matched to the learner's lessons by
   keyword, and its state + suggested difficulty come from their scores. */
const PATH = [
  { topic: "What is AI and machine learning?", hi: "AI और मशीन लर्निंग क्या है?", keys: ["what is ai", "machine learning", "intro"] },
  { topic: "Linear regression and loss functions", hi: "लीनियर रिग्रेशन और लॉस फ़ंक्शन", keys: ["regression", "loss"] },
  { topic: "Gradient descent", hi: "ग्रेडिएंट डिसेंट", keys: ["gradient"] },
  { topic: "Overfitting and generalisation", hi: "ओवरफ़िटिंग और सामान्यीकरण", keys: ["overfit", "generali", "regulari"] },
  { topic: "Neural networks", hi: "न्यूरल नेटवर्क", keys: ["neural", "perceptron", "backprop"] },
  { topic: "Embeddings and word vectors", hi: "एम्बेडिंग और वर्ड वेक्टर", keys: ["embedding", "vector"] },
  { topic: "Attention and transformers", hi: "अटेंशन और ट्रांसफ़ॉर्मर", keys: ["attention", "transformer"] },
  { topic: "Large language models and prompting", hi: "लार्ज लैंग्वेज मॉडल और प्रॉम्प्टिंग", keys: ["llm", "language model", "prompt", "gpt"] },
] as const;

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
type State = "mastered" | "practice" | "learning" | "next" | "locked";

const TXT = {
  en: { title: "Your AI learning path", sub: "Eight steps from first ideas to LLMs. It reorders around your scores.", mastered: "Mastered", practice: "Needs practice", learning: "In progress", next: "Up next", locked: "Later", start: "Start", again: "Practise again", cont: "Continue", level: "Suggested level" },
  hi: { title: "आपका AI सीखने का रास्ता", sub: "बुनियादी विचारों से LLM तक आठ कदम। आपके स्कोर के अनुसार बदलता है।", mastered: "महारत", practice: "अभ्यास चाहिए", learning: "जारी", next: "अगला", locked: "बाद में", start: "शुरू करें", again: "फिर अभ्यास करें", cont: "जारी रखें", level: "सुझाया स्तर" },
};
const LEVEL_TXT = { en: ["Beginner", "Intermediate", "Advanced"], hi: ["शुरुआती", "मध्यम", "उन्नत"] };
const TONE: Record<State, Tone> = { mastered: "sage", practice: "amber", learning: "sky", next: "marigold", locked: "neutral" };

function plan(lessons: Lesson[]) {
  let nextGiven = false;
  return PATH.map((step) => {
    const mine = lessons.filter((l) => step.keys.some((k) => `${l.title} ${l.topic ?? ""}`.toLowerCase().includes(k)));
    const done = mine.filter((l) => l.status === "completed" && l.score_pct != null);
    const best = done.reduce<Lesson | null>((b, l) => (!b || (l.score_pct ?? 0) > (b.score_pct ?? 0) ? l : b), null);
    const open = mine.find((l) => l.status !== "completed");
    const score = best?.score_pct ?? null;
    const lvlIdx = Math.max(0, LEVELS.indexOf((best?.level ?? "beginner") as (typeof LEVELS)[number]));
    let state: State;
    let level = lvlIdx;
    if (score != null && score >= 70) { state = "mastered"; level = Math.min(2, lvlIdx + (score >= 85 ? 1 : 0)); }
    else if (score != null) { state = "practice"; level = Math.max(0, lvlIdx - 1); }
    else if (open) state = "learning";
    else if (!nextGiven) state = "next";
    else state = "locked";
    if (state !== "mastered") nextGiven = true;
    return { step, state, score, level, open };
  });
}

export function LearningPath() {
  const { lang, n } = useI18n();
  const L = lang === "hi" ? "hi" : "en";
  const tx = TXT[L];
  const q = useQuery({ queryKey: ["lessons", "path"], queryFn: () => api.listLessons({ limit: 200 }) });
  if (q.isLoading) return <Skeleton className="mt-8 h-64 rounded-[var(--radius)]" />;
  const rows = plan(q.data?.lessons ?? []);
  const doneCount = rows.filter((r) => r.state === "mastered").length;

  return (
    <Card className="mt-8 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ink">{tx.title}</h2>
          <p className="mt-1 text-sm text-ink-2">{tx.sub}</p>
        </div>
        <p className="text-sm font-medium text-ink-2">{n(doneCount)} / {n(PATH.length)}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-3">
        <div className="h-full rounded-full bg-sky-500 transition-[width] duration-700" style={{ width: `${(doneCount / PATH.length) * 100}%` }} />
      </div>
      <ol className="mt-6 space-y-2">
        {rows.map(({ step, state, score, level, open }, i) => {
          const topic = L === "hi" ? step.hi : step.topic;
          const href = open && state === "learning"
            ? `/learn/${open.id}`
            : `/new?topic=${encodeURIComponent(step.topic)}&level=${LEVELS[level]}`;
          const action = state === "practice" ? tx.again : state === "learning" ? tx.cont : state === "mastered" ? null : tx.start;
          return (
            <li key={step.topic} className={cn("flex min-w-0 items-center gap-4 rounded-2xl border px-4 py-3",
              state === "next" ? "border-sky-300 bg-sky-50/50" : "border-line", state === "locked" && "opacity-60")}>
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
                state === "mastered" ? "bg-sage-100 text-sage" : "bg-paper-3 text-ink-2")}>
                {state === "mastered" ? <Check className="h-4 w-4" /> : state === "locked" ? <Lock className="h-3.5 w-3.5" /> : n(i + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{topic}</p>
                <p className="text-xs text-ink-3">
                  {tx.level}: {LEVEL_TXT[L][level]}{score != null ? ` · ${n(Math.round(score))}%` : ""}
                </p>
              </div>
              <Badge tone={TONE[state]} className="hidden sm:inline-flex">{tx[state]}</Badge>
              {action && state !== "locked" && (
                <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-sky-700 hover:underline">
                  {state === "practice" && <RotateCcw className="h-3.5 w-3.5" />}{action}<ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
