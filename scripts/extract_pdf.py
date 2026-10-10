"""Extract MCQs + answer key from the Capgemini Round 2 Technical Module PDF.

Usage:  python -I scripts/extract_pdf.py <input.pdf> <output.json>
Needs:  pip install pdfplumber

Parsing is layout-driven (font + x position), not guesswork:
  * scenario text      -> Helvetica-Oblique, x ~ 66.7
  * question stem      -> Helvetica-Bold "Qn. ...", x ~ 56.7
  * option start       -> Helvetica-Bold "A) ...", x ~ 72.7
  * option wrap line   -> Helvetica, x ~ 72.7
  * answer key entry   -> "Qn. Answer: X — explanation", wraps at x ~ 62.7
Any line that does not fit one of these roles aborts the run, so nothing is
silently dropped.
"""
import json
import re
import sys

import pdfplumber

Q_RE = re.compile(r"^Q(\d+)\.\s+(.*)$")
OPT_RE = re.compile(r"^([A-D])\)\s+(.*)$")
ANS_RE = re.compile(r"^Q(\d+)\.\s+Answer:\s+([A-D])\s+—\s+(.*)$")
FOOTER_RE = re.compile(r"^Round 2: Technical Module — 200-Question Mock Test Page \d+ of \d+$")
SECTION_HDR = {
    "SECTION 1": 1,
    "SECTION 2": 2,
}
ANS_HDR_RE = re.compile(r"^Answer Key — Section (\d):\s*(.*)$")


def line_text(line):
    # The PDF draws "→" with the Symbol font; pdfplumber maps that code to "ﬁ".
    text = line["text"]
    if any(c["text"] == "ﬁ" and "Symbol" in c["fontname"] for c in line["chars"]):
        text = text.replace("ﬁ", "→")
    return text.strip()


def join(parts):
    s = ""
    for p in parts:
        if not s:
            s = p
        elif s.endswith("-") and not s.endswith(" -"):
            # hyphenated word split across lines, e.g. "AI-" + "generated"
            s += p
        else:
            s += " " + p
    return s


def main(pdf_path, out_path):
    sections = {}
    section_order = []
    cur_sec = None
    mode = None  # "questions" | "answers"
    pending_ctx = []
    q = None  # current question dict being built
    target = None  # list receiving wrap lines
    ans = None
    problems = []
    hyphen_joins = []

    def finish_q():
        nonlocal q
        if q:
            q["context"] = join(q.pop("_ctx"))
            q["question"] = join(q.pop("_stem"))
            q["options"] = [{"key": k, "text": join(v)} for k, v in q.pop("_opts")]
            sections[cur_sec]["questions"].append(q)
        q = None

    def finish_ans():
        nonlocal ans
        if ans:
            sec, num, letter, parts = ans
            sections[sec]["answers"][num] = {"answer": letter, "explanation": join(parts)}
        ans = None

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        for pno, page in enumerate(pdf.pages, start=1):
            if pno <= 2:  # exam-pattern cover page + title page
                continue
            lines = page.extract_text_lines(return_chars=True)
            i = 0
            while i < len(lines):
                ln = lines[i]
                text = line_text(ln)
                font = ln["chars"][0]["fontname"]
                x = ln["x0"]
                i += 1
                if FOOTER_RE.match(text):
                    continue
                if text.startswith("This mock test is a practice resource"):
                    continue
                if text in SECTION_HDR:
                    finish_q()
                    cur_sec = SECTION_HDR[text]
                    title = line_text(lines[i]); i += 1
                    meta = line_text(lines[i]); i += 1
                    sections[cur_sec] = {"id": cur_sec, "title": title, "meta": meta,
                                         "questions": [], "answers": {}}
                    section_order.append(cur_sec)
                    mode = "questions"
                    continue
                m = ANS_HDR_RE.match(text)
                if m:
                    finish_q(); finish_ans()
                    cur_sec = int(m.group(1))
                    if sections[cur_sec]["title"] != m.group(2):
                        problems.append(f"answer-key title mismatch for section {cur_sec}: {m.group(2)!r}")
                    mode = "answers"
                    continue

                if mode == "questions":
                    if "Oblique" in font and abs(x - 66.7) < 2:
                        if q and q["_opts"]:
                            finish_q()
                        pending_ctx.append(text)
                        continue
                    m = Q_RE.match(text)
                    if m and "Bold" in font and abs(x - 56.7) < 2:
                        finish_q()
                        q = {"number": int(m.group(1)), "_ctx": pending_ctx, "_stem": [m.group(2)], "_opts": [], "page": pno}
                        pending_ctx = []
                        target = q["_stem"]
                        continue
                    m = OPT_RE.match(text)
                    if m and q and abs(x - 72.7) < 2 and "Bold" in font:
                        q["_opts"].append((m.group(1), [m.group(2)]))
                        target = q["_opts"][-1][1]
                        continue
                    if q and target is not None and abs(x - 72.7) < 2 and "Bold" not in font:
                        if target[-1].endswith("-"):
                            hyphen_joins.append(f"S{cur_sec} Q{q['number']}: {target[-1]!r} + {text!r}")
                        target.append(text)
                        continue
                    problems.append(f"p{pno} unclassified question-line [{font} x={x:.1f}]: {text!r}")
                elif mode == "answers":
                    m = ANS_RE.match(text)
                    if m:
                        finish_ans()
                        ans = (cur_sec, int(m.group(1)), m.group(2), [m.group(3)])
                        continue
                    if ans and abs(x - 62.7) < 2:
                        if ans[3][-1].endswith("-"):
                            hyphen_joins.append(f"S{ans[0]} A{ans[1]}: {ans[3][-1]!r} + {text!r}")
                        ans[3].append(text)
                        continue
                    problems.append(f"p{pno} unclassified answer-line [{font} x={x:.1f}]: {text!r}")
                else:
                    problems.append(f"p{pno} line outside any section: {text!r}")
        finish_q(); finish_ans()

    # ---------- validation ----------
    report = {"pdf_pages": total_pages, "problems": problems, "hyphen_joins": hyphen_joins, "sections": []}
    out_subjects = []
    for sid in section_order:
        sec = sections[sid]
        qs = sec["questions"]
        nums = [x["number"] for x in qs]
        declared = int(re.match(r"(\d+) Questions", sec["meta"]).group(1))
        expected = list(range(1, len(qs) + 1))
        if nums != expected:
            problems.append(f"section {sid}: question numbering not contiguous: {nums}")
        if len(qs) != declared:
            problems.append(f"section {sid}: declared {declared} questions, extracted {len(qs)}")
        akeys = sorted(sec["answers"])
        if akeys != nums:
            missing = sorted(set(nums) - set(akeys)); extra = sorted(set(akeys) - set(nums))
            problems.append(f"section {sid}: answer key mismatch, missing={missing} extra={extra}")
        out_q = []
        for item in qs:
            keys = [o["key"] for o in item["options"]]
            if keys != ["A", "B", "C", "D"]:
                problems.append(f"section {sid} Q{item['number']}: options {keys}")
            if not item["context"]:
                problems.append(f"section {sid} Q{item['number']}: no scenario text")
            a = sec["answers"].get(item["number"])
            if a and a["answer"] not in keys:
                problems.append(f"section {sid} Q{item['number']}: answer {a['answer']} not among options")
            out_q.append({
                "id": f"s{sid}-q{item['number']}",
                "number": item["number"],
                "context": item["context"],
                "question": item["question"],
                "options": item["options"],
                "answer": a["answer"] if a else None,
                "explanation": a["explanation"] if a else None,
                "sourcePage": item["page"],
                "needsReview": a is None,
            })
        report["sections"].append({"id": sid, "title": sec["title"], "declared": declared,
                                   "extracted": len(qs), "answers": len(sec["answers"])})
        out_subjects.append({"id": f"s{sid}", "section": sid, "name": sec["title"],
                             "questions": out_q})

    data = {
        "title": "Capgemini Exceller — Round 2 Technical Module Mock Test",
        "source": "Section2_Technical_Module_200Q.pdf",
        "totalQuestions": sum(len(s["questions"]) for s in out_subjects),
        "subjects": out_subjects,
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
