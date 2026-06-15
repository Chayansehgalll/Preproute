import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import { addNotification } from "../services/notification";

type Config = {
  publishMode: "now" | "scheduled";
  scheduleDate: string;
  scheduleHour: string;
  scheduleMinute: string;
  scheduleMeridiem: "AM" | "PM";
  liveUntil: string;
  endDate: string;
  endHour: string;
  endMinute: string;
  endMeridiem: "AM" | "PM";
};

const defaultConfig: Config = {
  publishMode: "now",
  scheduleDate: "",
  scheduleHour: "10",
  scheduleMinute: "00",
  scheduleMeridiem: "AM",
  liveUntil: "custom",
  endDate: "",
  endHour: "06",
  endMinute: "00",
  endMeridiem: "PM",
};

const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const to24 = (h: string, m: string, mer: "AM" | "PM"): string => {
  let hour = parseInt(h || "0", 10);
  if (Number.isNaN(hour)) hour = 0;
  if (mer === "AM") { if (hour === 12) hour = 0; }
  else { if (hour !== 12) hour += 12; }
  return `${String(hour).padStart(2, "0")}:${m.padStart(2, "0") || "00"}`;
};

export default function PreviewPublish() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getTest(id), api.getQuestionsByTest(id)])
      .then(([r1, r2]: any) => {
        setTest(r1.data);
        setQuestions(r2.data || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !test) return <div className="p-8 text-slate-500 text-center">Loading...</div>;

  const publish = async () => {
    let live_config: any = { liveUntil: config.liveUntil };
    let isFutureScheduled = false;
    
    if (config.publishMode === "scheduled") {
      const t24 = to24(config.scheduleHour, config.scheduleMinute, config.scheduleMeridiem);
      const scheduledAt = `${config.scheduleDate}T${t24}`;
      live_config.scheduledAt = scheduledAt;
      isFutureScheduled = new Date(scheduledAt) > new Date();
    }
    
    if (config.liveUntil === "custom") {
      const t24 = to24(config.endHour, config.endMinute, config.endMeridiem);
      live_config.endAt = `${config.endDate}T${t24}`;
    }
    
    const targetStatus = isFutureScheduled ? "scheduled" : "live";
    const previouslyPublished = test.status === "live" || test.status === "scheduled";
    
    await api.publishTest(id!, live_config, targetStatus);
    
    const message = previouslyPublished
        ? isFutureScheduled ? "Test rescheduled successfully!" : "Test re-published successfully!"
        : isFutureScheduled ? "Test scheduled successfully!" : "Test published successfully!";
        
    setSuccessMsg(message);
    addNotification({
      type: "success",
      title: targetStatus === "scheduled" ? "Test scheduled" : "Test published",
      message: `${test.name} is now ${targetStatus === "scheduled" ? "scheduled" : "live"}.`,
    });
    setTest((prev: any) => ({ ...prev, status: targetStatus, live_config }));
    setTimeout(() => navigate("/?notifications=1"), 1800);
  };

  const totalQ = questions.length || test.total_questions || 0;

  return (
    <div className="max-w-[1200px] mx-auto">
      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>
          {successMsg} Redirecting to dashboard...
        </div>
      )}

      <div className="text-xs text-slate-500 mb-4">Test creation</div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Question creation</div>
            <div className="text-xs text-slate-500 mt-1">Total Questions: <span className="text-slate-800 font-semibold">{totalQ}</span></div>
          </div>
          <div className="p-3 space-y-1.5 max-h-[600px] overflow-y-auto">
            {questions.length === 0 && <div className="text-xs text-slate-400 px-2 py-4 text-center">No questions added</div>}
            {questions.map((q: any, i: number) => <QItem key={q.id || i} num={i + 1} />)}
          </div>
        </aside>

        <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">Test created</span>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium px-2.5 py-1 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                All {totalQ} Questions done
              </span>
              <StatusPill status={test.status} />
              {(test.status === "live" || test.status === "scheduled") && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">This test is already published or scheduled. Re-confirming updates configuration.</span>
              )}
            </div>
            <button onClick={() => navigate(`/test-creation/${id}`)} className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 bg-indigo-950 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">{test.type === "mock" ? "Mock Test" : test.type === "pyq" ? "PYQ" : "Chapter Wise"}</span>
              <span className="inline-flex items-center gap-1.5 bg-indigo-900/10 text-indigo-700 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-indigo-200"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>Chapter 1</span>
              <span className="inline-flex items-center bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="mr-1"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>{(test.difficulty || "easy").charAt(0).toUpperCase() + (test.difficulty || "easy").slice(1)}</span>
            </div>

            <div className="space-y-2 text-sm">
              <MetaRow label="Subject" value={test.subject_name || test.subject || "—"} />
              <MetaRow label="Topic" pills={(test.topics_names || []).length ? test.topics_names : ["—"]} variant="amber" />
              <MetaRow label="Sub Topic" pills={["Application"]} variant="amber" />
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex flex-wrap gap-5 justify-end text-xs text-slate-600">
              <div className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>{test.total_time || 60} Min</div>
              <div className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 10h8M8 14h5" /></svg>{totalQ} Q's</div>
              <div className="inline-flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>{test.total_marks || 250} Marks</div>
            </div>
          </div>

          <div className="inline-flex bg-slate-100 rounded-lg p-1">
            <button onClick={() => setConfig({ ...config, publishMode: "now" })} className={`px-4 py-2 text-xs font-medium rounded-md transition ${config.publishMode === "now" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Publish Now</button>
            <button onClick={() => setConfig({ ...config, publishMode: "scheduled" })} className={`px-4 py-2 text-xs font-medium rounded-md transition ${config.publishMode === "scheduled" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Schedule Publish</button>
          </div>

          {config.publishMode === "scheduled" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="block text-slate-700 mb-1.5 text-xs font-medium">Select Date</span>
                <input type="date" min={todayISO()} value={config.scheduleDate} onChange={(e) => setConfig({ ...config, scheduleDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </label>
              <label className="block text-sm">
                <span className="block text-slate-700 mb-1.5 text-xs font-medium">Select Time</span>
                <TimeInput12 hour={config.scheduleHour} minute={config.scheduleMinute} meridiem={config.scheduleMeridiem} onChange={(hour, minute, meridiem) => setConfig({ ...config, scheduleHour: hour, scheduleMinute: minute, scheduleMeridiem: meridiem })} />
              </label>
            </div>
          )}

          <div>
            <div className="text-sm font-semibold text-slate-800 mb-1.5">Live Until</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <RadioRow label="Always Available" checked={config.liveUntil === "always"} onChange={() => setConfig({ ...config, liveUntil: "always" })} />
              <RadioRow label="3 Weeks" checked={config.liveUntil === "3weeks"} onChange={() => setConfig({ ...config, liveUntil: "3weeks" })} />
              <RadioRow label="1 Week" checked={config.liveUntil === "1week"} onChange={() => setConfig({ ...config, liveUntil: "1week" })} />
              <RadioRow label="1 Month" checked={config.liveUntil === "1month"} onChange={() => setConfig({ ...config, liveUntil: "1month" })} />
              <RadioRow label="2 Weeks" checked={config.liveUntil === "2weeks"} onChange={() => setConfig({ ...config, liveUntil: "2weeks" })} />
              <RadioRow label="Custom Duration" checked={config.liveUntil === "custom"} onChange={() => setConfig({ ...config, liveUntil: "custom" })} />
            </div>
          </div>

          {config.liveUntil === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <label className="block text-sm">
                <input type="date" min={config.scheduleDate || todayISO()} value={config.endDate} onChange={(e) => setConfig({ ...config, endDate: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white" />
              </label>
              <label className="block text-sm">
                <TimeInput12 hour={config.endHour} minute={config.endMinute} meridiem={config.endMeridiem} onChange={(hour, minute, meridiem) => setConfig({ ...config, endHour: hour, endMinute: minute, endMeridiem: meridiem })} />
              </label>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">Question Preview</div>
                <div className="text-xs text-slate-500">Final published output review panel.</div>
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {questions.length === 0 ? (
                <div className="p-5 text-sm text-slate-400 text-center">No questions available to preview.</div>
              ) : (
                questions.map((q: any, index: number) => (
                  <div key={q.id || index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{q.question}</div>
                        {q.media_url && <img src={q.media_url} alt={`Question ${index + 1} media`} className="mt-3 max-h-44 rounded-lg border border-slate-200 object-contain bg-white" />}
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {[q.option1, q.option2, q.option3, q.option4].map((option: string, oIdx: number) => {
                            const key = `option${oIdx + 1}`;
                            const isCorrect = q.correct_option === key;
                            return (
                              <div key={key} className={`px-3 py-2 rounded-lg border ${isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium" : "bg-white border-slate-200 text-slate-600"}`}>
                                {String.fromCharCode(65 + oIdx)}. {option} {isCorrect && "✓"}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button onClick={() => navigate("/")} className="px-5 py-2.5 text-sm font-medium text-indigo-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={publish} className="px-8 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">Confirm</button>
          </div>
        </section>
      </div>
    </div>
  );
}

function QItem({ num }: { num: number }) {
  return (
    <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs">
      <span className="w-5 h-5 shrink-0 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center border border-emerald-200">✓</span>
      <span className="text-slate-700 truncate"><span className="font-semibold">Question {num}</span></span>
      <span className="ml-auto text-slate-300">›</span>
    </div>
  );
}

function MetaRow({ label, value, pills, variant }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-20 text-slate-500 text-xs pt-0.5 shrink-0">{label}</div>
      <div className="text-slate-800 text-sm flex flex-wrap gap-1.5 items-center">
        {pills ? pills.map((p: any, i: any) => (
          <span key={i} className={`px-2 py-0.5 rounded text-[11px] font-medium border ${variant === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-700"}`}>{p}</span>
        )) : <span className="font-medium">{value}</span>}
      </div>
    </div>
  );
}

function RadioRow({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-1">
      <span className="relative inline-flex">
        <input type="radio" checked={checked} onChange={onChange} className="peer appearance-none w-4 h-4 rounded-full border-2 border-indigo-400 checked:border-indigo-600" />
        <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (status === "live") return <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Published</span>;
  if (status === "scheduled") return <span className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-medium px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />Scheduled</span>;
  return <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-medium px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />Draft</span>;
}

function TimeInput12({ hour, minute, meridiem, onChange }: any) {
  const hours = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  return (
    <div className="flex items-stretch gap-1">
      <select value={hour} onChange={(e) => onChange(e.target.value, minute, meridiem)} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
        {hours.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="self-center text-slate-500 font-medium">:</span>
      <select value={minute} onChange={(e) => onChange(hour, e.target.value, meridiem)} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-700">
        {minutes.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
      <select value={meridiem} onChange={(e) => onChange(hour, minute, e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 font-medium">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}