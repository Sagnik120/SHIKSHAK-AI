"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Circle, Lightbulb, Loader2, Lock, Play, RotateCcw, Sparkles, Trophy, X } from "lucide-react";
import { useI18n } from "@/providers/i18n";
import { cn, EASE } from "@/lib/utils";

/* ── challenges: ~80% given, the learner writes the key lines ─────────── */

type Test = { call: string; expect: string; hidden?: boolean };
type Challenge = { id: string; title: string; hi: string; concept: string; brief: string; prefix: string; blank: string; suffix: string; hint: string; why: string; tests: Test[] };

export const CHALLENGES: Challenge[] = [
  {
    id: "neuron", title: "A single neuron", hi: "एक न्यूरॉन", concept: "Perceptron",
    brief: "Multiply each input by its weight, add the bias, and fire (return 1) only if the total is above 0.",
    prefix: "def neuron(inputs, weights, bias):\n    total = bias\n    for x, w in zip(inputs, weights):\n",
    blank: "        # add x * w to total\n        \n", suffix: "    return 1 if total > 0 else 0\n",
    hint: "total += x * w", why: "This weighted sum + threshold is exactly what every neuron in a neural network computes.",
    tests: [{ call: "neuron([1, 1], [0.5, 0.5], -0.7)", expect: "1" }, { call: "neuron([1, 0], [0.5, 0.5], -0.7)", expect: "0" }, { call: "neuron([0, 0], [1, 1], 0.1)", expect: "1" }, { call: "neuron([2, 3], [-1, 1], -2)", expect: "0" }, { call: "neuron([1, 1, 1], [1, 1, 1], -3)", expect: "0", hidden: true }, { call: "neuron([], [], 0.5)", expect: "1", hidden: true }],
  },
  {
    id: "mse", title: "Mean squared error", hi: "मीन स्क्वेयर्ड एरर", concept: "Loss functions",
    brief: "Return the average of the squared differences between true values and predictions.",
    prefix: "def mse(y_true, y_pred):\n    total = 0\n    for t, p in zip(y_true, y_pred):\n",
    blank: "        # add the squared error\n        \n    # return the mean\n    \n", suffix: "",
    hint: "total += (t - p) ** 2   then   return total / len(y_true)", why: "MSE punishes big mistakes more than small ones because the error is squared.",
    tests: [{ call: "mse([1, 2, 3], [1, 2, 3])", expect: "0" }, { call: "mse([1, 2], [1, 4])", expect: "2.0" }, { call: "mse([0, 0, 0, 0], [1, -1, 1, -1])", expect: "1.0" }, { call: "mse([3], [0])", expect: "9" }, { call: "mse([2.5, -1], [0.5, 1])", expect: "4.0", hidden: true }, { call: "mse([10] * 5, [0] * 5)", expect: "100", hidden: true }],
  },
  {
    id: "accuracy", title: "Accuracy", hi: "एक्यूरेसी", concept: "Model evaluation",
    brief: "Count how many predictions match the labels and return the fraction that are correct.",
    prefix: "def accuracy(labels, preds):\n", blank: "    correct = 0\n    # count matches\n    \n", suffix: "    return correct / len(labels)\n",
    hint: "for l, p in zip(labels, preds):\n        if l == p: correct += 1", why: "Accuracy is the simplest metric, but on imbalanced data it can look great while the model is useless.",
    tests: [{ call: "accuracy([1, 0, 1, 1], [1, 0, 0, 1])", expect: "0.75" }, { call: "accuracy(['cat', 'dog'], ['cat', 'dog'])", expect: "1.0" }, { call: "accuracy([0, 0, 0], [1, 1, 1])", expect: "0.0" }, { call: "accuracy([1], [1])", expect: "1.0", hidden: true }, { call: "accuracy([1, 2, 3, 4, 5], [1, 0, 3, 0, 5])", expect: "0.6", hidden: true }],
  },
  {
    id: "gd", title: "One gradient descent step", hi: "ग्रेडिएंट डिसेंट का एक कदम", concept: "Optimisation",
    brief: "Loss is L(w) = (w − 3)². Its gradient is 2(w − 3). Move w against the gradient, scaled by the learning rate.",
    prefix: "def step(w, lr):\n    grad = 2 * (w - 3)\n", blank: "    # return the updated w\n    \n", suffix: "",
    hint: "return w - lr * grad", why: "Repeat this step and w slides down to 3, the minimum. Too big an lr and it overshoots (try the simulation!).",
    tests: [{ call: "step(5, 0.1)", expect: "4.6" }, { call: "step(3, 0.5)", expect: "3" }, { call: "step(-1, 0.25)", expect: "1.0" }, { call: "step(0, 0.5)", expect: "3.0" }, { call: "step(3.5, 1.0)", expect: "2.5", hidden: true }, { call: "step(100, 0)", expect: "100", hidden: true }],
  },
  {
    id: "dist", title: "Distance for k-NN", hi: "k-NN के लिए दूरी", concept: "Nearest neighbours",
    brief: "Return the Euclidean distance between two points a and b of any dimension.",
    prefix: "import math\n\ndef distance(a, b):\n    total = 0\n", blank: "    # sum the squared differences\n    \n    \n", suffix: "    return math.sqrt(total)\n",
    hint: "for x, y in zip(a, b):\n        total += (x - y) ** 2", why: "k-NN classifies a point by the labels of the points closest to it, and this is what 'closest' means.",
    tests: [{ call: "distance([0, 0], [3, 4])", expect: "5" }, { call: "distance([1, 1, 1], [1, 1, 1])", expect: "0" }, { call: "distance([1], [-2])", expect: "3" }, { call: "distance([-1, -1], [2, 3])", expect: "5", hidden: true }, { call: "distance([0, 0, 0, 0], [1, 1, 1, 1])", expect: "2", hidden: true }],
  },
  {
    id: "softmax", title: "Softmax", hi: "सॉफ़्टमैक्स", concept: "Probabilities",
    brief: "Turn scores into probabilities: exponentiate each score, then divide by the total so they sum to 1.",
    prefix: "import math\n\ndef softmax(scores):\n    exps = [math.exp(s) for s in scores]\n", blank: "    # total, then divide each exp by it\n    \n    \n", suffix: "",
    hint: "total = sum(exps)\n    return [e / total for e in exps]", why: "Softmax is how a classifier (and attention!) turns raw scores into a probability distribution.",
    tests: [{ call: "softmax([0, 0])", expect: "[0.5, 0.5]" }, { call: "round(sum(softmax([1, 2, 3])), 6)", expect: "1.0" }, { call: "softmax([1, 2, 3]).index(max(softmax([1, 2, 3])))", expect: "2" }, { call: "softmax([math.log(1), math.log(3)])", expect: "[0.25, 0.75]" }, { call: "softmax([-2, -2, -2, -2])", expect: "[0.25, 0.25, 0.25, 0.25]", hidden: true }, { call: "softmax([5])", expect: "[1.0]", hidden: true }],
  },
];

/* ── pyodide, loaded once on first run ─────────────────────────────────── */

type Py = { runPython: (code: string) => unknown; globals: { get: (k: string) => unknown } };
let pyPromise: Promise<Py> | null = null;
function loadPy(): Promise<Py> {
  if (pyPromise) return pyPromise;
  const base = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  pyPromise = new Promise<Py>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${base}pyodide.js`;
    s.onload = () => (window as unknown as { loadPyodide: (o: object) => Promise<Py> }).loadPyodide({ indexURL: base }).then(resolve, reject);
    s.onerror = () => reject(new Error("Could not load the Python runtime."));
    document.head.appendChild(s);
  }).catch((e) => { pyPromise = null; throw e; });
  return pyPromise;
}

// Runs one test in a fresh namespace; returns [passed, shown value].
const HARNESS = `
def _close(a, b):
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(_close(x, y) for x, y in zip(a, b))
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
        return abs(a - b) < 1e-6
    return a == b

def _run(src, call, expect):
    ns = {}
    try:
        exec(src, ns)
        got = eval(call, ns)
    except Exception as e:
        return [False, type(e).__name__ + ": " + str(e)]
    return [_close(got, eval(expect)), repr(got)]
`;

const STORE = "shikshak.codeSolved";
const readSolved = (): string[] => { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { return []; } };
const writeSolved = (v: string[]) => { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* storage blocked */ } };

}
