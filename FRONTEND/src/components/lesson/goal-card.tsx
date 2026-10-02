"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Compass, Flag, GraduationCap, Loader2, RotateCcw, Target, Trophy } from "lucide-react";
import { useI18n } from "@/providers/i18n";
import { Skeleton } from "@/components/ui/primitives";
import { COURSE_GOAL, useSkillGoal } from "@/components/lesson/skill-map";
import { stepHref } from "@/components/lesson/path-progress";
import { EASE } from "@/lib/utils";

// "Just explore" is a per-browser preference, not learning state.
const EXPLORE_KEY = "shikshak.exploreFreely";
const readExplore = () => { try { return localStorage.getItem(EXPLORE_KEY) === "1"; } catch { return false; } };
const writeExplore = (v: boolean) => { try { if (v) localStorage.setItem(EXPLORE_KEY, "1"); else localStorage.removeItem(EXPLORE_KEY); } catch { /* storage blocked */ } };

const TXT = {
  en: {
    ask: "How do you want to learn?", askSub: "You can change this any time.",
    zero: "Learn AI from zero", zeroSub: "A complete course, foundations to frontier, skipping what you know.",
    topic: "Reach a specific topic", topicSub: "Pick a goal like Transformers or Mamba. We route you there.",
    explore: "Just explore", exploreSub: "Learn any topic freely. Your map still tracks progress.",
    exploring: "Exploring freely.", setGoal: "Set a learning goal",
    goal: "Your goal", next: "Next step", cont: "Continue", change: "Change goal", reached: "Goal reached!", pick: "Pick a new goal",
    of: "{d} of {t} concepts mastered",
  },
  hi: {
    ask: "आप कैसे सीखना चाहते हैं?", askSub: "इसे कभी भी बदल सकते हैं।",
    zero: "शुरू से AI सीखें", zeroSub: "बुनियाद से नवीनतम तक पूरा कोर्स, जो आप जानते हैं उसे छोड़कर।",
    topic: "किसी खास विषय तक पहुँचें", topicSub: "Transformers या Mamba जैसा लक्ष्य चुनें, हम रास्ता बनाएँगे।",
    explore: "बस खोजें", exploreSub: "कोई भी विषय खुलकर सीखें। आपका मैप प्रगति दर्ज करता रहेगा।",
    exploring: "आप खुलकर सीख रहे हैं।", setGoal: "सीखने का लक्ष्य चुनें",
    goal: "आपका लक्ष्य", next: "अगला कदम", cont: "जारी रखें", change: "लक्ष्य बदलें", reached: "लक्ष्य पूरा!", pick: "नया लक्ष्य चुनें",
    of: "{t} में से {d} अवधारणाओं में महारत",
  },
};

export function GoalCard() {
  const { lang, n } = useI18n();
  const tx = TXT[lang === "hi" ? "hi" : "en"];
  const { q, data, setGoal, saving } = useSkillGoal();
  const [explore, setExplore] = useState(false);
  useEffect(() => { setExplore(readExplore()); }, []);

  if (q.isLoading) return <Skeleton className="h-40 rounded-[28px]" />;
  if (!data) return null; // map unavailable: the rest of the home page still works

  const card = "@container rounded-[28px] border border-line bg-surface p-5 sm:p-6 shadow-[var(--shadow-soft)]";

  /* goal set: progress + next step */
  if (data.goal) {
    const next = data.route.find((s) => s.next) ?? data.route[0];
    const pct = data.scope_total ? (data.scope_done / data.scope_total) * 100 : 0;
    return (
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE }} className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-700"><Flag className="h-3.5 w-3.5" />{tx.goal}</p>
            <h2 className="mt-1 line-clamp-2 break-words font-display text-2xl leading-tight text-ink [overflow-wrap:anywhere] @xl:text-3xl">{data.goal_title}</h2>
}
