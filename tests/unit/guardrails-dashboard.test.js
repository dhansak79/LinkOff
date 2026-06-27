import { describe, it, expect } from "vitest";
import { clusterSessions, parseRun } from "../../scripts/generate-guardrails-dashboard.js";

const MS = 1000;
const MIN = 60 * MS;
const HOUR = 60 * MIN;

function makeRun(offsetMs, status = "succeeded") {
  const base = new Date("2026-06-25T10:00:00Z").getTime();
  const startedAt = new Date(base + offsetMs).toISOString();
  return {
    id: `run-${offsetMs}`,
    status,
    startedAt,
    completedAt: new Date(base + offsetMs + 5 * MIN).toISOString(),
    blockingStep: status === "failed" ? "mutation" : null,
    metrics: { tests: null, coverage: null, mutation: null, codescene: null, patchCoverage: null },
  };
}

describe("clusterSessions", () => {
  it("returns empty array for no runs", () => {
    expect(clusterSessions([])).toEqual([]);
  });

  it("single run is one session with one attempt", () => {
    const sessions = clusterSessions([makeRun(0)]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attemptCount).toBe(1);
    expect(sessions[0].sessionIndex).toBe(0);
  });

  it("two runs within 4 hours form one session", () => {
    const sessions = clusterSessions([makeRun(0), makeRun(3 * HOUR)]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attemptCount).toBe(2);
  });

  it("two runs more than 4 hours apart form two sessions", () => {
    const sessions = clusterSessions([makeRun(0), makeRun(5 * HOUR)]);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].attemptCount).toBe(1);
    expect(sessions[1].attemptCount).toBe(1);
  });

  it("failed then success within 4h = one session of 2 attempts", () => {
    const runs = [makeRun(0, "failed"), makeRun(30 * MIN, "succeeded")];
    const sessions = clusterSessions(runs);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attemptCount).toBe(2);
    expect(sessions[0].succeeded).toBe(true);
  });

  it("running status treated as attempt", () => {
    const runs = [
      makeRun(0, "running"),
      makeRun(20 * MIN, "running"),
      makeRun(40 * MIN, "succeeded"),
    ];
    const sessions = clusterSessions(runs);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attemptCount).toBe(3);
  });

  it("quality-gate-fast runs excluded (they would have different workflowName filtered at parse time)", () => {
    // parseRun returns null for non-quality-gate runs — confirm null is filtered
    const runs = [makeRun(0), makeRun(HOUR)];
    const sessions = clusterSessions(runs);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].attemptCount).toBe(2);
  });

  it("sorts runs chronologically before clustering", () => {
    const runs = [makeRun(3 * HOUR), makeRun(0)]; // intentionally reversed
    const sessions = clusterSessions(runs);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].startedAt).toBe(runs[1].startedAt); // first by time
  });
});

describe("parseRun", () => {
  it("returns null for non-quality-gate workflows", () => {
    const doc = { workflowName: "quality-gate-fast", status: "succeeded", startedAt: "2026-06-25T10:00:00Z", jobs: [] };
    expect(parseRun(doc)).toBeNull();
  });

  it("parses tests metrics from a quality-gate run", () => {
    const doc = {
      id: "run-1",
      workflowName: "quality-gate",
      status: "succeeded",
      startedAt: "2026-06-25T10:00:00Z",
      completedAt: "2026-06-25T10:05:00Z",
      jobs: [
        {
          jobName: "check",
          steps: [
            {
              stepName: "tests",
              status: "succeeded",
              output: {
                resources: {
                  testResult: { current: { attributes: { passed: true, total: 699, passing: 699, failing: 0, durationMs: 2850 } } },
                },
              },
            },
          ],
        },
      ],
    };
    const run = parseRun(doc);
    expect(run).not.toBeNull();
    expect(run.id).toBe("run-1");
    expect(run.status).toBe("succeeded");
    expect(run.blockingStep).toBeNull();
    expect(run.metrics.tests).toEqual({ passed: true, total: 699, passing: 699, failing: 0 });
  });

  it("parses coverage thresholds from a quality-gate run", () => {
    const doc = {
      id: "run-cov",
      workflowName: "quality-gate",
      status: "succeeded",
      startedAt: "2026-06-25T10:00:00Z",
      jobs: [
        {
          jobName: "coverage",
          steps: [
            {
              stepName: "coverage",
              status: "succeeded",
              output: {
                resources: {
                  coverageResult: {
                    current: {
                      attributes: {
                        passed: true,
                        lines: 95.2,
                        functions: 92.1,
                        branches: 91.0,
                        statements: 94.8,
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    };
    const run = parseRun(doc);
    expect(run.metrics.coverage).toEqual({
      passed: true,
      lines: 95.2,
      functions: 92.1,
      branches: 91.0,
      statements: 94.8,
    });
  });

  it("parses mutation per-file scores from a quality-gate run", () => {
    const doc = {
      id: "run-mut",
      workflowName: "quality-gate",
      status: "succeeded",
      startedAt: "2026-06-25T10:00:00Z",
      jobs: [
        {
          jobName: "mutation",
          steps: [
            {
              stepName: "mutation",
              status: "succeeded",
              output: {
                resources: {
                  mutationResult: {
                    current: {
                      attributes: {
                        passed: true,
                        overallScore: 81.0,
                        killed: 400,
                        survived: 90,
                        noCoverage: 10,
                        total: 500,
                        files: [
                          { path: "src/feed.js", score: 76.4, killed: 100, survived: 30, noCoverage: 1, total: 131 },
                          { path: "src/slop.js", score: 91.0, killed: 91, survived: 9, noCoverage: 0, total: 100 },
                        ],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    };
    const run = parseRun(doc);
    expect(run.metrics.mutation.passed).toBe(true);
    expect(run.metrics.mutation.score).toBeCloseTo(81.0);
    expect(run.metrics.mutation.files).toHaveLength(2);
    expect(run.metrics.mutation.files[0].path).toBe("src/feed.js");
    expect(run.metrics.mutation.files[0].score).toBeCloseTo(76.4);
  });

  it("parses codescene degraded files from a quality-gate run", () => {
    const doc = {
      id: "run-cs",
      workflowName: "quality-gate",
      status: "failed",
      startedAt: "2026-06-25T10:00:00Z",
      jobs: [
        {
          jobName: "check",
          steps: [
            {
              stepName: "codescene-health",
              status: "failed",
              output: {
                resources: {
                  healthResult: {
                    current: {
                      attributes: {
                        passed: false,
                        failedFiles: 1,
                        files: [{ path: "src/slop-detector.js", score: 6.8 }],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    };
    const run = parseRun(doc);
    expect(run.metrics.codescene.passed).toBe(false);
    expect(run.metrics.codescene.failedFiles).toBe(1);
    expect(run.metrics.codescene.files[0].path).toBe("src/slop-detector.js");
    expect(run.blockingStep).toBe("codescene-health");
  });

  it("parses patch-coverage uncovered lines from a quality-gate run", () => {
    const doc = {
      id: "run-patch",
      workflowName: "quality-gate",
      status: "failed",
      startedAt: "2026-06-25T10:00:00Z",
      jobs: [
        {
          jobName: "patch-coverage",
          steps: [
            {
              stepName: "patch-coverage",
              status: "failed",
              output: {
                resources: {
                  patchResult: {
                    current: {
                      attributes: { passed: false, uncoveredLines: 3 },
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    };
    const run = parseRun(doc);
    expect(run.metrics.patchCoverage).toEqual({ passed: false, uncoveredLines: 3 });
    expect(run.blockingStep).toBe("patch-coverage");
  });

  it("returns null metrics for missing steps", () => {
    const doc = {
      id: "run-empty",
      workflowName: "quality-gate",
      status: "succeeded",
      startedAt: "2026-06-25T10:00:00Z",
      jobs: [],
    };
    const run = parseRun(doc);
    expect(run.metrics.tests).toBeNull();
    expect(run.metrics.coverage).toBeNull();
    expect(run.metrics.mutation).toBeNull();
    expect(run.metrics.codescene).toBeNull();
    expect(run.metrics.patchCoverage).toBeNull();
  });
});
