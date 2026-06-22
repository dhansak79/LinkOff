## Why

Spec scenarios and tests exist in parallel but disconnected worlds — there is no way to know which scenarios have test coverage and which don't, and existing tests are coupled to implementation internals rather than observable behavior. This makes tests fragile across refactors and leaves coverage gaps invisible.

## What Changes

- **New script** `scripts/spec-coverage.js` — two modes: global (parses `openspec/specs/*/spec.md`, reports all scenarios) and change-scoped (`--change <name>`, parses only `openspec/changes/<name>/specs/`, counts only ADDED and MODIFIED scenarios, exits 1 on any missing)
- **New npm script** `spec:coverage` in `package.json` (global mode; change-scoped invoked directly by the archive gate)
- **New boundary test files** in `tests/spec/` — one per capability spec — that drive the extension through the public `feed.js` default export and assert DOM outcomes; named exactly after their spec scenarios so the parser finds them
- **New skill** `.claude/skills/spec-coverage/SKILL.md` — documents when and how to run spec coverage, interpret output, and write missing boundary tests
- **Modified** `.claude/commands/opsx/archive.md` and `.claude/skills/openspec-archive-change/SKILL.md` — add a hard spec-coverage gate (step 3.5) that runs `node scripts/spec-coverage.js --change <name>` before archiving; exit code 1 blocks archive with no confirm option
- Existing unit tests in `tests/features/` are left untouched

## Capabilities

### New Capabilities

- `spec-coverage`: Developer tooling that parses spec markdown and cross-references test files to surface which scenarios have boundary-level test coverage and which are missing

### Modified Capabilities

_None._

## Impact

- **New files**: `scripts/spec-coverage.js`, `tests/spec/_helpers.js`, `tests/spec/tone-filter.spec.test.js`, `tests/spec/semantic-filter.spec.test.js`, `tests/spec/author-whitelist.spec.test.js`, `tests/spec/author-unfollow.spec.test.js`, `tests/spec/banner-author-display.spec.test.js`, `.claude/skills/spec-coverage/SKILL.md`
- **Modified**: `package.json` (add `spec:coverage` script), `.claude/commands/opsx/archive.md`, `.claude/skills/openspec-archive-change/SKILL.md`
- **Dependencies**: No new runtime deps; parser uses Node.js built-ins only
- **Test scope**: `tests/spec/` tests drive `src/features/feed.js` default export; mock only the ML pipeline (transformers.js) and `chrome.*` APIs at true system boundaries
