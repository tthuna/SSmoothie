// Run: node tests/color.test.mjs  (checks the palette logic of libraryroot.custom.js)
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

new Function(readFileSync(new URL("../libraryroot.custom.js", import.meta.url), "utf8"))(); // no `document`: only defines SmoothieColor
const { remap, flatten, recolor } = globalThis.SmoothieColor;

assert.equal(remap("#1a9fff"), "#2383e2"); // Steam blue -> accent blue
assert.equal(remap("#66c0f4"), "#529cca"); // Steam link blue -> accent blue text
assert.equal(remap("#66c0f4", true), "#adadad"); // blue text -> neutral
assert.match(remap("#171d25"), /^#(..)\1\1$/); // blue-grey surface -> neutral grey
assert.equal(remap("#5c7e10"), "#5c7e10"); // green kept
assert.match(remap("rgba(29, 34, 39, 0.75)"), /^rgba\((\d+),\1,\1,0\.75\)$/); // CSSOM spacing, alpha kept
assert.equal(flatten("linear-gradient(to right, #2383e2 5%, #1a44c2 60%)"), "#2383e2"); // blue gradient -> solid
assert.equal(flatten("linear-gradient(to top, #242424 18px, rgba(0, 0, 0, 0) 100%)"), null); // fade kept
assert.equal(flatten("linear-gradient(#404040 0%, rgba(64, 64, 64, 0.2) 100%)"), "rgba(64,64,64,0.6)"); // panel flattened
assert.equal(recolor("1px solid rgb(26, 159, 255)"), "1px solid #2383e2");
console.log("color tests ok");
