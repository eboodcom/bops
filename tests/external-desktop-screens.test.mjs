import assert from "node:assert/strict";
import test from "node:test";
import { publicAttachedScreens } from "../lib/external-desktop-screens.ts";
test("screen projection only includes safe public geometry", () => {
  const result = publicAttachedScreens([{id:"screen-1",width:1920,height:1080,default:true,vnc_port:5900,vnc_password:"secret",ws_port:8888}]);
  assert.deepEqual(result,[{id:"screen-1",width:1920,height:1080,default:true}]);
  assert.equal(JSON.stringify(result).includes("secret"),false);
});
test("rejects duplicates, malformed IDs and dimensions", () => {
  for (const screens of [
    [{id:"a",width:10,height:10},{id:"a",width:10,height:10}],
    [{id:"../etc",width:10,height:10}],
    [{id:"a",width:0,height:10}],
    [{id:"a",width:10,height:1.5}],
    Array.from({length:17},(_,i)=>({id:"s"+i,width:10,height:10}))
  ]) assert.deepEqual(publicAttachedScreens(screens),[]);
});
