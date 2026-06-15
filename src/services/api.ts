import { apiFetch } from "./config";

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

// -------------------- AUTHENTICATION --------------------
export const api = {
  async login(userId: string, password: string) {
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
    return apiFetch("/subjects");
  },

  async getTopics(subjectId: string) {
    return apiFetch(`/topics/subject/${subjectId}`);
  },

  async getSubTopics(topicId: string) {
    return apiFetch(`/sub-topics/topic/${topicId}`);
  },

  async getSubTopicsByTopics(topicIds: string[]) {
    return apiFetch("/sub-topics/multi-topics", {
      method: "POST",
      body: JSON.stringify({ topicIds }),
    });
  },

  // -------------------- TESTS --------------------
  async getTests() {
    return apiFetch("/tests");
  },

  async getTest(id: string) {
    return apiFetch(`/tests/${id}`);
  },

  async createTest(payload: any) {
    return apiFetch("/tests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateTest(id: string, payload: any) {
    return apiFetch(`/tests/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteTest(id: string) {
    return apiFetch(`/tests/${id}`, {
      method: "DELETE",
    });
  },

  async publishTest(id: string, liveConfig: any = {}, targetStatus: string = "live") {
    return apiFetch(`/tests/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: targetStatus, live_config: liveConfig }),
    });
  },

  // -------------------- QUESTIONS --------------------
  async bulkCreateQuestions(testId: string, questions: any[]) {
    return apiFetch("/questions/bulk", {
      method: "POST",
      body: JSON.stringify({
        questions: questions.map((q) => ({ ...q, test_id: testId })),
      }),
    });
  },

  async getQuestionsByTest(testId: string) {
    const testResp = await apiFetch(`/tests/${testId}`);
    const questionIds = testResp?.data?.questions || [];
    if (questionIds.length === 0) return { success: true, data: [] };
    
    return apiFetch("/questions/fetchBulk", {
      method: "POST",
      body: JSON.stringify({ question_ids: questionIds }),
    });
  },

  async deleteQuestion(id: string) {
    return apiFetch(`/questions/${id}`, {
      method: "DELETE",
    });
  },

  async updateQuestion(id: string, payload: any) {
    return apiFetch(`/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};