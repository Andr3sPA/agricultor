import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateWeightPrice,
  convertAgriculturalUnits,
  formatAgriculturalValue,
} from "@/features/unit-converter/agricultural-units";

test("converts 500 g pounds exactly in either direction", () => {
  assert.equal(convertAgriculturalUnits("10", "mass", "lb500", "kg").value, "5");
  assert.equal(convertAgriculturalUnits("1,25", "mass", "kg", "lb500").value, "2.5");
  assert.equal(convertAgriculturalUnits("250", "mass", "g", "lb500").value, "0.5");
  assert.equal(convertAgriculturalUnits("0.1", "mass", "lb500", "g").value, "50");
});

test("calculates a COP estimate from the converted weight and rounds half up", () => {
  assert.deepEqual(calculateWeightPrice("5", "2.000"), {
    value: "10000",
    error: null,
  });
  assert.equal(calculateWeightPrice("0.5", "101").value, "51");
  assert.equal(calculateWeightPrice("0.49", "1").value, "0");
  assert.equal(calculateWeightPrice("5", "0").value, "0");
  assert.equal(calculateWeightPrice("5", "2,50").value, null);
});

test("converts arrobas of 12.5 kg across pounds, kilograms and tonnes", () => {
  assert.equal(convertAgriculturalUnits("1", "mass", "arroba125", "kg").value, "12.5");
  assert.equal(convertAgriculturalUnits("0,5", "mass", "arroba125", "lb500").value, "12.5");
  assert.equal(convertAgriculturalUnits("25", "mass", "lb500", "arroba125").value, "1");
  assert.equal(convertAgriculturalUnits("1", "mass", "t", "arroba125").value, "80");
});

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
