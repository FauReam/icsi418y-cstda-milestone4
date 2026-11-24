import { useState } from "react";
import { Dialog } from "./Dialog";
const colors = [
  ["#245a48", "Forest"],
  ["#3966b5", "Blue"],
  ["#8b52a1", "Purple"],
  ["#bf5c38", "Terracotta"],
  ["#a67518", "Gold"],
  ["#b94670", "Rose"],
];
export function ColorPicker({ value, onChange, inherit = false }) {
  return (
    <fieldset className="palette">
      <legend>Color</legend>
      {inherit && (
        <label className="inherit">
          <input
            type="radio"
            name="color"
            value=""
            checked={!value}
            onChange={() => onChange(null)}
          />{" "}
          Use tab color
        </label>
      )}
      <div className="swatches">
        {colors.map(([color, name]) => (
          <label
            key={color}
            className={`swatch ${value === color ? "chosen" : ""}`}
            style={{ "--swatch": color }}
          >
            <input
              type="radio"
              name="color"
              value={color}
              checked={value === color}
              onChange={() => onChange(color)}
            />
            <span aria-hidden="true" />
            {name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function Footer({ busy, onClose, existing, onDelete }) {
  return (
    <footer className="form-footer">
      {existing && (
        <button
          type="button"
          className="danger-quiet"
          disabled={busy}
          onClick={onDelete}
        >
          Delete
        </button>
      )}
      <span className="spacer" />
      <button
        type="button"
        className="secondary"
        onClick={onClose}
        disabled={busy}
      >
        Cancel
      </button>
      <button className="primary" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
    </footer>
  );
}
export function Editor({ modal, tabs, onClose, onSave, onDelete }) {
  const { kind, data } = modal;
  const [form, setForm] = useState(data),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [confirm, setConfirm] = useState(false);
  const change = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const name =
    kind === "event"
      ? "event"
      : kind === "task"
        ? "task"
        : kind === "tabColor"
          ? "tab color"
          : "tab";
  async function perform(action) {
    setError("");
    setBusy(true);
    try {
      await action();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={
        confirm ? `Delete ${name}?` : `${data._id ? "Edit" : "New"} ${name}`
      }
      onClose={onClose}
      busy={busy}
    >
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {confirm ? (
        <div className="editor-form">
          <p>
            “{form.title}” will be removed from your saved{" "}
            {name === "task" ? "to-do list" : "calendar"}.
          </p>
          <p>This cannot be undone in the app.</p>
          <footer className="form-footer">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Keep {name}
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={() => perform(() => onDelete(kind, data._id))}
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </footer>
        </div>
      ) : (
        <form
          className="editor-form"
          onSubmit={(event) => {
            event.preventDefault();
            perform(() => onSave(kind, form));
          }}
        >
          {kind !== "tabColor" && (
            <label>
              {kind === "tab" ? "Tab name" : "Title"}
              <input
                autoFocus
                required
                maxLength={120}
                value={form.title ?? form.name ?? ""}
                onChange={(event) =>
                  change(kind === "tab" ? "name" : "title", event.target.value)
                }
              />
            </label>
          )}
          {kind === "event" && (
            <>
              <label>
                Date
                <input
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  required
                  value={form.date}
                  onChange={(event) => change("date", event.target.value)}
                />
              </label>
              <div className="field-row">
                <label>
                  Start time
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(event) =>
                      change("start_time", event.target.value)
                    }
                  />
                </label>
                <label>
                  End time <span className="optional">(optional)</span>
                  <input
                    type="time"
                    value={form.end_time || ""}
                    onChange={(event) => change("end_time", event.target.value)}
                  />
                </label>
              </div>
              <label>
                Tab
                <select
                  value={form.tab_id}
                  onChange={(event) => change("tab_id", event.target.value)}
                >
                  {tabs.map((tab) => (
                    <option key={tab._id} value={tab._id}>
                      {tab.name}
                    </option>
                  ))}
                </select>
              </label>
              <ColorPicker
                value={form.color_override}
                onChange={(value) => change("color_override", value)}
                inherit
              />
            </>
          )}
          {kind === "task" && (
            <label>
              Priority
              <select
                value={form.priority}
                onChange={(event) => change("priority", event.target.value)}
              >
                {["High", "Medium", "Low"].map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
          )}
          {(kind === "tab" || kind === "tabColor") && (
            <>
              <p className="hint">
                Events without a color override inherit this tab’s color.
              </p>
              <ColorPicker
                value={form.default_color}
                onChange={(value) => change("default_color", value)}
              />
            </>
          )}
          <Footer
            busy={busy}
            onClose={onClose}
            existing={!!data._id && ["event", "task"].includes(kind)}
            onDelete={() => setConfirm(true)}
          />
        </form>
      )}
    </Dialog>
  );
}
