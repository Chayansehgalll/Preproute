import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!id) return;
    api.getTest(id).then((r: any) => {
      setTest(r.data);
      return r.data;
    }).then((t: any) => {
      if (t?.subject) {
        api.getTopics(t.subject).then((r: any) => setTopics(r.data));
        if (t.topics?.length) {
          api.getSubTopicsByTopics(t.topics).then((r: any) => setSubTopics(r.data));
        }
      }
    });
    api.getQuestionsByTest(id).then((r: any) => setQuestions(r.data));
  }, [id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
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
    const newQs = questions.filter((q) => !q.id);
    if (newQs.length > 0) {
      await api.bulkCreateQuestions(id!, newQs);
    }
    // Update total_questions on test
    await api.updateTest(id!, { total_questions: questions.length });
    navigate(`/tests/${id}/preview`);
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

      {/* Test summary card */}
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

      {/* Question Form */}
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
            <textarea
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
            <textarea
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
            <input
              value={current.media_url}
              onChange={(e) => setCurrent({ ...current, media_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={addOrUpdate}
              className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-medium text-sm rounded-lg hover:bg-indigo-100 transition border border-indigo-200"
            >
              + {editingIdx !== null ? "Update" : "Add Another Question"}
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
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
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={saveAndContinue}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            Save & Continue →
          </button>
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
