import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  NavLink,
} from "react-router-dom";
import { api } from "./services/api";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TestCreation from "./pages/TestCreation";
import AddQuestions from "./pages/AddQuestions";
import PreviewPublish from "./pages/PreviewPublish";
import { clearNotifications, getNotifications, type AppNotification } from "./services/notification";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!api.isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<any>(api.getUser());

  useEffect(() => {
    setUser(api.getUser());
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setUser(api.getUser())} />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <AppShell user={user}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tests" element={<Dashboard />} />
                  <Route path="/test-creation" element={<TestCreation />} />
                  <Route path="/test-creation/:id" element={<TestCreation />} />
                  <Route path="/tests/:id/questions" element={<AddQuestions />} />
                  <Route path="/tests/:id/preview" element={<PreviewPublish />} />
                </Routes>
              </AppShell>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function AppShell({ children, user }: { children: React.ReactNode; user: any }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications());

  useEffect(() => {
    setNotifications(getNotifications());
    if (new URLSearchParams(location.search).get("notifications") === "1") {
      setNotificationsOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const isAuthPage = location.pathname === "/login";
  if (isAuthPage) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Logo />
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          <SideItem to="/" icon={<IconDash />} label="Dashboard" activePaths={["/tests", "/tests/"]} />
          <SideItem to="/test-creation" icon={<IconCreate />} label="Test Creation" activePaths={["/test-creation"]} />
          <SideItem to="#" icon={<IconTrack />} label="Test Tracking" disabled />
        </nav>
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400">v1.0 · PrepRoute</div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <Breadcrumbs />
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setNotifications(getNotifications());
                  setNotificationsOpen((open) => !open);
                }}
                className="relative text-slate-500 hover:text-slate-800"
              >
                <IconBell />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>
              {notificationsOpen && (
                <NotificationPanel
                  notifications={notifications}
                  onClear={() => {
                    clearNotifications();
                    setNotifications([]);
                  }}
                />
              )}
            </div>
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-white flex items-center justify-center text-sm font-semibold border-2 border-white shadow">
                  {(user?.name || "A").charAt(0)}
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-semibold text-slate-800">{user?.name || "User"}</div>
                  <div className="text-xs text-slate-500">{user?.role || "Admin"}</div>
                </div>
                <IconChev />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-30">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      api.logout();
                      navigate("/login");
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SideItem({
  to,
  icon,
  label,
  disabled,
  activePaths,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  activePaths?: string[];
}) {
  const location = useLocation();
  const isActive = activePaths
    ? activePaths.some((p) => location.pathname.startsWith(p))
    : to === location.pathname || (to === "/" && location.pathname === "/");

  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-slate-400 rounded-md cursor-not-allowed">
        {icon}
        <span>{label}</span>
      </div>
    );
  }
  return (
    <NavLink
      to={to}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
        isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function NotificationPanel({
  notifications,
  onClear,
}: {
  notifications: AppNotification[];
  onClear: () => void;
}) {
  return (
    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-800">Notifications</div>
          <div className="text-xs text-slate-500">Latest test activity</div>
        </div>
        {notifications.length > 0 && (
          <button onClick={onClear} className="text-xs text-indigo-600 hover:underline">
            Clear
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            No notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
              <div className="flex gap-3">
                <span
                  className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    n.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {n.type === "success" ? "✓" : "i"}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">{n.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{n.message}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{formatNotificationTime(n.createdAt)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Breadcrumbs() {
  const location = useLocation();
  const path = location.pathname;
  let crumbs: string[] = ["Home"];
  if (path === "/test-creation" || path.startsWith("/test-creation/")) crumbs = ["Test Creation", "Create Test", "Chapter Wise"];
  else if (path.includes("/questions")) crumbs = ["Test Creation", "Add Questions"];
  else if (path.includes("/preview")) crumbs = ["Test Creation", "Preview & Publish"];
  else if (path === "/" || path === "/tests") crumbs = ["Test Management", "Dashboard"];

  return (
    <div className="text-sm text-slate-500 flex items-center gap-2">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className={i === crumbs.length - 1 ? "text-slate-800 font-medium" : ""}>{c}</span>
          {i < crumbs.length - 1 && <span className="text-slate-300">/</span>}
        </span>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/src/images/preproute_logo.jpeg"
        alt="PrepRoute"
        className="h-20 w-auto object-contain"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
      />
      <div className="hidden font-bold text-slate-800 text-lg">
        Prep<span className="text-indigo-600">Route</span>
      </div>
    </div>
  );
}

function IconDash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l9-9 9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconCreate() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
function IconTrack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  );
}
function IconChev() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
