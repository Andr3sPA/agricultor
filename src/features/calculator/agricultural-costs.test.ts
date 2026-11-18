import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAgriculturalCosts,
  type CalculatorValues,
} from "@/features/calculator/agricultural-costs";

const validValues: CalculatorValues = {
  productionQuantity: "100",
  salePricePerUnit: "2500",
  seeds: "20000",
  supplies: "30000",
  labor: "25000",
  transport: "5000",
  other: "0",
};

test("calculates total and unit cost, expected revenue, profit, and margin", () => {
  const calculation = calculateAgriculturalCosts(validValues);

  assert.deepEqual(calculation.errors, {});
  assert.deepEqual(calculation.result, {
    totalCost: 80000,
    unitCost: 800,
    wholePesoUnitCost: 800,
    expectedRevenue: 250000,
    profit: 170000,
    marginPercent: 68,
  });
});

test("rejects empty values and negative amounts", () => {
  const calculation = calculateAgriculturalCosts({
    ...validValues,
    productionQuantity: "",
    salePricePerUnit: "-1",
    labor: "-5",
  });

  assert.equal(calculation.result, null);
  assert.equal(calculation.errors.productionQuantity, "Este campo es obligatorio.");
  assert.equal(calculation.errors.salePricePerUnit, "El valor no puede ser negativo.");
  assert.equal(calculation.errors.labor, "El valor no puede ser negativo.");
});

test("rejects zero production to avoid division by zero", () => {
  const calculation = calculateAgriculturalCosts({
    ...validValues,
    productionQuantity: "0",
  });

  assert.equal(calculation.result, null);
  assert.match(calculation.errors.productionQuantity ?? "", /mayor que cero/);
});

test("supports Colombian number formats and treats blank costs as zero", () => {
  const { result, errors } = calculateAgriculturalCosts({
    productionQuantity: "2,5",
    salePricePerUnit: "$2.000",
    seeds: "1.250,50",
    supplies: "",
    labor: "",
    transport: "",
    other: "",
  });
  assert.deepEqual(errors, {});
  assert.equal(result?.expectedRevenue, 5000);
  assert.equal(result?.totalCost, 1250.5);
  assert.equal(result?.profit, 3749.5);
});

test("shows costs without treating an undecided sale price as zero income", () => {
  assert.deepEqual(calculateAgriculturalCosts({ ...validValues, salePricePerUnit: "" }), {
    result: {
      totalCost: 80000,
      unitCost: 800,
      wholePesoUnitCost: 800,
      expectedRevenue: null,
      profit: null,
      marginPercent: null,
    },
    errors: {},
  });
});

test("rounds the unit cost up to a whole peso so the estimate covers costs", () => {
  const result = calculateAgriculturalCosts({
    productionQuantity: "2,5",
    salePricePerUnit: "",
    seeds: "1.250,50",
    supplies: "",
    labor: "",
    transport: "",
    other: "",
  }).result;
  assert.equal(result?.unitCost, 500.2);
  assert.equal(result?.wholePesoUnitCost, 501);
});

test("rejects an invalid grouping instead of guessing the amount", () => {
  const { errors } = calculateAgriculturalCosts({
    ...validValues,
    salePricePerUnit: "2.00.0",
    productionQuantity: "2,5 kilos",
  });
  assert.equal(errors.salePricePerUnit, "Ingresa un número válido.");
  assert.equal(errors.productionQuantity, "Ingresa un número válido.");
});

test("accepts zero costs and reports an undefined margin when revenue is zero", () => {
  const calculation = calculateAgriculturalCosts({
    ...validValues,
    salePricePerUnit: "0",
    seeds: "0",
    supplies: "0",
    labor: "0",
    transport: "0",
    other: "0",
  });

  assert.deepEqual(calculation.errors, {});
  assert.equal(calculation.result?.totalCost, 0);
  assert.equal(calculation.result?.unitCost, 0);
  assert.equal(calculation.result?.expectedRevenue, 0);
  assert.equal(calculation.result?.profit, 0);
  assert.equal(calculation.result?.marginPercent, null);
});
