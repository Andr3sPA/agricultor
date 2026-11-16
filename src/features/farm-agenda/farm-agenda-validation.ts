export const FARM_ACTIVITY_TYPES = [
  { value: "SOWING", label: "Siembra" },
  { value: "IRRIGATION", label: "Riego" },
  { value: "FERTILIZATION", label: "Fertilización" },
  { value: "HARVEST", label: "Cosecha" },
  { value: "OTHER", label: "Otra actividad" },
] as const;

export type FarmActivityType =
  (typeof FARM_ACTIVITY_TYPES)[number]["value"];

export type FarmActivityField =
  | "activityType"
  | "scheduledFor"
  | "cropProduct"
  | "notes";
export type FarmActivityFieldErrors = Partial<
  Record<FarmActivityField, string>
>;

export type FarmActivityInput = {
  activityType: FarmActivityType;
  scheduledFor: string;
  cropProduct: string | null;
  notes: string | null;
};

export type FarmActivityValidation =
  | { ok: true; data: FarmActivityInput }
  | { ok: false; errors: FarmActivityFieldErrors };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateFarmActivityInput(
  input: Record<string, unknown>,
): FarmActivityValidation {
  const activityType = asString(input.activityType);
  const scheduledFor = asString(input.scheduledFor);
  const cropProduct = asString(input.cropProduct);
  const notes = asString(input.notes);
  const errors: FarmActivityFieldErrors = {};
  const selectedType = FARM_ACTIVITY_TYPES.find(
    (option) => option.value === activityType,
  );

  if (!selectedType) {
    errors.activityType = "Elige un tipo de actividad.";
  }
  if (!isDateOnly(scheduledFor)) {
    errors.scheduledFor = "Escribe una fecha válida.";
  }
  if (cropProduct.length > 100) {
    errors.cropProduct = "Escribe máximo 100 caracteres.";
  }
  if (notes.length > 1000) {
    errors.notes = "Escribe máximo 1000 caracteres.";
  }

  if (Object.keys(errors).length > 0 || !selectedType) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      activityType: selectedType.value,
      scheduledFor,
      cropProduct: cropProduct || null,
      notes: notes || null,
    },
  };
}
