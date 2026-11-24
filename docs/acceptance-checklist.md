# Browser acceptance checklist

Use a dedicated synthetic demo account. Record tester, date, browser version, commit SHA, result, and video timestamp. An implemented story becomes **Complete** in the final report only after its acceptance criteria are demonstrated. Keep stretch stories separate.

## Student/User stories

- [ ] **US-01 / UC-01:** Open a month, navigate forward/back, select a saved-event date and see titles/times. Select an empty date and see the no-events message. Verify events appear under the correct local dates.
- [ ] **US-02 / UC-02:** Change a tab color and save; its inheriting event changes consistently. Set an individual override; change the tab color again and confirm the override stays. Clear the override and confirm inheritance returns. Verify another tab/event keeps its color. Cancel a color change and verify nothing saved.
- [ ] **US-03 / UC-04:** Create High, Medium and Low tasks. Confirm each visible label. Edit one priority and confirm other tasks keep theirs.
- [ ] **US-04 / UC-05:** Create Academic and Work tabs; switch between them; each shows only assigned events. Move an event through its Tab field; confirm it disappears from the old tab and appears in the new one and All with the same ID. Reject empty/duplicate tab names.
- [ ] **US-05 / UC-03:** Create title/date/start-time event, verify saved agenda entry, edit details, verify update. Reject missing title and invalid end time. Cancel a deletion and verify the record remains; confirm deletion of a disposable test event and verify only that event disappears.
- [ ] **US-06 / UC-04:** Create and edit tasks, complete and reopen one. Confirm checked box, strike-through and Completed label. Cancel deletion first; then delete a disposable test task and confirm other tasks remain.

## Nonfunctional checks

- [ ] **NFR-01:** Prepare exactly 100 saved events. Measure calendar load 20 times in Chrome using a consistent start/end definition. Record every duration; at least 19 must be ≤2 seconds. Automated API timings are not this measurement.
- [ ] **NFR-02:** Count New event, entering title, selecting date, entering start time, Save; no extra required category/color action.
- [ ] **NFR-03:** Create ten events and ten tasks, refresh the browser, and verify all twenty. Restart the API and reconnect to the same database as a further check.
- [ ] **NFR-04:** Replay the primary workflows in current desktop Chrome and Firefox and record versions. Check a narrow viewport for overflow.
- [ ] **NFR-05:** Use Tab/Shift+Tab/Enter/Space for calendar selection, event creation and task completion. Verify visible focus, modal focus trap, Escape cancellation and focus return. Listen for validation announcements with a screen reader where available.
- [ ] **NFR-06:** Reject incorrect credentials without exposing saved data; preserve username and clear rejected password. Log out, refresh, and verify login is required. In a second account, verify the first account’s data is absent and foreign-ID API mutations are rejected.
- [ ] **Failure handling:** Stop the dedicated demo database temporarily; verify a load or write error is visible. Restart it, retry, and verify saved records. Confirm failed writes keep form text and the last committed checkbox state. Do not test against important user data.

## Submission gate

- [ ] Set each MVP story to Complete/Incomplete in the report and explain incomplete work.
- [ ] Verify at least 4/6 = 66.7% complete; do not include US-07/08 or login in the denominator.
- [ ] Describe actual joint work and each member’s contributions; ensure effort totals 100%.
- [ ] Record a 3–5 minute video showing every Complete story with visible story IDs and saved outcomes.
- [ ] Export the report to the required PDF filename and check readability.
- [ ] Confirm the posted deadline and submit both files to Brightspace as a team.
