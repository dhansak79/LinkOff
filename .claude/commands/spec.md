---
name: "Spec: Router"
description: Entry point for the spec-gate workflow. Routes to the correct sub-flow based on the current phase of the named change, or lists available changes.
category: Spec-Gate
tags: [spec-gate, requirements, bdd]
---

Entry router for the spec-gate methodology. Routes to the appropriate sub-flow for a change.

**Input**: Optionally specify a change name (e.g., `/spec semantic-filter`). If omitted, list available changes.

## Steps

1. **Resolve the change name**

   If a name is provided, use it. Otherwise:
   - Run `swamp model get spec-change --json` to list all changes
   - If only one change exists and it is not `archived`, use it automatically
   - If multiple changes exist, use **AskUserQuestion** to let the user select

2. **Read current phase**

   Read the state file at `{projectDir}/.swamp/spec-change-{name}.json`.
   If it does not exist, the change has not been created yet — offer to start with `/spec:propose`.

3. **Route by phase**

   | Phase | Action |
   |-------|--------|
   | `draft` | Load `/spec:propose` sub-flow |
   | `proposal-pending-approval` | Load `/spec:propose` sub-flow (present existing proposal for approval) |
   | `proposal-approved` | Load `/spec:scenarios` sub-flow |
   | `scenarios-pending-approval` | Load `/spec:scenarios` sub-flow (present existing scenarios for approval) |
   | `approved` | Load `/spec:design` sub-flow |
   | `designing` | Load `/spec:tasks` sub-flow |
   | `tasking` | Load `/spec:implement` sub-flow |
   | `implementing` | Load `/spec:implement` sub-flow (resume progress) |
   | `verifying` | Load `/spec:verify` sub-flow |
   | `archived` | Report complete; suggest starting a new change |

4. **Show status header before routing**

   ```
   ## Spec: {name}
   Phase: {phase}
   Scenarios: {N} ({passing} pass / {failing} fail / {pending} pending)
   Tasks: {done}/{total} complete
   ```
   Then proceed with the routed sub-flow.

## Guardrails
- Always read the state file before routing — do not rely on conversation memory for phase
- Announce the routed sub-flow before executing it
- If the state file is missing, offer `/spec:propose` to create the change
