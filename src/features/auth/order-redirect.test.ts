import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getOrderRequestRedirect } from "./order-redirect";

describe("order request sign-in redirect", () => {
  it("allows only a same-site product request route", () => {
    assert.equal(
      getOrderRequestRedirect("/catalogo/clxProduct_1/pedido"),
      "/catalogo/clxProduct_1/pedido",
    );
    assert.equal(getOrderRequestRedirect(undefined), null);
    assert.equal(getOrderRequestRedirect(["/catalogo/product-1/pedido"]), null);
    assert.equal(
      getOrderRequestRedirect("https://example.com/catalogo/product-1/pedido"),
      null,
    );
    assert.equal(getOrderRequestRedirect("//example.com/path"), null);
    assert.equal(getOrderRequestRedirect("/catalogo/product-1/pedido?next=/"), null);
    assert.equal(getOrderRequestRedirect("/catalogo/%2Fexample/pedido"), null);
    assert.equal(getOrderRequestRedirect("/mi-cuenta"), null);
  });
});
