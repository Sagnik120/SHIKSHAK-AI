"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Check, Play, RotateCcw, X } from "lucide-react";
import { useI18n } from "@/providers/i18n";
import { cn } from "@/lib/utils";

/* ── registry ──────────────────────────────────────────────────────────── */

export const LABS = [
  { id: "gd", en: "Gradient descent", hi: "ग्रेडिएंट डिसेंट", keys: ["gradient", "learning rate", "optimi", "ग्रेडिएंट"] },
  { id: "fit", en: "Overfitting", hi: "ओवरफ़िटिंग", keys: ["overfit", "underfit", "generali", "regulari", "ओवरफ़िट"] },
  { id: "neuron", en: "A neuron", hi: "न्यूरॉन", keys: ["neuron", "perceptron", "neural", "न्यूरॉन"] },
  { id: "attn", en: "Attention", hi: "अटेंशन", keys: ["attention", "transformer", "अटेंशन"] },
] as const;
export type LabId = (typeof LABS)[number]["id"];

/** Simulations relevant to some text (concept names, a lesson title). */
export function labsFor(text: string) {
  const low = (text || "").toLowerCase();
  return LABS.filter((l) => l.keys.some((k) => low.includes(k)));
}

export function Lab({ id }: { id: LabId }) {
  return id === "gd" ? <GradientLab /> : id === "fit" ? <FitLab /> : id === "neuron" ? <NeuronLab /> : <AttentionLab />;
}

/* ── shared predict → run → check frame ────────────────────────────────── */

function useHi() { const { lang } = useI18n(); return lang === "hi"; }

function Predict({ question, options, picked, onPick, verdict, explain }: {
  question: string; options: Array<{ id: string; label: string }>; picked: string | null; onPick: (id: string) => void;
  verdict: null | { right: boolean; answer: string }; explain: ReactNode;
}) {
  const hi = useHi();
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">{hi ? "पहले अनुमान लगाइए" : "Predict first"}</p>
      <p className="mt-1 font-medium text-ink">{question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} onClick={() => onPick(o.id)} disabled={!!verdict}
            className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors",
              picked === o.id ? "border-sky-500 bg-sky-50 font-medium text-ink" : "border-line text-ink-2 hover:border-sky-300",
              verdict && o.id === verdict.answer && "border-sage bg-sage-100 text-ink")}>
            {o.label}
          </button>
        ))}
      </div>
      {verdict && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className={cn("mt-3 flex gap-2 rounded-xl p-3 text-sm", verdict.right ? "bg-sage-100 text-ink" : "bg-marigold-100 text-ink")}>
          {verdict.right ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-marigold-600" />}
          <div>{verdict.right ? (hi ? "सही अनुमान! " : "Right prediction! ") : (hi ? "इस बार नहीं। " : "Not this time. ")}{explain}</div>
        </motion.div>
      )}
    </div>
  );
}

const W = 520, H = 240, PAD = 28;

/* ── 1. gradient descent on L(w) = (w - 3)² ────────────────────────────── */

type GdOutcome = "smooth" | "zigzag" | "diverge";
function gdOutcome(lr: number): GdOutcome {
  const r = Math.abs(1 - 2 * lr);           // each step multiplies the distance to the minimum by |1 − 2η|
  return r >= 1 ? "diverge" : lr > 0.5 ? "zigzag" : "smooth";
}

function GradientLab() {
  const hi = useHi();
  const [lr, setLr] = useState(0.3);
  const [pick, setPick] = useState<string | null>(null);
  const [steps, setSteps] = useState<number[] | null>(null);
  const x = (w: number) => PAD + ((w + 2) / 10) * (W - 2 * PAD);
  const y = (w: number) => H - PAD - (Math.min((w - 3) ** 2, 25) / 25) * (H - 2 * PAD);
  const curve = useMemo(() => Array.from({ length: 101 }, (_, i) => -2 + i / 10).map((w) => `${x(w)},${y(w)}`).join(" "), []);

  const run = () => {
    const ws = [-1];
    for (let i = 0; i < 12; i++) ws.push(ws[ws.length - 1] - lr * 2 * (ws[ws.length - 1] - 3));
    setSteps(ws.map((w) => Math.max(-2, Math.min(8, w))));
  };
  const reset = () => { setSteps(null); setPick(null); };
  const truth = gdOutcome(lr);
  const verdict = steps && pick ? { right: pick === truth, answer: truth } : null;

  return (
    <div className="space-y-4">
      <Predict
        question={hi ? `सीखने की दर η = ${lr.toFixed(2)} पर, w = −1 से शुरू करके, क्या होगा?` : `With learning rate η = ${lr.toFixed(2)}, starting at w = −1, what happens?`}
        options={[{ id: "smooth", label: hi ? "धीरे-धीरे न्यूनतम तक" : "Slides smoothly to the minimum" },
                  { id: "zigzag", label: hi ? "आगे-पीछे झूलकर पहुँचता है" : "Zig-zags but gets there" },
                  { id: "diverge", label: hi ? "कभी नहीं पहुँचता" : "Never settles (blows up)" }]}
        picked={pick} onPick={setPick} verdict={verdict}
        explain={hi ? <>हर कदम न्यूनतम से दूरी को |1 − 2η| = {Math.abs(1 - 2 * lr).toFixed(2)} से गुणा करता है। 1 से कम हो तो पहुँचता है; 0.5 से ऊपर η पर निशान पार करके झूलता है।</>
                    : <>Each step multiplies the distance to the minimum by |1 − 2η| = {Math.abs(1 - 2 * lr).toFixed(2)}. Below 1 it converges; with η above 0.5 it overshoots and zig-zags; at 1 or more it diverges.</>}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-2">η
          <input type="range" min={0.05} max={1.1} step={0.05} value={lr} disabled={!!steps} onChange={(e) => setLr(Number(e.target.value))} className="w-48 accent-[var(--sky-600)]" />
          <span className="w-10 font-mono text-ink">{lr.toFixed(2)}</span>
        </label>
        {!steps
          ? <button onClick={run} disabled={!pick} className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Play className="h-4 w-4" />{hi ? "चलाएँ" : "Run 12 steps"}</button>
          : <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm text-ink-2 hover:text-ink"><RotateCcw className="h-4 w-4" />{hi ? "फिर से" : "Try another η"}</button>}
        {!pick && !steps && <span className="text-xs text-ink-3">{hi ? "पहले अनुमान चुनें" : "Pick a prediction to run"}</span>}
}
