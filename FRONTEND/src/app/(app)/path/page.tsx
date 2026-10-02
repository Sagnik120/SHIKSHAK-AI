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
}
