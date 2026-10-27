import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyQueuedStatuses } from "./kds-offline.ts";

describe("applyQueuedStatuses", () => {
  it("moves a ticket to the status still waiting on this screen", () => {
    const next = applyQueuedStatuses(
      [{ id: "kot-1", status: "NEW" }],
      [{ id: "kot-1:PREPARING", body: { status: "PREPARING" } }],
    );
    assert.equal(next[0]?.status, "PREPARING");
  });

  it("keeps the latest queued status when the same ticket moved twice", () => {
    const next = applyQueuedStatuses(
      [{ id: "kot-1", status: "NEW" }],
      [
        { id: "kot-1:ACCEPTED", body: { status: "ACCEPTED" } },
        { id: "kot-1:PREPARING", body: { status: "PREPARING" } },
      ],
    );
    assert.equal(next[0]?.status, "PREPARING");
  });
});
