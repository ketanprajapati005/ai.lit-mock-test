# Capgemini MCQ Practice — Round 2 Technical Module

A React + Vite exam website built from `Section2_Technical_Module_200Q.pdf`.
It has 201 MCQs in 2 subjects, and the answer key and explanations come straight from the PDF.

| Subject (from the PDF)          | Questions | Max marks |
| ------------------------------- | --------: | --------: |
| Section 1 — AI Literacy         |       100 |       100 |
| Section 2 — Technical Assessment|       101 |       101 |
| **Total**                       |   **201** |   **201** |

## Features

- Home page with one card per subject plus an "All subjects" combined test
- One question at a time, radio-button options, Previous/Next (← → keys work too), and clear answer
- Navigator panel grouped by subject, with answered, unanswered and current states
- Progress bar, "Question X of N", answered and remaining counts
- Optional countdown timer that auto-submits at zero; without a limit, an elapsed-time clock shows
- Optional randomizing of question order and option order (both off by default)
- Progress saved in `localStorage`, so a refresh resumes the attempt, including the timer
- Submit asks for confirmation and warns about unanswered questions
- Results show:
  - score, percentage, accuracy, and correct/incorrect/unanswered counts
  - a subject-wise marks table with an overall total row
  - an answer review you can filter (All, Incorrect, Unanswered, Correct) that shows your answer, the correct answer, and the explanation from the PDF
- Practice-incorrect (or incorrect + unanswered) mode, Retake, Restart, and Quit
- Light and dark mode, and a responsive layout for phone, tablet and desktop

The answer key never appears on screen until you submit. (It is bundled into the JS file, so this is
a practice tool, not a secure exam.)

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # scoring + question-bank tests
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Deploy

`npm run build` produces a static site in `dist/` with relative asset paths, so it works on any static host or sub-path.

- **Netlify:** drag the `dist/` folder onto app.netlify.com/drop, or connect the repo with build command `npm run build` and publish directory `dist`.
- **Vercel:** `npx vercel`. It auto-detects Vite (build `npm run build`, output `dist`).
- **GitHub Pages:** push the repo, then deploy `dist/` (for example with the `peaceiris/actions-gh-pages` action, or `npx gh-pages -d dist`).

## Changing the marking scheme

Edit `src/config.js`:

```js
export const SCORING = { correct: 1, incorrect: -0.25, unanswered: 0 }; // negative marking
```

Percentage = marks obtained ÷ maximum marks × 100. With the default +1/0/0 this equals
correct ÷ total × 100. Accuracy = correct ÷ attempted × 100.

## Data

- `src/data/questions.json` holds the extracted questions and the verified answer key. For each question it stores
  `context` (the italic scenario line), `question`, `options[A–D]`, `answer`, `explanation`, and `sourcePage`
  (the page in the PDF viewer).
- `scripts/extract_pdf.py` regenerates the JSON from the PDF:
  `pip install pdfplumber && python -I scripts/extract_pdf.py <pdf> src/data/questions.json`.
  It sorts lines by font and position (scenario is italic, the question stem and option starts are bold,
  wrapped option text is plain), and it stops with an error on any line it can't classify. That way nothing is
  silently dropped.

## Verification report

| Check | Result |
| --- | --- |
| Questions extracted versus the section headers ("100 Questions", "101 Questions") | 100 / 101 ✔ |
| Question numbering is contiguous (1…100, 1…101) | ✔ |
| Every question has exactly options A–D | ✔ (201/201) |
| Answer-key entries per section | 100 / 101 ✔, one for each question number |
| Every keyed letter exists among that question's options | ✔ |
| Explanations | present for all 201 (taken from the PDF, none written by me) |
| Answer correctness | every key re-read against its question and its own explanation; 42 that a keyword-overlap script flagged were reviewed by hand, all consistent |
| Score logic | unit tests for correct, incorrect, unanswered, negative marking, and an empty attempt |
| End to end in a browser | navigation, persistence across reload, submit dialog, per-subject and overall table, review filters, practice-incorrect, retake, timer auto-submit, and a 100/100 run with questions and options both shuffled |

### Items that need your attention

1. **The title says 200 questions, but the PDF has 201.** The cover says "200 fully unique questions" and also
   "100 AI Literacy · 101 Technical Assessment". Section 2 really does contain Q1–Q101, and the answer key also
   has 101 entries. All 201 are included. Nothing was dropped to force the count to 200.
2. **Arrow glyphs were fixed in 2 explanations.** The PDF draws "→" in the Symbol font, and the text layer
   decodes it as "ﬁ". This was corrected in the explanations for AI Literacy Q53 ("draft → critique → revise")
   and Technical Assessment Q35 ("left subtree → node → right subtree").
3. **Sub-topics are not tagged per question.** The cover page lists Section 1 topics (AI Foundations, Prompt
   Engineering, Advanced AI Systems, Responsible AI) and Section 2 topics (Programming Logic, DSA, Software
   Engineering, Modern Engineering Awareness). The PDF does not label which question belongs to which topic,
   so the app uses only the two sections as subjects. If you want topic-level subjects, tell me the question ranges.

No question or answer key was missing, unclear or mismatched, so `needsReview` is `false` for every question.
