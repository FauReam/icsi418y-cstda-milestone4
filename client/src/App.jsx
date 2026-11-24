import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCheck,
  LayoutGrid,
  ListTodo,
  LogOut,
  Palette,
  Plus,
  RefreshCw,
} from "lucide-react";
import { api } from "./api";
import { Calendar } from "./components/Calendar";
import { Editor } from "./components/Editors";
import { dateKey, localDate } from "./date";

export default function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState([]),
    [events, setEvents] = useState([]),
    [tasks, setTasks] = useState([]);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [activeTab, setActiveTab] = useState("all"),
    [view, setView] = useState("calendar");
  const today = dateKey(new Date());
  const [selected, setSelected] = useState(today),
    [month, setMonth] = useState(localDate(today)),
    [modal, setModal] = useState(null),
    [pendingTask, setPendingTask] = useState(null);
  const loadSequence = useRef(0);
  function signedOut() {
    loadSequence.current++;
    setUser(null);
    setTabs([]);
    setEvents([]);
    setTasks([]);
    setModal(null);
    setActiveTab("all");
    setNotice("");
  }
  async function load() {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError("");
    try {
      const [tabData, eventData, taskData] = await Promise.all([
        api("/tabs"),
        api("/events"),
        api("/tasks"),
      ]);
      if (sequence !== loadSequence.current) return;
      setTabs(tabData.tabs);
      setEvents(eventData.events);
      setTasks(taskData.tasks);
    } catch (error) {
      if (sequence !== loadSequence.current) return;
      if (error.status === 401) signedOut();
      else setError(error.message);
      throw error;
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch((error) => {
        if (error.status !== 401) setError(error.message);
      })
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (user) load().catch(() => {});
  }, [user]);
  function selectDate(key) {
    setSelected(key);
    setMonth(localDate(key));
  }
  function newEvent() {
    setModal({
      kind: "event",
      data: {
        title: "",
        date: selected,
        start_time: "",
        end_time: "",
        tab_id:
          activeTab === "all"
            ? tabs.find((tab) => tab.name_key === "general")?._id
            : activeTab,
        color_override: null,
      },
    });
  }
  function newTask() {
    setModal({
      kind: "task",
      data: { title: "", priority: "Medium", is_completed: false },
    });
  }
  async function save(kind, data) {
    const collection =
      kind === "event" ? "events" : kind === "task" ? "tasks" : "tabs";
    const path =
      kind === "tabColor"
        ? `/tabs/${data._id}/color`
        : `/${collection}${data._id ? `/${data._id}` : ""}`;
    try {
      await api(path, { method: data._id ? "PUT" : "POST", body: data });
    } catch (error) {
      if (error.status === 401) signedOut();
      throw error;
    }
    setNotice("Changes saved.");
    // The write succeeded. A failed refresh is shown in the page banner; do not resubmit the write.
    await load().catch(() => {});
  }
  async function remove(kind, id) {
    try {
      await api(`/${kind === "event" ? "events" : "tasks"}/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      if (error.status === 401) signedOut();
      throw error;
    }
    setNotice("Record deleted.");
    await load().catch(() => {});
  }
  async function toggleTask(task) {
    setPendingTask(task._id);
    setError("");
    try {
      await api(`/tasks/${task._id}`, {
        method: "PUT",
        body: { ...task, is_completed: !task.is_completed },
      });
      await load();
      setNotice(task.is_completed ? "Task reopened." : "Task completed.");
    } catch (error) {
      if (error.status === 401) signedOut();
      else setError(error.message);
    } finally {
      setPendingTask(null);
    }
  }
  const filtered = events.filter(
    (event) => activeTab === "all" || event.tab_id === activeTab,
  );
  const agenda = filtered.filter((event) => event.date === selected);
  const selectedTab = tabs.find((tab) => tab._id === activeTab),
    remaining = tasks.filter((task) => !task.is_completed).length;
  if (checking)
    return (
      <main className="loading-screen" role="status">
        Opening your planner…
      </main>
    );
  if (!user)
    return (
      <Login
        error={error}
        onLogin={(value) => {
          setError("");
          setUser(value);
        }}
      />
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="#main" className="skip-link">
          Skip to planner
        </a>
        <div className="brand">
          <span className="brand-mark">
            <CheckCheck size={25} />
          </span>
          <span>
            CSTDA<span className="brand-sub">A little more together.</span>
          </span>
        </div>
        <nav aria-label="Main navigation">
          <button
            className={`nav-item ${view === "calendar" ? "active" : ""}`}
            onClick={() => setView("calendar")}
          >
            <CalendarDays size={20} /> Calendar
          </button>
          <button
            className={`nav-item ${view === "tasks" ? "active" : ""}`}
            onClick={() => setView("tasks")}
          >
            <ListTodo size={20} /> To-do list{" "}
            <span className="nav-count">{remaining}</span>
          </button>
        </nav>
        <div className="sidebar-section">
          <div className="section-label">
            YOUR TABS{" "}
            <button
              className="icon-button"
              aria-label="Create tab"
              onClick={() =>
                setModal({
                  kind: "tab",
                  data: { name: "", default_color: "#245a48" },
                })
              }
            >
              <Plus size={18} />
            </button>
          </div>
          <nav aria-label="Calendar tabs">
            <button
              className={`tab-button ${activeTab === "all" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("all");
                setView("calendar");
              }}
            >
              <LayoutGrid size={16} />
              All activities<span>{events.length}</span>
            </button>
            {tabs.map((tab) => (
              <div className="tab-row" key={tab._id}>
                <button
                  className={`tab-button ${activeTab === tab._id ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab(tab._id);
                    setView("calendar");
                  }}
                >
                  <span
                    className="tab-color"
                    style={{ background: tab.default_color }}
                  />
                  {tab.name}
                  <span>
                    {events.filter((event) => event.tab_id === tab._id).length}
                  </span>
                </button>
                <button
                  className="icon-button tab-palette"
                  aria-label={`Change ${tab.name} color`}
                  onClick={() => setModal({ kind: "tabColor", data: tab })}
                >
                  <Palette size={15} />
                </button>
              </div>
            ))}
          </nav>
        </div>
        <div className="sidebar-note">
          <span className="note-symbol">✳</span>
          <p>Make room for what matters.</p>
          <span>Your calendar and tasks, in one place.</span>
        </div>
        <div className="account">
          <span className="avatar">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{user.username}</strong>
            <small>Personal workspace</small>
          </span>
          <button
            className="icon-button"
            aria-label="Log out"
            onClick={async () => {
              try {
                await api("/auth/logout", { method: "POST" });
                signedOut();
              } catch (error) {
                setError(error.message);
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main id="main" className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">YOUR EVERYDAY, ORGANIZED</p>
            <h1>
              {view === "calendar"
                ? "A clear view of your day."
                : "One thing at a time."}
            </h1>
            <p className="subtitle">
              {view === "calendar"
                ? "Classes, commitments, and a little time for yourself."
                : "Keep your priorities close. Make progress at your pace."}
            </p>
          </div>
          <button
            className="primary"
            disabled={loading || !tabs.length}
            onClick={view === "calendar" ? newEvent : newTask}
          >
            <Plus size={18} />
            {view === "calendar" ? "New event" : "New task"}
          </button>
        </header>
        <div className="workspace-meta">
          <span>
            <span className="workspace-dot" />
            {view === "calendar"
              ? selectedTab?.name || "All activities"
              : "Your to-do list"}
          </span>
          <button
            className="quiet"
            disabled={loading}
            onClick={() => load().catch(() => {})}
          >
            <RefreshCw size={15} />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        {error && (
          <div className="error page-error" role="alert">
            {error}{" "}
            <button className="quiet" onClick={() => load().catch(() => {})}>
              Retry
            </button>
          </div>
        )}
        <div role="status" className="save-status">
          {notice}
        </div>
        {view === "calendar" ? (
          <div className="planner-layout">
            <Calendar
              month={month}
              setMonth={setMonth}
              selected={selected}
              selectDate={selectDate}
              events={filtered}
              today={today}
            />
            <aside className="agenda-panel" aria-label="Selected day agenda">
              <p className="eyebrow">
                {selected === today ? "TODAY’S AGENDA" : "DAY AGENDA"}
              </p>
              <h2>
                {localDate(selected).toLocaleDateString("en-US", {
                  weekday: "long",
                })}
              </h2>
              <p className="agenda-date">
                {localDate(selected).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <div className="agenda-divider" />
              {agenda.length ? (
                agenda.map((event) => (
                  <button
                    className="agenda-event"
                    key={event._id}
                    style={{ "--event-color": event.effective_color }}
                    onClick={() => setModal({ kind: "event", data: event })}
                  >
                    <span className="agenda-time">
                      {event.start_time}
                      {event.end_time && ` – ${event.end_time}`}
                    </span>
                    <strong>{event.title}</strong>
                    <span className="agenda-tab">
                      {tabs.find((tab) => tab._id === event.tab_id)?.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  <CalendarDays size={28} />
                  <h3>A little breathing room.</h3>
                  <p>No events scheduled for this date.</p>
                </div>
              )}
              <button
                className="outline-add"
                disabled={!tabs.length || loading}
                onClick={newEvent}
              >
                <Plus size={17} />
                Add an event
              </button>
              <div className="agenda-tasks">
                <div className="section-label">UP NEXT IN YOUR TO-DO LIST</div>
                {tasks
                  .filter((task) => !task.is_completed)
                  .slice(0, 3)
                  .map((task) => (
                    <button
                      key={task._id}
                      className="mini-task"
                      onClick={() => setModal({ kind: "task", data: task })}
                    >
                      <span className="mini-checkbox" />
                      <span>{task.title}</span>
                    </button>
                  ))}
                {!remaining && <p className="hint">You’re all caught up.</p>}
                <button className="quiet" onClick={() => setView("tasks")}>
                  View all tasks
                </button>
              </div>
            </aside>
          </div>
        ) : (
          <section className="tasks-panel" aria-label="To-do list">
            <header>
              <h2>
                Your tasks{" "}
                <span className="task-count">{remaining} remaining</span>
              </h2>
              <p>Tasks stay with your account across all calendar tabs.</p>
            </header>
            {!tasks.length && (
              <div className="empty-state">
                <ListTodo size={30} />
                <h3>Start with one small thing.</h3>
                <p>Create a task and give it a priority.</p>
              </div>
            )}
            {[...tasks]
              .sort(
                (a, b) =>
                  Number(a.is_completed) - Number(b.is_completed) ||
                  ["High", "Medium", "Low"].indexOf(a.priority) -
                    ["High", "Medium", "Low"].indexOf(b.priority),
              )
              .map((task) => (
                <div
                  key={task._id}
                  className={`task-row ${task.is_completed ? "completed" : ""}`}
                >
                  <input
                    aria-label={`Complete ${task.title}`}
                    type="checkbox"
                    checked={task.is_completed}
                    disabled={!!pendingTask}
                    onChange={() => toggleTask(task)}
                  />
                  <button
                    className="task-title"
                    onClick={() => setModal({ kind: "task", data: task })}
                  >
                    {task.title}
                    {task.is_completed && (
                      <small>
                        <Check size={13} />
                        Completed
                      </small>
                    )}
                  </button>
                  <span
                    className={`priority priority-${task.priority.toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                  <button
                    className="quiet"
                    onClick={() => setModal({ kind: "task", data: task })}
                  >
                    Edit
                  </button>
                </div>
              ))}
          </section>
        )}
        <footer className="workspace-footer">
          <span>CSTDA · Combined Scheduling & To-Do List</span>
          <span>Plan a day that feels like yours.</span>
        </footer>
      </main>
      {modal && (
        <Editor
          key={`${modal.kind}-${modal.data._id || "new"}`}
          modal={modal}
          tabs={tabs}
          onClose={() => setModal(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}

function Login({ onLogin, error: parentError }) {
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      onLogin(data.user);
    } catch (error) {
      setError(error.message);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand">
          <span className="brand-mark">
            <CheckCheck size={25} />
          </span>
          CSTDA
        </div>
        <div>
          <p className="eyebrow">LESS SCATTERED. MORE CENTERED.</p>
          <h1>
            Your plans.
            <br />
            Your priorities.
            <br />
            <em>All together.</em>
          </h1>
          <p>
            A calmer place for everything on your calendar and everything on
            your mind.
          </p>
        </div>
        <span className="login-caption">
          Combined Scheduling & To-Do List Application
        </span>
      </section>
      <section className="login-card">
        <CalendarDays size={32} color="#245a48" />
        <h2>Welcome to your day.</h2>
        <p>Log in to your personal workspace.</p>
        <form onSubmit={submit}>
          {(error || parentError) && (
            <p className="error" role="alert">
              {error || parentError}
            </p>
          )}
          <label>
            Username
            <input
              autoFocus
              autoComplete="username"
              required
              maxLength={120}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="login-help">
          Use the account provisioned by your project team.
        </p>
      </section>
    </main>
  );
}
