export type OrderRequestField = "productId" | "quantity" | "idempotencyKey";
export type OrderRequestFieldErrors = Partial<
  Record<OrderRequestField, string>
>;

export type OrderRequestInput = {
  productId: string;
  quantity: string;
  idempotencyKey: string;
};

export type OrderRequestValidation =
  | { ok: true; data: OrderRequestInput }
  | { ok: false; errors: OrderRequestFieldErrors };

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseOrderQuantity(value: unknown): string | null {
  const quantity = asString(value).replace(",", ".");
  return /^(?:0|[1-9]\d{0,8})(?:\.\d{1,3})?$/.test(quantity) &&
    Number(quantity) > 0
    ? quantity
    : null;
}

export function validateOrderRequest(
  input: Record<string, unknown>,
): OrderRequestValidation {
  const errors: OrderRequestFieldErrors = {};
  const productId = asString(input.productId);
  const idempotencyKey = asString(input.idempotencyKey);
  const quantity = parseOrderQuantity(input.quantity);

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(productId)) {
    errors.productId = "Selecciona un producto válido.";
  }

  if (!/^[A-Za-z0-9_-]{43}$/.test(idempotencyKey)) {
    errors.idempotencyKey = "Actualiza el formulario para enviar el pedido.";
  }

  if (quantity === null) {
    errors.quantity =
      "Escribe una cantidad mayor que cero, con máximo 3 decimales.";
  }

  if (Object.keys(errors).length > 0 || quantity === null) {
    return { ok: false, errors };
  }

  return { ok: true, data: { productId, quantity, idempotencyKey } };
}

export function parseOrderDecision(
  value: unknown,
): "ACCEPTED" | "REJECTED" | null {
  return value === "ACCEPTED" || value === "REJECTED" ? value : null;
}
