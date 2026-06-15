import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { addNotification } from "../services/notification";

type TestData = {
  name: string;
  type: string;
  subject: string;
  topics: string[];
  sub_topics: string[];
  difficulty: string;
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  total_time: number;
  total_marks: number;
  total_questions: number;
  status?: string;
};

const emptyTest: TestData = {
  name: "",
  type: "practice",
  subject: "",
  topics: [],
  sub_topics: [],
  difficulty: "easy",
  correct_marks: 4,
  wrong_marks: -1,
  unattempt_marks: 0,
  total_time: 60,
  total_marks: 100,
  total_questions: 25,
};

export default function TestCreation() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEdit = !!editId;
  const [test, setTest] = useState<TestData>(emptyTest);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subTopics, setSubTopics] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    api.getSubjects().then((r: any) => setSubjects(r.data));
  }, []);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setLoading(true);
    api
      .getTest(editId)
      .then((r: any) => {
        if (cancelled || !r?.data) return;
        const t = r.data;
        setTest({
          name: t.name ?? "",
          type: t.type ?? "practice",
          subject: t.subject ?? "",
          topics: Array.isArray(t.topics) ? t.topics : [],
          sub_topics: Array.isArray(t.sub_topics) ? t.sub_topics : [],
          difficulty: t.difficulty ?? "easy",
          correct_marks: t.correct_marks ?? 4,
          wrong_marks: t.wrong_marks ?? -1,
          unattempt_marks: t.unattempt_marks ?? 0,
          total_time: t.total_time ?? 60,
          total_marks: t.total_marks ?? 100,
          total_questions: t.total_questions ?? 25,
        });
      })
      .catch((err) => {
        setErrors({ _: err.message || "Failed to load test" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  useEffect(() => {
    if (!test.subject) {
      setTopics([]);
      setSubTopics([]);
      return;
    }
    api.getTopics(test.subject).then((r: any) => setTopics(r.data));
  }, [test.subject]);

  useEffect(() => {
    if (test.topics.length === 0) {
      setSubTopics([]);
      return;
    }
    api.getSubTopicsByTopics(test.topics).then((r: any) => setSubTopics(r.data));
  }, [test.topics]);

  const update = (k: keyof TestData, v: any) => setTest((prev) => ({ ...prev, [k]: v }));

  const toggleTopic = (topicId: string) => {
    setTest((prev) => {
      const exists = prev.topics.includes(topicId);
      const newTopics = exists ? prev.topics.filter((t) => t !== topicId) : [...prev.topics, topicId];
      const validSubTopics = subTopics.filter((st: any) => newTopics.includes(st.topic_id)).map((s: any) => s.id);
      return { ...prev, topics: newTopics, sub_topics: prev.sub_topics.filter((x) => validSubTopics.includes(x)) };
    });
  };

  const toggleSubTopic = (id: string) => {
    setTest((prev) => ({
      ...prev,
      sub_topics: prev.sub_topics.includes(id) ? prev.sub_topics.filter((x) => x !== id) : [...prev.sub_topics, id],
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!test.name.trim()) e.name = "Test name is required";
    if (!test.subject) e.subject = "Please select a subject";
    if (!test.total_time || test.total_time <= 0) e.total_time = "Enter valid duration";
    if (!test.total_marks || test.total_marks <= 0) e.total_marks = "Enter valid total marks";
    if (!test.total_questions || test.total_questions <= 0) e.total_questions = "Enter valid questions count";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (redirectToQuestions: boolean) => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && editId) {
        await api.updateTest(editId, { ...test, status: test.status ?? "draft" });
        if (redirectToQuestions) {
          navigate(`/tests/${editId}/questions`);
          return;
        }
        addNotification({
          type: "success",
          title: "Test updated",
          message: `${test.name} changes were saved successfully.`,
        });
        navigate("/?notifications=1");
      } else {
        const res = await api.createTest({ ...test, status: null });
        if (redirectToQuestions) {
          navigate(`/tests/${res.data.id}/questions`);
          return;
        }
        addNotification({
          type: "success",
          title: "Test added",
          message: `${test.name} was saved as a draft.`,
        });
        navigate("/?notifications=1");
      }
    } catch (err: any) {
      setErrors({ _: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(""), 2500);
    }
  };

  const increment = (k: "correct_marks" | "wrong_marks" | "unattempt_marks", by: number) => {
    setTest((prev) => ({ ...prev, [k]: Number(prev[k]) + by }));
  };

  if (isEdit && loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-slate-500 text-sm">
        Loading test details...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEdit ? "Edit Test" : "Create New Test"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isEdit
            ? "Update the test settings. Your changes will be saved."
            : "Configure your test settings. You can add questions after this step."}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 inline-flex gap-1">
        {[
          { k: "practice", l: "Chapter Wise" },
          { k: "pyq", l: "PYQ" },
          { k: "mock", l: "Mock Test" },
        ].map((opt) => (
          <button
            key={opt.k}
            onClick={() => update("type", opt.k)}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              test.type === opt.k
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Subject" required error={errors.subject}>
            <select
              value={test.subject}
              onChange={(e) => update("subject", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white ${
                errors.subject ? "border-red-300" : "border-slate-200"
              }`}
            >
              <option value="">Choose from Drop-down</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Name of Test" required error={errors.name}>
            <input
              value={test.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Enter name of Test"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? "border-red-300" : "border-slate-200"
              }`}
            />
          </Field>

          <Field label="Topic" required>
            <MultiSelect
              placeholder="Choose topics"
              options={topics.map((t) => ({ value: t.id, label: t.name }))}
              selected={test.topics}
              onToggle={toggleTopic}
            />
          </Field>

          <Field label="Sub Topic">
            <MultiSelect
              placeholder="Choose sub-topics"
              options={subTopics.map((s) => ({ value: s.id, label: s.name }))}
              selected={test.sub_topics}
              onToggle={toggleSubTopic}
            />
          </Field>

          <Field label="Duration (Minutes)" required error={errors.total_time}>
            <input
              type="number"
              value={test.total_time}
              onChange={(e) => update("total_time", Number(e.target.value))}
              placeholder="Enter the time"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.total_time ? "border-red-300" : "border-slate-200"
              }`}
            />
          </Field>

          <Field label="Test Difficulty Level">
            <div className="flex items-center gap-6 py-2">
              {[
                { v: "easy", label: "Easy" },
                { v: "medium", label: "Medium" },
                { v: "hard", label: "Difficult" },
              ].map((opt) => (
                <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    checked={test.difficulty === opt.v}
                    onChange={() => update("difficulty", opt.v)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-slate-800 mb-3">Marking Scheme</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <NumberInput
              label="Wrong Answer"
              value={test.wrong_marks}
              onChange={(v: number) => update("wrong_marks", v)}
              onInc={() => increment("wrong_marks", 1)}
              onDec={() => increment("wrong_marks", -1)}
            />
            <NumberInput
              label="Unattempted"
              value={test.unattempt_marks}
              onChange={(v: number) => update("unattempt_marks", v)}
              onInc={() => increment("unattempt_marks", 1)}
              onDec={() => increment("unattempt_marks", -1)}
            />
            <NumberInput
              label="Correct Answer"
              value={test.correct_marks}
              onChange={(v: number) => update("correct_marks", v)}
              onInc={() => increment("correct_marks", 1)}
              onDec={() => increment("correct_marks", -1)}
              positive
            />
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">No of Questions</label>
              <input
                type="number"
                value={test.total_questions}
                onChange={(e) => update("total_questions", Number(e.target.value))}
                placeholder="Ex: 50 Questions"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Total Marks</label>
              <input
                type="number"
                value={test.total_marks}
                onChange={(e) => update("total_marks", Number(e.target.value))}
                placeholder="Ex: 250 Marks"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {errors._ && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {errors._}
          </div>
        )}
        {savedMsg && (
          <div className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            {savedMsg}
          </div>
        )}

        <div className="mt-10 flex justify-end gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={() => submit(false)}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition disabled:opacity-60"
          >
            {isEdit ? "Save Changes" : "Save as Draft"}
          </button>
          <button
            disabled={saving}
            onClick={() => submit(true)}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm disabled:opacity-60"
          >
            Next: Add Questions
            <span className="ml-2">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, error, children }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

function MultiSelect({ placeholder, options, selected, onToggle }: any) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 flex items-center justify-between"
      >
        <span className={selected.length === 0 ? "text-slate-400" : "text-slate-800"}>
          {selected.length === 0 ? placeholder : `${selected.length} selected`}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {options.length === 0 && (
              <div className="p-3 text-sm text-slate-400">No options available</div>
            )}
            {options.map((opt: any) => {
              const checked = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(opt.value)}
                    className="text-indigo-600"
                  />
                  <span className="text-slate-700">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, onInc, onDec, positive }: any) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      <div className="flex items-stretch border border-slate-200 rounded-lg overflow-hidden bg-white">
        <input
          type="number"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm text-center focus:outline-none"
        />
        <div className="flex flex-col border-l border-slate-200">
          <button
            type="button"
            onClick={onInc}
            className="px-2 text-slate-500 hover:bg-slate-50 border-b border-slate-200 flex-1"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDec}
            className="px-2 text-slate-500 hover:bg-slate-50 flex-1"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 9l6 6 6 6" />
            </svg>
          </button>
        </div>
      </div>
      {positive && <div className="mt-1 text-[10px] text-emerald-600">Correct Answer +</div>}
    </div>
  );
}