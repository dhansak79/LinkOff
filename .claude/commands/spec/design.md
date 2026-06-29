---
name: "Spec: Design"
description: Generate technical design after scenario approval, store it in the model, and auto-continue to tasks.
category: Spec-Gate
tags: [spec-gate, design]
---

Design sub-flow for the spec-gate methodology. Handles `approved` phase.

**Input**: Change name (required — resolved by the router).

## Steps

1. **Verify phase**

   Read `.swamp/spec-change-{name}.json`. Phase must be `approved`. If not, report and stop.

2. **Generate technical design**

   Using `proposal_text`, `scenarios`, and the existing codebase (`src/`, `extensions/`, `tests/`), write a concise technical design covering:
   - **Approach**: How the requirement will be implemented technically
   - **Files to change**: Which source files will be created or modified and why
   - **Key decisions**: Any technical choices that affect testability or architecture
   - **Step definition strategy**: How the Cucumber step definitions will exercise the code (what to stub, what to invoke directly)
   - **Risk / trade-offs**: Anything non-obvious

   This design is for the agent's implementation guidance — it does not need human approval.

3. **Store design**

   Run:
   ```
   swamp model method run spec-change set-design --name {name} --text "{design_text}"
   ```

4. **Announce and auto-continue**

   Display a brief summary of the design approach, then load the `/spec:tasks` sub-flow.

## Guardrails
- No human gate on design — proceed automatically
- Keep design focused on what the implementation tasks need to know
- Step definition strategy is critical: think now about how each scenario will be tested
