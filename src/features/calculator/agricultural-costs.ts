export const COST_CATEGORIES = [
  { key: "seeds", label: "Semillas" },
  { key: "supplies", label: "Fertilizantes e insumos" },
  { key: "labor", label: "Mano de obra" },
  { key: "transport", label: "Transporte" },
  { key: "other", label: "Otros costos" },
] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number]["key"];
export type CalculatorField =
  | "productionQuantity"
  | "salePricePerUnit"
  | CostCategory;

export type CalculatorValues = {
  productionQuantity: string;
  salePricePerUnit: string;
} & Record<CostCategory, string>;

export type CalculatorResult = {
  totalCost: number;
  unitCost: number;
  expectedRevenue: number | null;
  profit: number | null;
  marginPercent: number | null;
};

export type CalculatorCalculation = {
  result: CalculatorResult | null;
  errors: Partial<Record<CalculatorField, string>>;
};

function parseAmount(
  value: string,
  field: CalculatorField,
  errors: Partial<Record<CalculatorField, string>>,
) {
  const trimmed = value.trim();
  if (!trimmed) {
    errors[field] = "Este campo es obligatorio.";
    return null;
  }

  const isCurrency = field !== "productionQuantity";
  const input = isCurrency ? trimmed.replace(/^\$\s*/, "") : trimmed;
  const groupedCurrency = isCurrency && /^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(input);
  const decimal = /^-?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(input);
  const normalized = groupedCurrency ? input.replaceAll(".", "") : input;
  const amount = Number(normalized.replace(",", "."));
  if ((!groupedCurrency && !decimal) || !Number.isFinite(amount)) {
    errors[field] = "Ingresa un número válido.";
    return null;
  }

  if (amount < 0) {
    errors[field] = "El valor no puede ser negativo.";
    return null;
  }

  return amount;
}

export function calculateAgriculturalCosts(
  values: CalculatorValues,
): CalculatorCalculation {
  const errors: Partial<Record<CalculatorField, string>> = {};
  const quantity = parseAmount(values.productionQuantity, "productionQuantity", errors);
  const salePrice = values.salePricePerUnit.trim()
    ? parseAmount(values.salePricePerUnit, "salePricePerUnit", errors)
    : null;
  const costs = COST_CATEGORIES.map(({ key }) =>
    parseAmount(values[key].trim() || "0", key, errors),
  );

  if (quantity === 0) {
    errors.productionQuantity =
      "La cantidad debe ser mayor que cero para calcular el costo por unidad.";
  }

  if (Object.keys(errors).length > 0 || quantity === null) {
    return { result: null, errors };
  }

  const totalCost = costs.reduce<number>((total, cost) => total + (cost ?? 0), 0);
  const expectedRevenue = salePrice === null ? null : quantity * salePrice;
  const unitCost = totalCost / quantity;
  const profit = expectedRevenue === null ? null : expectedRevenue - totalCost;

  if (
    !Number.isFinite(totalCost) ||
    (expectedRevenue !== null && !Number.isFinite(expectedRevenue)) ||
    !Number.isFinite(unitCost) ||
    (profit !== null && !Number.isFinite(profit))
  ) {
    return {
      result: null,
      errors: { productionQuantity: "Los valores ingresados exceden el rango calculable." },
    };
  }

  return {
    result: {
      totalCost,
      unitCost,
      expectedRevenue,
      profit,
      marginPercent: expectedRevenue && profit !== null
        ? (profit / expectedRevenue) * 100
        : null,
    },
    errors: {},
  };
}
