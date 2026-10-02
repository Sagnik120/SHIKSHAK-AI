"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { Check, Flag, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/core/api";
import type { SkillConcept } from "@/core/types";
import { useI18n } from "@/providers/i18n";
import { Card, Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export const COURSE_GOAL = "__all__";
export const trackGoal = (track: string) => `__track_${track}`;

/* The learner's own map + saved goal; shared by the Progress map and the home goal card. */
export function useSkillGoal() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["skill-map", "me"], queryFn: () => api.skillMap(), placeholderData: keepPreviousData, refetchOnMount: "always" });
  const [saving, setSaving] = useState(false);
  const setGoal = async (goal: string | null) => {
    setSaving(true);
    try { qc.setQueryData(["skill-map", "me"], await api.setSkillGoal(goal)); }
    catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };
  return { q, data: q.data, setGoal, saving };
}

const TXT = {
  en: {
    title: "Your AI skill map", sub: "Pick what you want to understand. Shikshak routes you there, skipping what you've mastered.",
    goal: "Your goal", search: "Search a concept, or type any new AI topic…", add: "Add “{t}” to the map", adding: "Placing it on the map…",
    route: "Your route", steps: "{n} steps to go", done: "You've mastered everything on this route.", clear: "Clear goal",
    next: "Up next", practice: "Practise again", started: "In progress", start: "Start", mastered: "mastered",
    legend: ["Mastered", "Needs practice", "Started", "On your route"], hint: "Click any concept to make it your goal.",
    added: "Added to the map", custom: "new", recap: "Quick recap", course: "Learn AI from zero",
  },
  hi: {
    title: "आपका AI स्किल मैप", sub: "चुनिए आप क्या समझना चाहते हैं। शिक्षक वहाँ तक का रास्ता बनाता है, जो आप जानते हैं उसे छोड़कर।",
    goal: "आपका लक्ष्य", search: "कोई अवधारणा खोजें, या कोई नया AI विषय लिखें…", add: "“{t}” को मैप में जोड़ें", adding: "मैप में जोड़ा जा रहा है…",
    route: "आपका रास्ता", steps: "{n} कदम बाकी", done: "इस रास्ते की हर चीज़ में आपको महारत है।", clear: "लक्ष्य हटाएँ",
    next: "अगला", practice: "फिर अभ्यास करें", started: "जारी", start: "शुरू करें", mastered: "महारत",
    legend: ["महारत", "अभ्यास चाहिए", "शुरू किया", "आपके रास्ते पर"], hint: "किसी भी अवधारणा पर क्लिक करके उसे लक्ष्य बनाइए।",
    added: "मैप में जोड़ा गया", custom: "नया", recap: "जल्दी दोहराएँ", course: "शुरू से AI सीखें",
  },
};

export function SkillMap() {
  const { lang, n } = useI18n();
  const tx = TXT[lang === "hi" ? "hi" : "en"];
  const qc = useQueryClient();
  const { q, data, setGoal: saveGoal, saving } = useSkillGoal();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const setGoal = (g: string | null) => { setQuery(""); void saveGoal(g); };
  const byId = useMemo(() => new Map((data?.concepts ?? []).map((c) => [c.id, c])), [data]);
  const onRoute = useMemo(() => new Set((data?.route ?? []).map((s) => s.id)), [data]);
  const hoverPre = useMemo(() => new Set(hover ? byId.get(hover)?.prereqs ?? [] : []), [hover, byId]);

  const term = query.trim().toLowerCase();
  const matches = term ? (data?.concepts ?? []).filter((c) => c.title.toLowerCase().includes(term)).slice(0, 6) : [];
  const exact = matches.some((c) => c.title.toLowerCase() === term);

  const addTopic = async () => {
    setAdding(true);
    try {
      const c = await api.addSkillConcept(query.trim());
      if (!c.existing) toast.success(tx.added);
      await qc.invalidateQueries({ queryKey: ["skill-map"] });
      await saveGoal(c.id);
      setQuery("");
}
