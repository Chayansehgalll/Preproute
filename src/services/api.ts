// Test management API service
// - Uses real API from https://admin-moderator-backend-staging.up.railway.app/api
// - Falls back to mock (localStorage) data when real API fails or endpoint missing

import { API_CONFIG, apiFetch } from "./config";

// -------------------- MOCK DATA (fallback) --------------------
const defaultData = {
  subjects: [
    { id: "sub-1", name: "Mathematics" },
    { id: "sub-2", name: "Physics" },
    { id: "sub-3", name: "Chemistry" },
    { id: "sub-4", name: "Biology" },
    { id: "sub-5", name: "English" },
  ],
  topics: [
    { id: "t-1", name: "Algebra", subject_id: "sub-1" },
    { id: "t-2", name: "Geometry", subject_id: "sub-1" },
    { id: "t-3", name: "Calculus", subject_id: "sub-1" },
    { id: "t-4", name: "Mechanics", subject_id: "sub-2" },
    { id: "t-5", name: "Electromagnetism", subject_id: "sub-2" },
    { id: "t-6", name: "Organic Chemistry", subject_id: "sub-3" },
    { id: "t-7", name: "Inorganic Chemistry", subject_id: "sub-3" },
    { id: "t-8", name: "Cell Biology", subject_id: "sub-4" },
    { id: "t-9", name: "Grammar", subject_id: "sub-5" },
    { id: "t-10", name: "Comprehension", subject_id: "sub-5" },
  ],
  subTopics: [
    { id: "st-1", name: "Linear Equations", topic_id: "t-1" },
    { id: "st-2", name: "Quadratic Equations", topic_id: "t-1" },
    { id: "st-3", name: "Polynomials", topic_id: "t-1" },
    { id: "st-4", name: "Triangles", topic_id: "t-2" },
    { id: "st-5", name: "Circles", topic_id: "t-2" },
    { id: "st-6", name: "Differentiation", topic_id: "t-3" },
    { id: "st-7", name: "Integration", topic_id: "t-3" },
    { id: "st-8", name: "Newton's Laws", topic_id: "t-4" },
    { id: "st-9", name: "Gravity", topic_id: "t-4" },
    { id: "st-10", name: "Electric Fields", topic_id: "t-5" },
    { id: "st-11", name: "Hydrocarbons", topic_id: "t-6" },
    { id: "st-12", name: "Periodic Table", topic_id: "t-7" },
    { id: "st-13", name: "Photosynthesis", topic_id: "t-8" },
    { id: "st-14", name: "Tenses", topic_id: "t-9" },
    { id: "st-15", name: "Passage Reading", topic_id: "t-10" },
  ],
  tests: [],
  questions: [],
};

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function loadStore() {
  const raw = localStorage.getItem("preproute_store");
  if (!raw) {
    const store = { ...defaultData, tests: sampleTests() };
    localStorage.setItem("preproute_store", JSON.stringify(store));
    return store;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { ...defaultData, tests: sampleTests() };
  }
}

function saveStore(store: any) {
  localStorage.setItem("preproute_store", JSON.stringify(store));
}

function sampleTests() {
  return [
    {
      id: uid("test"),
      name: "Sample Algebra Test",
      type: "practice",
      subject: "sub-1",
      subject_name: "Mathematics",
      topics: ["t-1"],
      topics_names: ["Algebra"],
      sub_topics: ["st-1", "st-2"],
      correct_marks: 4,
      wrong_marks: -1,
      unattempt_marks: 0,
      difficulty: "medium",
      total_time: 60,
      total_marks: 100,
      total_questions: 25,
      status: "draft",
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      questions: [],
    },
  ];
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// -------------------- REAL API CALLS WITH MOCK FALLBACK --------------------
const USE_REAL = API_CONFIG.USE_REAL_API;
const FALLBACK = API_CONFIG.FALLBACK_TO_MOCK_ON_FAILURE;

async function tryReal<T>(fn: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
  if (!USE_REAL) return mock();
  try {
    return await fn();
  } catch (err: any) {
    console.warn("[preproute] Real API failed, falling back to mock:", err.message);
    if (FALLBACK) return mock();
    throw err;
  }
}

// Robust token/user extraction from varying server response shapes:
// - { data: { token, user } }
// - { token, user }
// - { data: { accessToken, user } }
// - { accessToken }
function extractToken(data: any): string | null {
  if (!data) return null;
  return (
    data.token ||
    data.accessToken ||
    data.access_token ||
    data.data?.token ||
    data.data?.accessToken ||
    data.data?.access_token ||
    data.data?.jwt ||
    null
  );
}
function extractUser(data: any): any {
  if (!data) return null;
  return data.user || data.data?.user || data.data?.profile || data.data?.admin || null;
}

// -------------------- AUTH --------------------
export const api = {
  async login(userId: string, password: string) {
    await delay(300);
    return tryReal(
      async () => {
        // Try multiple field-name variants (userId / user_id / email) so we
        // work with a range of real backend schemas.
        const bodyVariants = [
          { userId, password },
          { user_id: userId, password },
          { email: userId, password },
        ];
        let data: any = null;
        let lastErr: any = null;
        for (const body of bodyVariants) {
          try {
            data = await apiFetch("/auth/login", {
              method: "POST",
              body: JSON.stringify(body),
            });
            if (data && (data.success !== false) && extractToken(data)) break;
          } catch (err) {
            lastErr = err;
            data = null;
          }
        }
        if (!data) {
          throw new Error(lastErr?.message || "Login failed — please check your credentials.");
        }

        const token = extractToken(data);
        const user = extractUser(data) || { name: "User", role: "Admin" };

        if (!token) {
          throw new Error(
            data?.message || data?.error || "Login succeeded but no token returned by server."
          );
        }

        localStorage.setItem("preproute_token", token);
        localStorage.setItem("preproute_user", JSON.stringify(user));
        return data;
      },
      async () => {
        // Strict credentials - only these specific values work
        if (userId.trim() !== "vedant_admin" || password !== "vedant123") {
          throw new Error("Invalid credentials. Please check your User ID and Password.");
        }
        const token = "mock-jwt-token-preproute";
        localStorage.setItem("preproute_token", token);
        localStorage.setItem(
          "preproute_user",
          JSON.stringify({ id: uid("user"), name: "Vedant Admin", role: "Admin", email: userId })
        );
        return {
          success: true,
          data: {
            token,
            user: { id: uid("user"), name: "Vedant Admin", role: "Admin", email: userId },
          },
        };
      }
    );
  },

  logout() {
    localStorage.removeItem("preproute_token");
    localStorage.removeItem("preproute_user");
  },

  isAuthenticated() {
    return !!localStorage.getItem("preproute_token");
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem("preproute_user") || "null");
    } catch {
      return null;
    }
  },

  // -------------------- SUBJECTS / TOPICS --------------------
  async getSubjects() {
    return tryReal(
      () => apiFetch("/subjects"),
      async () => ({ success: true, data: loadStore().subjects })
    );
  },

  async getTopics(subjectId: string) {
    return tryReal(
      () => apiFetch(`/topics/subject/${subjectId}`),
      async () => ({
        success: true,
        data: loadStore().topics.filter((t: any) => t.subject_id === subjectId),
      })
    );
  },

  async getSubTopics(topicId: string) {
    return tryReal(
      () => apiFetch(`/sub-topics/topic/${topicId}`),
      async () => ({
        success: true,
        data: loadStore().subTopics.filter((s: any) => s.topic_id === topicId),
      })
    );
  },

  async getSubTopicsByTopics(topicIds: string[]) {
    return tryReal(
      () =>
        apiFetch("/sub-topics/multi-topics", {
          method: "POST",
          body: JSON.stringify({ topicIds }),
        }),
      async () => ({
        success: true,
        data: loadStore().subTopics.filter((st: any) => topicIds.includes(st.topic_id)),
      })
    );
  },

  // -------------------- TESTS --------------------
  async getTests() {
    return tryReal(
      () => apiFetch("/tests"),
      async () => ({ success: true, data: loadStore().tests })
    );
  },

  async getTest(id: string) {
    return tryReal(
      () => apiFetch(`/tests/${id}`),
      async () => {
        const test = loadStore().tests.find((t: any) => t.id === id);
        if (!test) throw new Error("Test not found");
        return { success: true, data: test };
      }
    );
  },

  async createTest(payload: any) {
    return tryReal(
      () =>
        apiFetch("/tests", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      async () => {
        const store = loadStore();
        const subjectsMap = Object.fromEntries(store.subjects.map((s: any) => [s.id, s.name]));
        const topicsMap = Object.fromEntries(store.topics.map((t: any) => [t.id, t.name]));
        const test = {
          id: uid("test"),
          ...payload,
          subject_name: subjectsMap[payload.subject] || "",
          topics_names: (payload.topics || []).map((id: string) => topicsMap[id] || id),
          created_at: new Date().toISOString(),
          questions: [],
        };
        store.tests.unshift(test);
        saveStore(store);
        return { success: true, data: test, message: "Test created successfully" };
      }
    );
  },

  async updateTest(id: string, payload: any) {
    return tryReal(
      () =>
        apiFetch(`/tests/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      async () => {
        const store = loadStore();
        const idx = store.tests.findIndex((t: any) => t.id === id);
        if (idx < 0) throw new Error("Test not found");
        store.tests[idx] = { ...store.tests[idx], ...payload };
        saveStore(store);
        return { success: true, data: store.tests[idx] };
      }
    );
  },

  async deleteTest(id: string) {
    return tryReal(
      () =>
        apiFetch(`/tests/${id}`, {
          method: "DELETE",
        }),
      async () => {
        const store = loadStore();
        store.tests = store.tests.filter((t: any) => t.id !== id);
        saveStore(store);
        return { success: true };
      }
    );
  },

  async publishTest(id: string, liveConfig: any = {}, targetStatus: string = "live") {
    return tryReal(
      () =>
        apiFetch(`/tests/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: targetStatus, live_config: liveConfig }),
        }),
      async () => {
        const store = loadStore();
        const idx = store.tests.findIndex((t: any) => t.id === id);
        if (idx < 0) throw new Error("Test not found");
        const isFuture = liveConfig?.scheduledAt
          ? new Date(liveConfig.scheduledAt) > new Date()
          : false;
        const finalStatus = targetStatus === "live" && isFuture ? "scheduled" : targetStatus;
        store.tests[idx] = {
          ...store.tests[idx],
          status: finalStatus,
          live_config: liveConfig,
          published_at: new Date().toISOString(),
        };
        saveStore(store);
        return { success: true, data: store.tests[idx] };
      }
    );
  },

  // -------------------- QUESTIONS --------------------
  async bulkCreateQuestions(testId: string, questions: any[]) {
    return tryReal(
      () =>
        apiFetch("/questions/bulk", {
          method: "POST",
          body: JSON.stringify({
            questions: questions.map((q) => ({ ...q, test_id: testId })),
          }),
        }),
      async () => {
        const store = loadStore();
        const created = questions.map((q) => ({
          id: uid("q"),
          type: "mcq",
          test_id: testId,
          ...q,
        }));
        store.questions.push(...created);
        const idx = store.tests.findIndex((t: any) => t.id === testId);
        if (idx >= 0) {
          store.tests[idx].questions = [
            ...(store.tests[idx].questions || []),
            ...created.map((c) => c.id),
          ];
          store.tests[idx].total_questions = store.tests[idx].questions.length;
        }
        saveStore(store);
        return {
          success: true,
          data: created,
          message: `Successfully created ${created.length} questions`,
        };
      }
    );
  },

  async getQuestionsByTest(testId: string) {
    return tryReal(
      async () => {
        // Try list endpoint first; if it returns questions with test filtering use it.
        // Otherwise, attempt a test-details fetch that includes question_ids + bulk fetch.
        const testResp = await apiFetch(`/tests/${testId}`);
        const questionIds = testResp?.data?.questions || [];
        if (questionIds.length === 0) return { success: true, data: [] };
        const bulk = await apiFetch("/questions/fetchBulk", {
          method: "POST",
          body: JSON.stringify({ question_ids: questionIds }),
        });
        return bulk;
      },
      async () => ({
        success: true,
        data: loadStore().questions.filter((q: any) => q.test_id === testId),
      })
    );
  },

  async deleteQuestion(id: string) {
    return tryReal(
      () =>
        apiFetch(`/questions/${id}`, {
          method: "DELETE",
        }),
      async () => {
        const store = loadStore();
        const q = store.questions.find((q: any) => q.id === id);
        store.questions = store.questions.filter((x: any) => x.id !== id);
        if (q) {
          const idx = store.tests.findIndex((t: any) => t.id === q.test_id);
          if (idx >= 0) {
            store.tests[idx].questions = (store.tests[idx].questions || []).filter(
              (x: string) => x !== id
            );
            store.tests[idx].total_questions = store.tests[idx].questions.length;
          }
        }
        saveStore(store);
        return { success: true };
      }
    );
  },

  async updateQuestion(id: string, payload: any) {
    return tryReal(
      () =>
        apiFetch(`/questions/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        }),
      async () => {
        const store = loadStore();
        const idx = store.questions.findIndex((q: any) => q.id === id);
        if (idx < 0) throw new Error("Question not found");
        store.questions[idx] = { ...store.questions[idx], ...payload };
        saveStore(store);
        return { success: true, data: store.questions[idx] };
      }
    );
  },
};
