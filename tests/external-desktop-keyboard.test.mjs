import assert from "node:assert/strict";
import test from "node:test";
import { authorizeAttachedType, TYPE_CONFIRMATION, validAttachedText, sameOriginWrite } from "../lib/external-desktop-keyboard.ts";
const good = { authenticated:true, featureEnabled:true, ownerVerified:true, identityVerified:true, attached:true, running:true, confirmation:TYPE_CONFIRMATION };
test("keyboard requires every approval and verification gate", () => {
  assert.equal(authorizeAttachedType(good), null);
  for (const key of ["authenticated","featureEnabled","ownerVerified","identityVerified","attached","running"])
    assert.notEqual(authorizeAttachedType({...good,[key]:false}),null);
  assert.notEqual(authorizeAttachedType({...good,confirmation:"yes"}),null);
});
test("reject control characters and large typing payloads", () => {
  assert.equal(validAttachedText("Hello Boppy!"),true);
  for (const value of ["", "a".repeat(201), "hello\nworld", "x\u0000y", "x\ty", 12])
    assert.equal(validAttachedText(value),false);
});
test("write requests must have matching origin", () => {
  const url="https://bops.example/api/computers/attached-type";
  assert.equal(sameOriginWrite(new Request(url,{headers:{Origin:"https://bops.example"}})),true);
  for (const origin of ["https://evil.example","null","http://bops.example"])
    assert.equal(sameOriginWrite(new Request(url,{headers:{Origin:origin}})),false);
  assert.equal(sameOriginWrite(new Request(url)),false);
});
