export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  type: "success" | "info";
};

const KEY = "preproute_notifications";

export function getNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function addNotification(notification: Omit<AppNotification, "id" | "createdAt">) {
  const current = getNotifications();
  const next: AppNotification[] = [
    {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 10);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearNotifications() {
  localStorage.removeItem(KEY);
}