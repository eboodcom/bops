import assert from "node:assert/strict";
import test from "node:test";
import { ownerWorkspaceForComputer } from "../lib/attachment-ownership.ts";

const id = "cc5f24e5-3e35-4ca2-ad4a-2ca8d8f82c39";
const ws = { id: "workspace-1", name: "Personal", role: "owner", desktops: [{ id }] };

test("explicit owner role and matching desktop establish evidence", () => {
  assert.equal(ownerWorkspaceForComputer([ws], id), ws);
  assert.equal(ownerWorkspaceForComputer([ws], id.toUpperCase()), ws);
});
test("shared roles and missing role never prove ownership", () => {
  for (const role of [undefined, "member", "admin", "viewer", "editor"]) {
    assert.equal(ownerWorkspaceForComputer([{ ...ws, role }], id), undefined);
  }
});
test("missing or unrelated desktop membership never proves ownership", () => {
  assert.equal(ownerWorkspaceForComputer([{ ...ws, desktops: undefined }], id), undefined);
  assert.equal(ownerWorkspaceForComputer([{ ...ws, desktops: [] }], id), undefined);
  assert.equal(ownerWorkspaceForComputer([{ ...ws, desktops: [{ id: "other" }] }], id), undefined);
});
test("finds only explicitly owned matching workspace among mixed entries", () => {
  assert.equal(ownerWorkspaceForComputer([{ ...ws, role: "member" }, { ...ws, id: "owned" }], id)?.id, "owned");
});
