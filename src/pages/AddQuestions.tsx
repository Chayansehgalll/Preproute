import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

type Question = {
  id?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: string;
  explanation: string;
  difficulty: string;
  topic: string;
  sub_topic: string;
  media_url: string;
};

const emptyQ: Question = {
  question: "",
  option1: "",
  option2: "",
  option3: "",
  option4: "",
  correct_option: "option1",
  explanation: "",
  difficulty: "medium",
  topic: "",
  sub_topic: "",
  media_url: "",
};

export default function AddQuestions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [subTopics, setSubTopics] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question>(emptyQ);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const questionRef = useRef<HTMLTextAreaElement | null>(null);
  const explanationRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getTest(id).then((r: any) => {
      setTest(r.data);
      return r.data;
    }).then((t: any) => {
      if (t?.subject) {
        api.getTopics(t.subject).then((r: any) => setTopics(r?.data || []));
        if (t.topics?.length) {
          api.getSubTopicsByTopics(t.topics).then((r: any) => setSubTopics(r?.data || []));
        }
      }
    });
    api.getQuestionsByTest(id).then((r: any) => setQuestions(r?.data || []));
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const applyFormat = (field: "question" | "explanation", before: string, after = before) => {
    const ref = field === "question" ? questionRef.current : explanationRef.current;
    const value = current[field] || "";
    const start = ref?.selectionStart ?? value.length;
    const end = ref?.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || "text";
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setCurrent({ ...current, [field]: next });
    requestAnimationFrame(() => {
      ref?.focus();
      ref?.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const handleImageUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors({ media: "Please upload an image file" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCurrent({ ...current, media_url: String(reader.result || "") });
      setErrors((prev) => ({ ...prev, media: "" }));
      showToast("Image added to question");
    };
    reader.readAsDataURL(file);
  };

  const handleCsvUpload = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseQuestionsCsv(text).map((q: Question) => ({
        ...q,
        difficulty: q.difficulty || "medium",
      }));
      if (imported.length === 0) {
        setErrors({ csv: "CSV has no valid question rows" });
        return;
      }
      setQuestions((prev) => [...prev, ...imported]);
      setErrors((prev) => ({ ...prev, csv: "" }));
      showToast(`${imported.length} questions imported from CSV`);
    } catch (err: any) {
      setErrors({ csv: err.message || "Unable to read CSV file" });
    }
  };

  const downloadCsvTemplate = () => {
    const csv = [
      "question,option1,option2,option3,option4,correct_option,explanation,difficulty,topic,sub_topic,media_url",
      '"What is 2 + 2?","3","4","5","6","option2","Basic addition","easy","","",""',
      '"Which planet is known as the Red Planet?","Earth","Mars","Jupiter","Venus","option2","Mars is called the Red Planet","medium","","","https://example.com/mars.png"',
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preproute-questions-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateQ = (q: Question) => {
    const e: Record<string, string> = {};
    if (!q.question.trim()) e.question = "Question text is required";
    if (!q.option1.trim() || !q.option2.trim() || !q.option3.trim() || !q.option4.trim()) e.options = "All 4 options are required";
    if (!q.correct_option) e.correct = "Please select the correct option";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addOrUpdate = () => {
    if (!validateQ(current)) return;
    if (editingIdx !== null) {
      const updated = [...questions];
      updated[editingIdx] = { ...current, id: updated[editingIdx].id };
      setQuestions(updated);
      setEditingIdx(null);
      showToast("Question updated");
    } else {
      setQuestions([...questions, { ...current }]);
      showToast("Question added");
    }
    setCurrent(emptyQ);
    setErrors({});
  };

  const editQ = (idx: number) => {
    setCurrent({ ...questions[idx] });
    setEditingIdx(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setCurrent(emptyQ);
    setErrors({});
  };

  const deleteQ = (idx: number) => {
    if (!confirm("Delete this question?")) return;
    const q = questions[idx];
    if (q.id) api.deleteQuestion(q.id);
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const saveAndContinue = async () => {
    if (questions.length === 0) {
      setErrors({ _: "Please add at least one question" });
      return;
    }

    try {
      const newQs = questions
        .filter((q) => !q.id)
        .map((q) => ({
          test_id: id!,
          subject: test.subject, // Automatically maps the parent test's subject UUID
          type: "mcq", // Passes the question type string expected by the database
          question: q.question.trim(),
          option1: q.option1.trim(),
          option2: q.option2.trim(),
          option3: q.option3.trim(),
          option4: q.option4.trim(),
          correct_option: q.correct_option,
          explanation: q.explanation.trim() || "",
          difficulty: q.difficulty === "hard" ? "difficult" : q.difficulty,
          
          // Use fallback empty strings instead of nulls to pass validation checks
          topic: q.topic || "",
          sub_topic: q.sub_topic || "",
          media_url: q.media_url || "",
        }));

      if (newQs.length > 0) {
        await api.bulkCreateQuestions(id!, newQs);
      }
      
      await api.updateTest(id!, { total_questions: questions.length });
      navigate(`/tests/${id}/preview`);
    } catch (err: any) {
      setErrors({ _: err.message || "Failed to save questions to database." });
    }
  };

  if (!test) {
    return <div className="p-8 text-slate-500 text-center">Loading test...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate(`/test-creation/${id}`)} className="text-slate-500 hover:text-slate-700 text-sm mb-3 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Test Settings
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Add Questions</h1>
        <p className="text-slate-500 text-sm mt-1">Build the question bank for your test.</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-indigo-700 font-semibold mb-1">Test Details</div>
            <h2 className="text-lg font-bold text-slate-800">{test.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <Pill>{test.subject_name || test.subject}</Pill>
              <Pill>{(test.topics_names || []).join(", ") || "—"}</Pill>
              <Pill>{test.total_time} min</Pill>
              <Pill>{test.total_marks} marks</Pill>
              <Pill>{questions.length}/{test.total_questions || "?"} Qs</Pill>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Added</div>
            <div className="text-3xl font-bold text-indigo-700">{questions.length}</div>
            <div className="text-xs text-slate-500">questions</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-800">Upload Questions Through CSV</h3>
          <p className="text-sm text-slate-500 mt-1">
            Import MCQs in bulk using columns: question, option1, option2, option3, option4, correct_option, explanation, difficulty, topic, sub_topic, media_url.
          </p>
          {errors.csv && <div className="text-xs text-red-500 mt-2">{errors.csv}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={downloadCsvTemplate}
            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
          >
            Download Template
          </button>
          <label className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer shadow-sm">
            Upload CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                handleCsvUpload(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">
            {editingIdx !== null ? `Edit Question #${editingIdx + 1}` : `Add Question #${questions.length + 1}`}
          </h3>
          {editingIdx !== null && (
            <button onClick={cancelEdit} className="text-xs text-rose-600 hover:underline">Cancel edit</button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question <span className="text-red-500">*</span></label>
            <FormattingBar
              onBold={() => applyFormat("question", "**")}
              onItalic={() => applyFormat("question", "*")}
              onUnderline={() => applyFormat("question", "<u>", "</u>")}
              onCode={() => applyFormat("question", "`")}
              onList={() => applyFormat("question", "\n- ", "")}
            />
            <textarea
              ref={questionRef}
              value={current.question}
              onChange={(e) => setCurrent({ ...current, question: e.target.value })}
              rows={3}
              placeholder="Type your question here..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.question && <div className="text-xs text-red-500 mt-1">{errors.question}</div>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["option1", "option2", "option3", "option4"].map((opt, i) => (
              <div key={opt} className="flex items-center gap-2">
                <label className="flex items-center gap-2 flex-1 border border-slate-200 rounded-lg px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="correct"
                    checked={current.correct_option === opt}
                    onChange={() => setCurrent({ ...current, correct_option: opt })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-500 w-12">Option {i + 1}</span>
                  <input
                    value={(current as any)[opt]}
                    onChange={(e) => setCurrent({ ...current, [opt]: e.target.value })}
                    placeholder="Type option here..."
                    className="flex-1 bg-transparent focus:outline-none text-sm"
                  />
                </label>
              </div>
            ))}
          </div>
          {errors.options && <div className="text-xs text-red-500">{errors.options}</div>}
          {errors.correct && <div className="text-xs text-red-500">{errors.correct}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Explanation <span className="text-slate-400 text-xs">(optional)</span></label>
            <FormattingBar
              compact
              onBold={() => applyFormat("explanation", "**")}
              onItalic={() => applyFormat("explanation", "*")}
              onUnderline={() => applyFormat("explanation", "<u>", "</u>")}
              onCode={() => applyFormat("explanation", "`")}
              onList={() => applyFormat("explanation", "\n- ", "")}
            />
            <textarea
              ref={explanationRef}
              value={current.explanation}
              onChange={(e) => setCurrent({ ...current, explanation: e.target.value })}
              rows={2}
              placeholder="Explain why this is the correct answer..."
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
              <select
                value={current.difficulty}
                onChange={(e) => setCurrent({ ...current, difficulty: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
              <select
                value={current.topic}
                onChange={(e) => setCurrent({ ...current, topic: e.target.value, sub_topic: "" })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select topic</option>
                {topics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sub-topic</label>
              <select
                value={current.sub_topic}
                onChange={(e) => setCurrent({ ...current, sub_topic: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select sub-topic</option>
                {subTopics.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Media URL <span className="text-slate-400 text-xs">(optional)</span></label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={current.media_url}
                onChange={(e) => setCurrent({ ...current, media_url: e.target.value })}
                placeholder="https://... or upload image"
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <label className="px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer text-center">
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleImageUpload(e.target.files?.[0]);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {errors.media && <div className="text-xs text-red-500 mt-1">{errors.media}</div>}
            {current.media_url && (
              <div className="mt-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="text-xs text-slate-500 mb-2">Image preview</div>
                <img src={current.media_url} alt="Question media preview" className="max-h-44 rounded-md object-contain bg-white border border-slate-100" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={addOrUpdate}
              className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-100 transition border border-indigo-200"
            >
              + {editingIdx !== null ? "Update" : "Add Another Question"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Added Questions ({questions.length})</h3>
        </div>
        {questions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No questions added yet. Add at least 1 question to proceed.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {questions.map((q, i) => (
              <div key={i} className="p-5 hover:bg-slate-50/50 flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-medium text-sm">{q.question}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                    {[q.option1, q.option2, q.option3, q.option4].map((opt, j) => {
                      const key = `option${j + 1}`;
                      const correct = q.correct_option === key;
                      return (
                        <div key={j} className={`px-2 py-1 rounded border ${correct ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600"}`}>
                          {String.fromCharCode(65 + j)}. {opt} {correct && "✓"}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">{q.difficulty}</span>
                    {q.media_url && <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">Image added</span>}
                    {q.explanation && <span className="text-slate-500 italic truncate">Explanation: {q.explanation}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => editQ(i)} title="Edit" className="w-8 h-8 rounded-md text-amber-600 hover:bg-amber-50 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
                  </button>
                  <button onClick={() => deleteQ(i)} title="Delete" className="w-8 h-8 rounded-md text-rose-600 hover:bg-rose-50 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          {errors._ && <div className="flex-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 self-center">{errors._}</div>}
          <button onClick={() => navigate("/")} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button onClick={saveAndContinue} className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Save & Continue →</button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="px-2.5 py-1 bg-white/70 rounded-md border border-indigo-100 text-indigo-800">{children}</span>;
}

function FormattingBar({ onBold, onItalic, onUnderline, onCode, onList, compact }: any) {
  const buttons = [
    { label: "B", title: "Bold", onClick: onBold, className: "font-bold" },
    { label: "I", title: "Italic", onClick: onItalic, className: "italic" },
    { label: "U", title: "Underline", onClick: onUnderline, className: "underline" },
    { label: "<>", title: "Code", onClick: onCode, className: "font-mono" },
    { label: "List", title: "Bullet list", onClick: onList, className: "" },
  ];
  return (
    <div className={`mb-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 ${compact ? "scale-95 origin-left" : ""}`}>
      {buttons.map((button) => (
        <button key={button.title} type="button" title={button.title} onClick={button.onClick} className={`px-2.5 py-1 text-xs rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 ${button.className}`}>{button.label}</button>
      ))}
      <span className="px-2 text-[11px] text-slate-400 hidden sm:inline">Select text, then click a format.</span>
    </div>
  );
}

function parseQuestionsCsv(csv: string): Question[] {
  const rows = parseCsvRows(csv.trim());
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => normalizeHeader(h));
  const required = ["question", "option1", "option2", "option3", "option4", "correct_option"];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length > 0) throw new Error(`Missing required CSV columns: ${missing.join(", ")}`);

  return rows.slice(1).map((row, rowIndex) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => { record[header] = row[index]?.trim() || ""; });
    const question: Question = {
      question: record.question || "",
      option1: record.option1 || "",
      option2: record.option2 || "",
      option3: record.option3 || "",
      option4: record.option4 || "",
      correct_option: normalizeCorrectOption(record.correct_option),
      explanation: record.explanation || "",
      difficulty: normalizeDifficulty(record.difficulty),
      topic: record.topic || "",
      sub_topic: record.sub_topic || record.subtopic || "",
      media_url: record.media_url || record.media || "",
    };
    if (!question.question || !question.option1 || !question.option2 || !question.option3 || !question.option4) {
      throw new Error(`CSV row ${rowIndex + 2} is missing question/options data`);
    }
    return question;
  }).filter((q) => q.question);
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') { cell += '"'; i += 1; } else { inQuotes = !inQuotes; }
    } else if (char === "," && !inQuotes) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = []; cell = "";
    } else { cell += char; }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) { return value.trim().toLowerCase().replace(/[\s-]+/g, "_"); }
function normalizeCorrectOption(value: string) {
  const v = value.trim().toLowerCase();
  const map: Record<string, string> = { "1": "option1", a: "option1", option1: "option1", "2": "option2", b: "option2", option2: "option2", "3": "option3", c: "option3", option3: "option3", "4": "option4", d: "option4", option4: "option4" };
  return map[v] || "option1";
}
function normalizeDifficulty(value: string) {
  const v = value.trim().toLowerCase();
  if (["easy", "medium", "hard"].includes(v)) return v;
  if (v === "difficult") return "hard";
  return "medium";
}