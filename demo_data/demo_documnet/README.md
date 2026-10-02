# Demo document — testing RAG grounding

**Files** (same content, two formats — try both):

- `Class9_Force_and_Laws_of_Motion.pdf` — 3 pages, school study-notes layout
- `Class9_Force_and_Laws_of_Motion.docx` — the same chapter as a Word file

The chapter has 6 numbered sections (9.1–9.6) plus a revision list.

## How to test

1. **New lesson** → upload the PDF → keep the topic empty (or type "Newton's laws").
2. The upload should say **8 sections indexed**, with key terms like *momentum, inertia, force*.
3. Generate the plan. The concepts should follow the chapter: balanced forces, inertia, momentum, the second law, the third law, conservation of momentum.
4. Start the lesson. The **source panel** should name the file, the **page** and the **section** (e.g. "page 2 · 9.4 Second Law of Motion").

## Proof it came from YOUR document

These details are **made up** for this chapter. A model can't know them from general knowledge, so if they show up in the plan, script, notes or questions, the lesson really is grounded in the upload:

| Look for | Where it is in the document |
|---|---|
| **Aarav and Meher** pulling a block with **12 N** and **18 N** spring balances (net **6 N**) | 9.1, page 1 |
| **Pune city bus**, the **one-rupee coin** on a playing card | 9.2, page 1 |
| **Riya's** cricket ball, **160 g** at **25 m/s** → **4 kg m/s** | 9.3, page 2 |
| **Ramesh bhaiya's** hand trolley, **40 kg**, **60 N** → **1.5 m/s²** | 9.4, page 2 |
| **Kabir** on a skateboard pulling a rope; a sailor jumping onto the **ghat** | 9.5, page 2 |
| **Toy gun** 1.2 kg, **20 g** pellet at **30 m/s** → recoil **0.5 m/s** | 9.6, page 3 |
| **Greenfield Public School, Pune** | title, page 1 |

**Negative check:** start a lesson with the same PDF but the topic *"Photosynthesis"*. The document doesn't cover it, so the classroom should say **"No matching document context — teaching this concept from general knowledge"** and show no citation.

---

# AI demo document (matches the "Learning AI" problem statement)

**Files:** `AI_Unit2_How_Machines_Learn.pdf` (3 pages) and `.docx`, which have the same content: 6 sections (2.1–2.6) plus a revision list.

**Test:** New lesson → upload the PDF → topic empty (or "How machines learn"). Concepts should follow: features & labels, loss, gradient descent, overfitting, neural networks, attention.

| Look for (made-up, so it proves grounding) | Where |
|---|---|
| **Meera's** mango dataset, **240 mangoes**, colour score **1–10** | 2.1, page 1 |
| **Kiran's** flat in **Indiranagar**, predicted **Rs 82 lakh**, sold **Rs 90 lakh** → squared error **64** | 2.2, page 1 |
| **Arjun** on **Nandi Hills** in fog; weight **4.0**, gradient **2.5**, LR **0.2** → **3.5** | 2.3, page 2 |
| **MangoNet-7**: **99%** train vs **61%** test; **Tanvi** memorising papers | 2.4, page 2 |
| Inputs **(2, 1, 3)**, weights **(0.5, −1, 0.25)**, bias **0.5** → **1.25** | 2.5, page 3 |
| "bank" pays **0.71** attention to **"Kaveri"** | 2.6, page 3 |
| **Brightpath AI Academy, Bengaluru** | title, page 1 |

**Negative check:** same PDF, topic *"Reinforcement learning"*. It isn't covered, so the lesson should say no matching document context and show no citation.
