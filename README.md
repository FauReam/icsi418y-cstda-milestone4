# CSTDA · Milestone 4 prototype foundation

Combined Scheduling and To-Do List Application for ICSI 418Y, Team 03.
React + Vite frontend, Express/Node API, MongoDB persistence. This standalone repository follows the Team 03 Milestone 1–3 design and the structure used in the PA2–PA4 assignments.

The foundation implements the six MVP workflows: month/day calendar, category and event colors, task priorities, category tabs, event CRUD, and task CRUD/completion. Login protects each account’s saved data. Shared calendars and recurring events remain out of scope.

**Milestone 4 requires at least 60% of the six planned MVP stories, so at least four stories must pass their acceptance criteria.** The submission also needs a PDF report and a 3–5 minute annotated video. This repository supplies the application and preparation templates; final team acceptance, actual contribution statements, the PDF, and the recorded video remain team work.

## Run locally

Prerequisites: Node.js 22.15+ and a running Docker engine, or an existing MongoDB instance. All commands below run from the repository root.

```bash
npm ci
cp .env.example .env
npm run db:up
npm run seed -- --demo
npm run dev
```

Open **http://127.0.0.1:5173**. The seed command prints the `student` account’s randomly generated password once. Save it locally. Re-running seed preserves an existing password and records. For a separate account, set `SEED_USERNAME` before running seed; `SEED_PASSWORD` is optional and must be 12–256 characters. These variables can be placed in the ignored root `.env` file. Never commit credentials.

The database script works without the Docker Compose plugin. It creates only the labeled `cstda-m4-mongo` container and the `cstda-m4-data` volume, binding port 27018 to loopback. Run `npm run db:down` to stop that container while retaining its volume. For an existing database, set `MONGO_URI` and a dedicated `MONGO_DB` in `.env` and skip `db:up`. An optional `compose.yaml` is also provided; use one database startup method at a time.

For a single server with the built frontend:

```bash
npm run build
npm start
```

Then open **http://127.0.0.1:9000**. Stop `npm run dev` first if it is already using port 9000. Vite’s development proxy targets API port 9000; update `client/vite.config.js` if changing it.

## Verify

```bash
npm test
npm run build
```

Tests require MongoDB at `mongodb://127.0.0.1:27018`, or set `MONGO_TEST_URI`. Each run creates a randomly named `cstda_test_*` database and drops only that database afterward. Tests cover ownership, invalid input, event reassignment, color inheritance/overrides, task isolation, session expiry/logout, persistence, and failed writes. GitHub Actions runs the same tests and build against a MongoDB service.

See [verification results](docs/verification.md) for the checks actually performed and the remaining manual checks. API checks alone are not the completed Milestone 2 browser acceptance procedure.

## Work on the project

```text
client/src/
  App.jsx                    Account state, navigation, save/reload flow
  components/Calendar.jsx    UI-01 calendar and date navigation
  components/Editors.jsx     UI-02/03/04/05 forms and delete confirmation
  components/Dialog.jsx      Keyboard modal and focus return
  api.js                     Same-origin API client
  styles.css                 Responsive interface and focus indicators
server/src/
  app.js                     Authenticated API routes and ownership checks
  auth.js                    Salted password hashes and opaque sessions
  validation.js              Shared API input rules
  db.js                      MongoDB connection and indexes
  seed.js                    Account and General-tab provisioning
docs/
  requirements.md            M2 story IDs, M3 rules, and M4 deliverables
  architecture.md            Data model and API contract
  acceptance-checklist.md    Browser acceptance procedure
  prototype-report.md       Report template; fill actual outcomes/work
  demo-script.md            4-minute story-labeled video plan
  verification.md           Executed checks and remaining limitations
  handoff-zh.md              中文交接说明
```

## Design decisions

- A category is a stored Tab. Each new account has General. All is a combined view.
- An event has exactly one tab. Moving it preserves its ID and changes membership atomically in one document update.
- Effective event color is `color_override ?? tab.default_color`; clearing an override restores inheritance.
- Tasks belong to users, independent of tabs. Priority defaults to Medium; completion defaults to false.
- Dates are local calendar strings with single-day start/end times. End time, if supplied, must follow start time. The UI and seed use the device’s local time zone; use the same time zone for the demonstration.
- Login uses salted scrypt hashes and random HttpOnly/SameSite=Strict session cookies. The server stores only token digests and enforces expiry and ownership on each saved-data request. Seed provisioning replaces signup, as specified in M3.
- The app uses its own `cstda` database and does not migrate PA2–PA4 passwords or data.

This is a local classroom prototype. For external hosting, configure HTTPS and `COOKIE_SECURE=true`, database authentication, deployment configuration, and operational account provisioning. Password reset, multi-user tab sharing, recurrence, pagination, and public deployment are not implemented.

## Team

Matthew Higgins, Klayton Demale, Jiayu Liao, Yu-Fan Lin, and Gopika Madhurima Sarvepalli. Record each member’s actual Milestone 4 work in the report; prior milestone responsibilities do not establish new contributions.

Course source documents were reviewed locally. Original reports, private course attachments, credentials, and runtime database contents are not included in this repository.
