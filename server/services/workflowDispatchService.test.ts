import { describe, expect, it } from "vitest";
import {
  getWorkflowJobFailureState,
  isWorkflowJobLockStale,
  type WorkflowJobFailureStateInput,
} from "./workflowDispatchService";

describe("workflowDispatchService helpers", () => {
  it("requeues failed jobs when attempts remain", () => {
    const input: WorkflowJobFailureStateInput = {
      attempts: 1,
      maxAttempts: 3,
      now: new Date("2026-03-20T00:00:00.000Z"),
    };

    const result = getWorkflowJobFailureState(input);

    expect(result.status).toBe("queued");
    expect(result.shouldRetry).toBe(true);
    expect(result.availableAt.toISOString()).toBe("2026-03-20T00:00:02.000Z");
    expect(result.completedAt).toBeNull();
  });

  it("caps retry backoff at 30 seconds", () => {
    const input: WorkflowJobFailureStateInput = {
      attempts: 10,
      maxAttempts: 20,
      now: new Date("2026-03-20T00:00:00.000Z"),
    };

    const result = getWorkflowJobFailureState(input);

    expect(result.status).toBe("queued");
    expect(result.availableAt.toISOString()).toBe("2026-03-20T00:00:30.000Z");
  });

  it("marks jobs as failed when retries are exhausted", () => {
    const input: WorkflowJobFailureStateInput = {
      attempts: 3,
      maxAttempts: 3,
      now: new Date("2026-03-20T00:00:00.000Z"),
    };

    const result = getWorkflowJobFailureState(input);

    expect(result.status).toBe("failed");
    expect(result.shouldRetry).toBe(false);
    expect(result.availableAt.toISOString()).toBe("2026-03-20T00:00:00.000Z");
    expect(result.completedAt?.toISOString()).toBe("2026-03-20T00:00:00.000Z");
  });

  it("detects stale workflow job locks", () => {
    expect(
      isWorkflowJobLockStale(
        new Date("2026-03-20T00:00:00.000Z"),
        60_000,
        new Date("2026-03-20T00:01:01.000Z")
      )
    ).toBe(true);
    expect(
      isWorkflowJobLockStale(
        new Date("2026-03-20T00:00:30.000Z"),
        60_000,
        new Date("2026-03-20T00:01:00.000Z")
      )
    ).toBe(false);
    expect(
      isWorkflowJobLockStale(null, 60_000, new Date("2026-03-20T00:01:00.000Z"))
    ).toBe(false);
  });
});
