"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, FlaskConical, Loader2, Lock, Play, RotateCcw } from "lucide-react";
import { labsFor } from "@/components/lab/labs";
import type { JourneyStep } from "@/core/types";
import { useI18n } from "@/providers/i18n";
import { GoalCard } from "@/components/lesson/goal-card";
import { PlacementCheck } from "@/components/lesson/placement-check";
import { SkillMap, useSkillGoal } from "@/components/lesson/skill-map";
import { stepHref } from "@/components/lesson/path-progress";
import { cn, EASE } from "@/lib/utils";

const TXT = {
  en: { title: "Learning path", sub: "Your route to your goal: what's done, what's next and why.", journey: "Your path, step by step",
    done: "Done", review: "Open report", refresh: "Refresh", resume: "Resume", start: "Start", again: "Practise again", recap: "Recap", later: "Coming up",
    more: "Show more", less: "Show less", lab: "Practice Lab", labSub: "Simulations + code challenges", noGoal: "Pick a goal to see your route", noGoalSub: "Choose one in the panel, or tap a concept on the skill map below." },
  hi: { title: "सीखने का रास्ता", sub: "आपके लक्ष्य तक का रास्ता: क्या हो गया, आगे क्या है और क्यों।", journey: "आपका रास्ता, कदम दर कदम",
    done: "पूरा", review: "रिपोर्ट देखें", refresh: "दोहराएँ", resume: "जारी रखें", start: "शुरू करें", again: "फिर अभ्यास करें", recap: "दोहराएँ", later: "आगे",
    more: "और देखें", less: "कम देखें", lab: "प्रैक्टिस लैब", labSub: "सिमुलेशन + कोड चुनौतियाँ", noGoal: "अपना रास्ता देखने के लिए लक्ष्य चुनें", noGoalSub: "पैनल में चुनें, या नीचे स्किल मैप में किसी अवधारणा पर टैप करें।" },
};

export default function PathPage() {
  const { lang, n } = useI18n();
  const tx = TXT[lang === "hi" ? "hi" : "en"];
  const { data } = useSkillGoal();

  const done = data?.journey.filter((s) => s.state === "done").length ?? 0;
  const total = data?.journey.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="pb-2">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">{tx.title}</h1>
        <p className="mt-2 text-ink-2">{tx.sub}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:order-2">
          <GoalCard />
          {data && <PlacementCheck map={data} />}
          <Link href="/lab" className="flex items-center gap-3 rounded-[24px] border border-sky-200 bg-sky-50/60 p-4 transition-colors hover:border-sky-400">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-sky-600"><FlaskConical className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{tx.lab}</span>
              <span className="block text-xs text-ink-2">{tx.labSub}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-sky-700" />
          </Link>
        </aside>

        <section className="min-w-0 lg:order-1">
          {data?.goal && total > 0 ? (
            <div className="rounded-[28px] border border-line bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-display text-3xl text-ink">{tx.journey}</h2>
                <span className="shrink-0 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage">{n(done)} / {n(total)}</span>
              </div>
              <ol className="relative mt-5 space-y-3 before:absolute before:bottom-[42px] before:left-[19px] before:top-[42px] before:w-0.5 before:rounded-full before:bg-gradient-to-b before:from-sage/60 before:via-sky-300 before:to-line">
                {data.journey.map((s, i) => <Step key={`${s.state}-${s.id}-${i}`} s={s} i={i} goal={data.goal!} tx={tx} />)}
              </ol>
            </div>
          ) : (
            <div className="ruled grid min-h-64 place-items-center rounded-[28px] border border-dashed border-line-2 bg-surface p-8 text-center">
              <div>
                <p className="font-display text-3xl text-ink">{tx.noGoal}</p>
                <p className="mt-2 text-sm text-ink-2">{tx.noGoalSub}</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <SkillMap />
    </div>
  );
}

function Step({ s, i, goal, tx }: { s: JourneyStep; i: number; goal: string; tx: (typeof TXT)["en"] }) {
  const { n } = useI18n();
  const [open, setOpen] = useState(false);
  const done = s.state === "done";
  const resumable = !done && s.lesson_id && s.lesson_status && !["completed", "abandoned"].includes(s.lesson_status);
  const locked = !done && !s.next && !resumable && s.blocked_by.length > 0;

  const action = done
    ? s.lesson_id ? { href: `/report/${s.lesson_id}`, label: tx.review } : null
    : resumable ? { href: `/learn/${s.lesson_id}`, label: tx.resume }
    : !locked ? { href: stepHref(s, goal), label: s.state === "practice" ? tx.again : tx.start } : null;

  const reason = done ? `${tx.done}${s.score != null ? ` · ${n(Math.round(s.score * 100))}%` : ""}` : s.reason || tx.later;
  const lab = labsFor(s.title)[0];

  return (
    <motion.li layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 15) * 0.03, ease: EASE }}
      className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-3 hover:z-20 sm:gap-4">
      <span className={cn("relative z-10 mt-[22px] grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-semibold ring-4 ring-surface",
        done ? "border-sage bg-sage-100 text-sage" : s.next ? "border-sky-500 bg-sky-500 text-white" : "",
        !done && !s.next && (s.state === "recap" || s.state === "practice" ? "border-amber bg-amber-100 text-ink" : resumable ? "border-sky-400 bg-sky-50 text-sky-700" : "border-line bg-surface text-ink-3"))}>
        {s.next && <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/40" />}
        <span className="relative">{done ? <Check className="h-4 w-4" /> : resumable ? <Loader2 className="h-4 w-4" /> : s.state === "recap" ? <RotateCcw className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : n(i + 1)}</span>
      </span>

      <div className={cn("group relative flex h-[84px] min-w-0 items-center gap-3 rounded-2xl border px-4 transition-[border-color,box-shadow]",
        s.next ? "border-sky-300 bg-sky-50/40 shadow-[var(--shadow-soft)]" : "border-line bg-surface hover:border-sky-200 hover:shadow-[var(--shadow-soft)]", locked && "opacity-60")}>
        <button type="button" onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)} className="peer min-w-0 flex-1 text-left outline-none">
          <p className="truncate font-medium text-ink">{s.title}</p>
          <p className="mt-0.5 truncate text-xs text-ink-3">{reason}</p>
        </button>
        {/* full text: hover on desktop, tap on touch */}
        <div className={cn("pointer-events-none absolute left-3 right-3 top-full z-30 mt-1.5 origin-top rounded-xl border border-line bg-surface p-3 text-left opacity-0 shadow-[var(--shadow-lift)] transition-all duration-200 [transform:translateY(-4px)_scale(.98)]",
          "peer-hover:opacity-100 peer-hover:[transform:none]", open && "opacity-100 [transform:none]")}>
          <p className="break-words text-sm font-medium text-ink [overflow-wrap:anywhere]">{s.title}</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-ink-2 [overflow-wrap:anywhere]">{reason}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {s.review_due && (
            <Link href="/refresh" title={tx.refresh} aria-label={tx.refresh} className="grid h-8 w-8 place-items-center rounded-full bg-marigold-100 text-ink hover:bg-marigold-200">
              <RotateCcw className="h-3.5 w-3.5" />
            </Link>
          )}
          {lab && (
            <Link href={`/lab?sim=${lab.id}`} title="Practice Lab" aria-label="Practice Lab" className="hidden h-8 w-8 place-items-center rounded-full border border-line text-ink-3 hover:border-sky-300 hover:text-sky-700 sm:grid">
              <FlaskConical className="h-3.5 w-3.5" />
            </Link>
          )}
          {action ? (
            <Link href={action.href} className={cn("inline-flex h-9 w-[7.5rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-sm font-medium transition-colors max-sm:w-9",
              s.next ? "bg-sky-600 text-white hover:bg-sky-700" : "border border-line text-sky-700 hover:border-sky-300 hover:bg-sky-50")} aria-label={action.label}>
              {resumable ? <Play className="h-3.5 w-3.5" /> : null}<span className="truncate max-sm:hidden">{action.label}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : <span className="w-[7.5rem] max-sm:w-9" />}
        </div>
      </div>
    </motion.li>
  );
}
