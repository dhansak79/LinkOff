---
name: "Spec: Tasks"
description: Generate implementation task list from design and scenarios, store it in the model, and auto-continue to implement.
category: Spec-Gate
tags: [spec-gate, tasks]
---

Tasks sub-flow for the spec-gate methodology. Handles `designing` phase.

**Input**: Change name (required — resolved by the router).

## Steps

1. **Verify phase**

   Read `.swamp/spec-change-{name}.json`. Phase must be `designing`. If not, report and stop.

2. **Generate task list**

   Using `design_text` and `scenarios`, generate an ordered implementation checklist:
   - Start with setup tasks (dependencies, new files)
   - Then source code changes
   - Then step definition authoring (one group per scenario or step)
   - Then `@wip` removal and verification for the first scenario
   - Number tasks with dot notation (e.g., `1.1`, `1.2`, `2.1`)
   - Tasks must be concrete and unambiguous — each is a unit of work for the implement phase

   Keep the task list complete enough that another agent could resume from any point.

3. **Store tasks**

   Run:
   ```
   swamp model method run spec-change set-tasks --name {name} --tasks '{json}'
   ```
   Each task: `{ "id": "1.1", "description": "..." }`

4. **Announce and auto-continue**

   Display the task list with checkboxes, then load the `/spec:implement` sub-flow.

## Guardrails
- No human gate on tasks — proceed automatically
- Include a task for every scenario's step definitions — they are not optional
- Include a task for removing `@wip` from each scenario once its steps are implemented
- The task list is the unit of /spec:implement — it must be complete
