export const PRODUCT_CATEGORIES = [
  { value: "FRUITS", label: "Frutas" },
  { value: "VEGETABLES", label: "Hortalizas" },
  { value: "TUBERS", label: "Tubérculos" },
  { value: "GRAINS", label: "Granos y cereales" },
  { value: "OTHER", label: "Otro" },
] as const;

export const PRODUCT_UNITS = [
  { value: "KG", label: "Kilogramo (kg)" },
  { value: "UNIT", label: "Unidad" },
  { value: "ARROBA", label: "Arroba" },
  { value: "BULTO", label: "Bulto" },
  { value: "CANASTILLA", label: "Canastilla" },
] as const;

export type ProductField =
  | "name"
  | "category"
  | "availableQuantity"
  | "unit"
  | "priceCOP"
  | "municipality";

export type ProductFieldErrors = Partial<Record<ProductField, string>>;

export type ProductInput = {
  name: string;
  category: (typeof PRODUCT_CATEGORIES)[number]["value"];
  availableQuantity: string;
  unit: (typeof PRODUCT_UNITS)[number]["value"];
  priceCOP: number;
  municipality: string;
};

export type ProductValidation =
  | { ok: true; data: ProductInput }
  | { ok: false; errors: ProductFieldErrors };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseProductPrice(value: unknown): number | null {
  const rawPrice = asString(value).replace(/^\$\s*/, "");
  const digits = /^\d{1,3}(?:\.\d{3})+$/.test(rawPrice)
    ? rawPrice.replaceAll(".", "")
    : rawPrice;
  const price = /^\d{1,10}$/.test(digits) ? Number(digits) : 0;
  return price >= 1 && price <= 2_147_483_647 ? price : null;
}

export const PRODUCT_PRICE_ERROR =
  "Escribe un precio entero mayor que cero en pesos colombianos.";

export const PRODUCT_QUANTITY_ERROR =
  "Escribe una cantidad válida, con máximo 3 decimales.";

export function parseProductQuantity(value: unknown): string | null {
  const quantity = asString(value).replace(",", ".");
  return /^\d{1,9}(?:\.\d{1,3})?$/.test(quantity) ? quantity : null;
}

export function validateProductInput(
  input: Record<string, unknown>,
): ProductValidation {
  const errors: ProductFieldErrors = {};
  const name = asString(input.name);
  const category = asString(input.category);
  const quantity = parseProductQuantity(input.availableQuantity);
  const unit = asString(input.unit);
  const priceCOP = parseProductPrice(input.priceCOP);
  const municipality = asString(input.municipality);
  const categoryOption = PRODUCT_CATEGORIES.find(
    (option) => option.value === category,
  );
  const unitOption = PRODUCT_UNITS.find((option) => option.value === unit);

  if (name.length < 2 || name.length > 100) {
    errors.name = "Escribe un nombre entre 2 y 100 caracteres.";
  }

  if (!categoryOption) {
    errors.category = "Elige una categoría de la lista.";
  }

  if (quantity === null) {
    errors.availableQuantity = PRODUCT_QUANTITY_ERROR;
  }

  if (!unitOption) {
    errors.unit = "Elige una unidad de la lista.";
  }

  if (priceCOP === null) {
    errors.priceCOP = PRODUCT_PRICE_ERROR;
  }

  if (municipality.length < 2 || municipality.length > 100) {
    errors.municipality = "Escribe un municipio o localidad entre 2 y 100 caracteres.";
  }

  if (Object.keys(errors).length > 0 || !categoryOption || !unitOption || priceCOP === null || quantity === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      category: categoryOption.value,
      availableQuantity: quantity,
      unit: unitOption.value,
      priceCOP,
      municipality,
    },
  };
}

export function getAvailabilityLabel(quantity: string | number): string {
  return Number(quantity) > 0 ? "Disponible" : "Agotado";
}
