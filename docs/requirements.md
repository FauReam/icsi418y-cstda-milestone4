# Milestone 4 scope and traceability

Project: Combined Scheduling and To-Do List Application (CSTDA), Team 03.

Sources reviewed: Milestone 1 project proposal; Team03-Milestone 2-Report.pdf; the latest submitted Team03- Milestone 3- Report-1.pdf (Brightspace submission on November 12, 2026 at 11:17 PM); and Milestone_4_Application_Prototype.docx. The PA4 repository was read for prior technology and project conventions. No existing PA repositories were modified.

## Planned MVP: Student/User persona

| Story | Acceptance criteria | Implementation | M3 workflow |
|---|---|---|---|
| US-01 Customizable Calendar | Show events on their dates; navigate dates; selecting a date shows its events or an explicit empty state. | Calendar component and selected-day agenda | UC-01 / UI-01 / process 2.0 |
| US-02 Color Coding | Set category or event colors consistently; changing one does not affect unrelated records. | Tab color editor, inherited colors, event override and reset | UC-02 / UI-03 / processes 3.0, 5.0, 6.0 |
| US-03 Task Prioritization | Assign High/Medium/Low; display priority; change one without affecting others. | Task editor and priority badges | UC-04 / UI-04 / process 4.0 |
| US-04 Tabs | Create tabs, switch between them, and show only each tab’s events. | Sidebar tab controls, create-tab dialog, All combined view | UC-05 / UI-05 / processes 2.0, 3.0, 5.0 |
| US-05 Event Management | Create title/date/time events, edit or delete, and refresh the calendar with saved results. | Event editor, delete confirmation, API persistence | UC-03 / UI-02 / process 3.0 |
| US-06 To-Do List Management | Create/edit/delete tasks; complete tasks; distinguish completed tasks. | Task list, editor, confirmed deletion, checkboxes and strike-through | UC-04 / UI-04 / process 4.0 |

US-07 shared calendars and US-08 repeated events are stretch stories. Neither is implemented or included in completion counts. Login supports NFR-06 and is not a seventh MVP story.

## Nonfunctional targets from M2

| ID | Target | Verification still required for submission |
|---|---|---|
| NFR-01 | Calendar load ≤2 seconds in at least 19/20 trials with 100 events in Chrome. | Collect the defined browser measurements. |
| NFR-02 | Create a basic event within five actions. | Count New event, title, date, start time, Save using the team’s action definition. Defaults avoid extra tab/color steps. |
| NFR-03 | Ten events and ten tasks survive refresh. | Replay in a browser; API restart/session test is included. |
| NFR-04 | Desktop Chrome and Firefox support. | Complete acceptance replay in both browsers. |
| NFR-05 | Keyboard access with visible focus. | Replay navigation, event creation, modal cancellation, and task completion by keyboard. |
| NFR-06 | Unique-password login and private account data. | API tests cover login, ownership, session expiry/logout; complete the UI check. |

## Milestone 4 deliverables

- Complete at least 60% of the original six MVP stories: at least four. Use `completed / 6 × 100`; keep stretch stories outside the denominator.
- A prototype PDF with title, team and names; any scope changes; stories grouped by role; Complete/Incomplete per story; missing work; completion fraction and percentage; actual joint and individual contributions.
- A 3–5 minute running-application video showing every story marked Complete. Use story-ID captions, labels, or narration and show saved observable results, organized around M3 workflows.
- Five-member effort allocation: joint work 25%, each member 15%, total 100%. Describe actual work, rather than infer contributions from these percentages.
- One team member submits both files on Brightspace. The visible posted deadline was **December 1, 2026, 11:59 PM**; confirm the course page before final submission.
- Report filename: `Team03- Milestone 4- Prototype Report.pdf`. Video base filename: `Team03- Milestone 4- Demo` with the chosen video extension. No late submissions are accepted.

The six-story scope is unchanged from M3. This repository is the implementation foundation; its existence does not establish report completion or substitute for the required video.
