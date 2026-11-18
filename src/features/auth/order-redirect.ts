export function getOrderRequestRedirect(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^\/catalogo\/([A-Za-z0-9_-]+)\/pedido$/.exec(value);
  return match ? `/catalogo/${encodeURIComponent(match[1])}/pedido` : null;
}
