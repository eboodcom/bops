import assert from "node:assert/strict";
import test from "node:test";
import { authorizeExternalAttachment, ATTACH_CONFIRMATION } from "../lib/external-attach-authorization.ts";
const good = { uiTokenConfigured: true, authenticatedWindow: true, featureEnabled: true, confirmation: ATTACH_CONFIRMATION };
test("requires every authorization condition", () => {
  assert.equal(authorizeExternalAttachment(good), null);
  for (const key of ["uiTokenConfigured", "authenticatedWindow", "featureEnabled"]) {
    assert.notEqual(authorizeExternalAttachment({ ...good, [key]: false }), null);
  }
});
test("rejects missing, partial, and wrong-case confirmations", () => {
  for (const confirmation of [undefined, null, "", "attach existing computer", "ATTACH", true]) {
    assert.notEqual(authorizeExternalAttachment({ ...good, confirmation }), null);
  }
});
