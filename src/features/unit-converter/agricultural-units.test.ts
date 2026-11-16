import assert from "node:assert/strict";
import test from "node:test";
import {
  convertAgriculturalUnits,
  formatAgriculturalValue,
} from "@/features/unit-converter/agricultural-units";

test("converts mass units without losing decimal precision", () => {
  assert.deepEqual(convertAgriculturalUnits("1250", "mass", "g", "kg"), {
    value: "1.25",
    error: null,
  });
  assert.deepEqual(convertAgriculturalUnits("0,000001", "mass", "t", "g"), {
    value: "1",
    error: null,
  });
  assert.deepEqual(convertAgriculturalUnits("0.1", "mass", "kg", "g"), {
    value: "100",
    error: null,
  });
});

test("converts area and volume units", () => {
  assert.deepEqual(convertAgriculturalUnits("1.2345", "area", "ha", "m2"), {
    value: "12345",
    error: null,
  });
  assert.deepEqual(convertAgriculturalUnits("2500", "volume", "l", "m3"), {
    value: "2.5",
    error: null,
  });
  assert.deepEqual(convertAgriculturalUnits("0.001", "volume", "m3", "l"), {
    value: "1",
    error: null,
  });
});

test("accepts zero and preserves exact decimal results", () => {
  assert.deepEqual(convertAgriculturalUnits("0", "mass", "g", "t"), {
    value: "0",
    error: null,
  });
  assert.deepEqual(convertAgriculturalUnits("0.0000001", "mass", "g", "t"), {
    value: "0.0000000000001",
    error: null,
  });
  assert.equal(formatAgriculturalValue("12345678901234567890.0000001"), "12.345.678.901.234.567.890,0000001");
});

test("rejects empty, non-numeric, negative, and mismatched units", () => {
  assert.match(
    convertAgriculturalUnits(" ", "mass", "g", "kg").error ?? "",
    /Ingresa una cantidad/,
  );
  assert.match(
    convertAgriculturalUnits("abc", "mass", "g", "kg").error ?? "",
    /número válido/,
  );
  assert.match(
    convertAgriculturalUnits("-2", "mass", "g", "kg").error ?? "",
    /negativa/,
  );
  assert.match(
    convertAgriculturalUnits("2", "mass", "g", "ha").error ?? "",
    /misma categoría/,
  );
});
