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
  type: "chapterwise", 
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
  const [rawTestCopy, setRawTestCopy] = useState<any>(null); 
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subTopics, setSubTopics] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // 1. Fetch Master Subjects Dropdown list
  useEffect(() => {
    api.getSubjects().then((r: any) => setSubjects(r?.data || []));
  }, []);

  // 2. Fetch and Autopopulate Test Record on Edit
  useEffect(() => {
    if (!editId || subjects.length === 0) return;
    let cancelled = false;
    setLoading(true);

    api.getTest(editId)
      .then(async (r: any) => {
        if (cancelled || !r?.data) return;
        const t = r.data;
        setRawTestCopy(t); 

        let matchedSubjectId = t.subject || "";
        const exactMatch = subjects.find((s) => {
          const sName = String(s.name).trim().toLowerCase();
          const tSub = String(t.subject).trim().toLowerCase();
          return (
            s.id === t.subject || 
            sName === tSub || 
            (sName.startsWith("math") && tSub.startsWith("math"))
          );
        });
        if (exactMatch) {
          matchedSubjectId = exactMatch.id;
        }

        // Fetch valid topics map context synchronously for this subject
        const masterTopicsRes = await api.getTopics(matchedSubjectId);
        const masterTopicsList = masterTopicsRes?.data || [];
        if (!cancelled) setTopics(masterTopicsList);

        const incomingTopics = Array.isArray(t.topics) ? t.topics : [];
        const normalizedTopicUUIDs = incomingTopics.map((currVal: string) => {
          const match = masterTopicsList.find(
            (topItem: any) => topItem.id === currVal || topItem.name.toLowerCase() === currVal.toLowerCase()
          );
          return match ? match.id : currVal;
        });

        let masterSubTopicsList: any[] = [];
        if (normalizedTopicUUIDs.length > 0) {
          const subRes = await api.getSubTopicsByTopics(normalizedTopicUUIDs);
          masterSubTopicsList = subRes?.data || [];
          if (!cancelled) setSubTopics(masterSubTopicsList);
        }

        const incomingSubTopics = Array.isArray(t.sub_topics) ? t.sub_topics : [];
        const normalizedSubTopicUUIDs = incomingSubTopics.map((currVal: string) => {
          const match = masterSubTopicsList.find(
            (subItem: any) => subItem.id === currVal || subItem.name.toLowerCase() === currVal.toLowerCase()
          );
          return match ? match.id : currVal;
        });

        if (!cancelled) {
          setTest({
            name: t.name ?? "",
            type: t.type ?? "chapterwise",
            subject: matchedSubjectId,
            topics: normalizedTopicUUIDs,
            sub_topics: normalizedSubTopicUUIDs,
            difficulty: t.difficulty === "difficult" ? "hard" : (t.difficulty ?? "easy"),
            correct_marks: t.correct_marks ?? 4,
            wrong_marks: t.wrong_marks ?? -1,
            unattempt_marks: t.unattempt_marks ?? 0,
            total_time: t.total_time ?? 60,
            total_marks: t.total_marks ?? 100,
            total_questions: t.total_questions ?? 25,
            status: t.status || "draft"
          });
        }
      })
      .catch((err) => {
        setErrors({ _: err.message || "Failed to load test details" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editId, subjects]);

  useEffect(() => {
    if (isEdit || !test.subject) return;
    api.getTopics(test.subject).then((r: any) => setTopics(r?.data || []));
  }, [test.subject, isEdit]);

  useEffect(() => {
    if (isEdit || test.topics.length === 0) return;
    api.getSubTopicsByTopics(test.topics)
      .then((r: any) => setSubTopics(r?.data || []))
      .catch(() => setSubTopics([]));
  }, [test.topics, isEdit]);

  const update = (k: keyof TestData, v: any) => setTest((prev) => ({ ...prev, [k]: v }));

  const toggleTopic = (topicId: string) => {
    setTest((prev) => {
      const exists = prev.topics.includes(topicId);
      const newTopics = exists ? prev.topics.filter((t) => t !== topicId) : [...prev.topics, topicId];
      return { ...prev, topics: newTopics, sub_topics: [] }; 
    });
    if (!isEdit) setSubTopics([]);
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
    
    if (!test.sub_topics || test.sub_topics.length === 0) {
      e.sub_topics = "Please select at least one sub-topic to proceed";
    }
    
    if (!test.total_time || test.total_time <= 0) e.total_time = "Enter valid duration";
    if (!test.total_marks || test.total_marks <= 0) e.total_marks = "Enter valid total marks";
    if (!test.total_questions || test.total_questions <= 0) e.total_questions = "Enter valid questions count";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (redirectToQuestions: boolean) => {
    if (!validate()) return;
    setSaving(true);
    setErrors({});
    
    try {
      const fallbackDate = rawTestCopy?.created_at || new Date().toISOString();

      const cleanPayload = {
        name: test.name.trim(),
        type: test.type,
        subject: test.subject, 
        topics: test.topics,
        sub_topics: test.sub_topics,
        difficulty: test.difficulty === "hard" ? "difficult" : test.difficulty,
        correct_marks: Number(test.correct_marks) || 0,
        wrong_marks: Number(test.wrong_marks) || 0,
        unattempt_marks: Number(test.unattempt_marks) || 0,
        total_time: Number(test.total_time) || 60,
        total_marks: Number(test.total_marks) || 100,
        total_questions: Number(test.total_questions) || 25,
        
        slot: (rawTestCopy?.slot !== null && rawTestCopy?.slot !== undefined) ? Number(rawTestCopy.slot) : 0,
        hidden_from_moderator: (rawTestCopy?.hidden_from_moderator !== null && rawTestCopy?.hidden_from_moderator !== undefined) ? Boolean(rawTestCopy.hidden_from_moderator) : false,
        paragraph_question: Array.isArray(rawTestCopy?.paragraph_question) ? rawTestCopy.paragraph_question : [],
        scheduled_date: rawTestCopy?.scheduled_date || fallbackDate,
        expiry_date: rawTestCopy?.expiry_date || fallbackDate,
        questions: Array.isArray(rawTestCopy?.questions) ? rawTestCopy.questions : []
      };

      if (isEdit && editId) {
        await api.updateTest(editId, { ...cleanPayload, status: test.status ?? "draft" });

        if (redirectToQuestions) {
          navigate(`/tests/${editId}/questions`);
          return;
        }
        addNotification({
          type: "success",
          title: "Test updated",
          message: `${cleanPayload.name} changes were saved successfully.`,
        });
        navigate("/?notifications=1");
      } else {
        const res = await api.createTest({ 
          ...cleanPayload, 
          status: "draft" 
        });
        
        if (redirectToQuestions) {
          navigate(`/tests/${res.data.id}/questions`);
          return;
        }
        addNotification({
          type: "success",
          title: "Test added",
          message: `${cleanPayload.name} was saved as a draft.`,
        });
        navigate("/?notifications=1");
      }
    } catch (err: any) {
      setErrors({ _: err.message || "Failed to update test details. Verify payload structures." });
    } compression: {
      setSaving(false);
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
          {isEdit ? "Update the test settings. Your changes will be saved." : "Configure your test settings."}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-2 inline-flex gap-1">
        {[
          { k: "chapterwise", l: "Chapter Wise" },
          { k: "pyq", l: "PYQ" },
          { k: "mock", l: "Mock Test" },
        ].map((opt) => (
          <button
            key={opt.k}
            type="button"
            onClick={() => update("type", opt.k)}
            className={`px-4 py-2 text-sm rounded-lg transition ${
              test.type === opt.k ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-500 hover:bg-slate-50"
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
              onChange={(e) => {
                update("subject", e.target.value);
                if(!isEdit) { update("topics", []); update("sub_topics", []); }
              }}
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

          <Field label="Sub Topic" required error={errors.sub_topics}>
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
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Total Marks</label>
              <input
                type="number"
                value={test.total_marks}
                onChange={(e) => update("total_marks", Number(e.target.value))}
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

        <div className="mt-10 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => submit(false)}
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition"
          >
            Save Changes
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => submit(true)}
            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
          >
            Next: Add Questions →
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