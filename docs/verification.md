# Framework verification record

Performed November 23, 2026 (America/New_York). Local Node 22.15.0; real MongoDB 8.0 container with a persistent Docker volume; production Vite build served by Express. Browser checks used the current installed Google Chrome on macOS.

## Executed automated checks

- `npm run build`: passed; React frontend compiled for production.
- `npm test`: 10 integration tests passed, 0 failed, against a randomly isolated real MongoDB database. Tests check the six stories’ backend operations, invalid input, ownership isolation, color inheritance/overrides/reset, event reassignment, independent tasks, deletion, HttpOnly cookies, expiry, logout invalidation, and failed-write preservation.
- Persistence test: ten synthetic events and ten synthetic tasks remained available through a new application instance and a fresh login to the same database.
- Injected storage-failure test: an event write returned 500 and the previously saved event was unchanged. The intentional `Request failed: Error` log in that test is expected.

## Executed Chrome checks

Using only a locally provisioned synthetic account:

- Logged in and observed the saved seed events, current month and agenda.
- Created a Work tab, selected it and observed an empty event view.
- Created “Prototype planning” at 10:30 in Work and observed its saved agenda entry and tab count.
- Changed Work’s color from Terracotta to Purple through its color editor.
- Created a High-priority task, observed its label, and marked it complete; observed the checked state, Completed text and reduced remaining count.
- Restarted the database container with the same volume, refreshed Chrome, and observed the saved Work tab, event, and task counts.
- Opened the new-event dialog and verified initial focus on Title; Escape closed it and returned visible focus to New event.

This is a sampled UI check, not a claim that every browser acceptance item has been completed. Automated tests cover additional operations listed above. The final report should distinguish the two.

## Remaining team validation

Replay the full acceptance-checklist.md before setting final report statuses. Specifically, the defined 100-event/20-trial Chrome performance measurement, complete keyboard/screen-reader verification, Firefox replay, all UI edit/delete/cancel/error workflows, and the browser ten-event/ten-task refresh procedure remain to be recorded. No video or final PDF has been produced in this framework task, and member contributions have not been assumed.

All six MVP workflows have implementation paths. Final story completion and percentage are intentionally left for acceptance and demonstration in prototype-report.md. Shared calendars and recurrence are absent.
