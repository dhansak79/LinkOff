---
name: "Spec: Implement"
description: Work through implementation tasks in order, calling complete-task after each, showing N/M progress. Does not auto-verify.
category: Spec-Gate
tags: [spec-gate, implement, tasks]
---

Implement sub-flow for the spec-gate methodology. Handles `tasking` and `implementing` phases.

**Input**: Change name (required — resolved by the router).

## Steps

1. **Verify phase and resolve state**

   Read `.swamp/spec-change-{name}.json`. Phase must be `tasking` or `implementing`.

   If phase is `tasking`, transition first:
   ```
   swamp model method run spec-change start-implementing --name {name}
   ```

2. **Show progress**

   ```
   ## Implementing: {name}
   Progress: {done}/{total} tasks complete
   Scenarios: {N} ({passing} pass / {pending} pending)

   Pending tasks:
   - [ ] {id}: {description}
   ...
   ```

3. **Work through tasks in order (loop until done or blocked)**

   For each pending task:
   - Announce: "Working on task {id}/{total}: {description}"
   - Implement the task (code changes, file creation, step definition authoring, etc.)
   - Immediately after completing: call `swamp model method run spec-change complete-task --name {name} --id {id}`
   - Announce: "✓ Task {id} complete"
   - Continue to next task

   **Pause if:**
   - Task is unclear or reveals a design conflict → report and ask for guidance
   - Implementation uncovers a scenario that is wrong → suggest `/spec:scenarios` to revise
   - Error or blocker → report clearly and wait

4. **On completion or pause, show status**

   ```
   ## Implement status: {name}
   Progress: {done}/{total} tasks complete
   ```
   If all tasks done: "All tasks complete. Run `/spec:verify` to run the BDD suite and check scenario statuses."
   If paused: explain why and wait.

## Guardrails
- Call `complete-task` immediately after finishing each task — do not batch
- Do NOT auto-verify or auto-continue to verify — the user controls when to verify
- When writing step definitions, wire them to the actual `src/` code — no stubs that always pass
- After writing step definitions for a scenario, remove `@wip` from that scenario's entry in the feature file
- Keep changes minimal and scoped to the current task
- If the design is wrong, pause — do not improvise beyond the task spec
