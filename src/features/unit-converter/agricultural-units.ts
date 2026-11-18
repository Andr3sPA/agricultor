export const UNIT_CATEGORIES = [
  {
    key: "mass",
    label: "Peso",
    units: [
      { key: "lb500", label: "Libras de 500 g", priceUnit: "libra de 500 g", exponent: 3, half: true },
      { key: "kg", label: "Kilogramos (kg)", priceUnit: "kilo", exponent: 3 },
      { key: "g", label: "Gramos (g)", priceUnit: "gramo", exponent: 0 },
      { key: "t", label: "Toneladas (t)", priceUnit: "tonelada", exponent: 6 },
    ],
  },
  {
    key: "area",
    label: "Área",
    units: [
      { key: "m2", label: "Metros cuadrados (m²)", exponent: 0 },
      { key: "ha", label: "Hectáreas (ha)", exponent: 4 },
    ],
  },
  {
    key: "volume",
    label: "Volumen",
    units: [
      { key: "l", label: "Litros (L)", exponent: 0 },
      { key: "m3", label: "Metros cúbicos (m³)", exponent: 3 },
    ],
  },
] as const;

export type UnitCategoryKey = (typeof UNIT_CATEGORIES)[number]["key"];

type UnitCategory = (typeof UNIT_CATEGORIES)[number];

export type UnitConversion =
  | { value: string; error: null }
  | { value: null; error: string };

function normalizeDecimal(value: string) {
  const [whole = "0", fraction = ""] = value.split(".");
  const digits = `${whole}${fraction}`.replace(/^0+/, "") || "0";
  const decimalPlaces = fraction.length;

  if (digits === "0") {
    return "0";
  }

  const shiftedDecimalPlaces = decimalPlaces;
  if (shiftedDecimalPlaces === 0) {
    return digits;
  }

  const splitAt = digits.length - shiftedDecimalPlaces;
  const normalized =
    splitAt > 0
      ? `${digits.slice(0, splitAt)}.${digits.slice(splitAt)}`
      : `0.${"0".repeat(-splitAt)}${digits}`;

  return normalized.includes(".")
    ? normalized.replace(/0+$/, "").replace(/\.$/, "")
    : normalized;
}

function shiftDecimal(value: string, places: number) {
  const [whole, fraction = ""] = value.split(".");
  const digits = `${whole}${fraction}`;
  const decimalPosition = whole.length + places;

  if (decimalPosition <= 0) {
    return `0.${"0".repeat(-decimalPosition)}${digits}`;
  }
  if (decimalPosition >= digits.length) {
    return `${digits}${"0".repeat(decimalPosition - digits.length)}`;
  }

  return `${digits.slice(0, decimalPosition)}.${digits.slice(decimalPosition)}`;
}

function multiplyDecimalByInteger(value: string, multiplier: bigint) {
  const [whole, fraction = ""] = value.split(".");
  const digits = BigInt(`${whole}${fraction}`);
  return shiftDecimal((digits * multiplier).toString(), -fraction.length);
}

function findUnit(categoryKey: UnitCategoryKey, unitKey: string) {
  const category = UNIT_CATEGORIES.find(
    (item): item is UnitCategory => item.key === categoryKey,
  );
  return category?.units.find((unit) => unit.key === unitKey);
}

export function convertAgriculturalUnits(
  input: string,
  category: UnitCategoryKey,
  fromUnit: string,
  toUnit: string,
): UnitConversion {
  const value = input.trim();
  if (!value) {
    return { value: null, error: "Ingresa una cantidad para convertir." };
  }

  if (!/^-?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(value)) {
    return { value: null, error: "Ingresa un número válido." };
  }

  if (value.startsWith("-")) {
    return { value: null, error: "La cantidad no puede ser negativa." };
  }

  const from = findUnit(category, fromUnit);
  const to = findUnit(category, toUnit);
  if (!from || !to) {
    return { value: null, error: "Selecciona unidades de la misma categoría." };
  }

  const normalizedInput = value.replace(",", ".");
  const normalized = normalizeDecimal(normalizedInput);
  let converted = shiftDecimal(normalized, from.exponent - to.exponent);
  const fromHalf = "half" in from;
  const toHalf = "half" in to;
  if (fromHalf && !toHalf) {
    converted = shiftDecimal(multiplyDecimalByInteger(converted, BigInt(5)), -1);
  } else if (toHalf && !fromHalf) {
    converted = multiplyDecimalByInteger(converted, BigInt(2));
  }

  return {
    value: normalizeDecimal(converted),
    error: null,
  };
}

export function calculateWeightPrice(quantity: string, input: string): UnitConversion {
  const price = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(price)) {
    return {
      value: null,
      error: "Escribe un precio en pesos enteros, por ejemplo 2000 o 2.000.",
    };
  }

  const total = multiplyDecimalByInteger(quantity, BigInt(price.replaceAll(".", "")));
  const [whole, fraction = ""] = total.split(".");
  const roundUp = fraction.charAt(0) >= "5";
  return {
    value: (BigInt(whole) + BigInt(roundUp ? 1 : 0)).toString(),
    error: null,
  };
}

export function formatAgriculturalValue(value: string) {
  const [whole, fraction] = value.split(".");
  const groupedWhole = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(BigInt(whole || "0"));

  return fraction ? `${groupedWhole},${fraction}` : groupedWhole;
}

export function getUnitLabel(category: UnitCategoryKey, unitKey: string) {
  return findUnit(category, unitKey)?.label ?? "";
}
