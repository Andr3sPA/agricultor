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
    assert.equal(getOrderRequestRedirect("/catalogo/p/pedido?producto=papa&producto=yuca"), null);
    assert.equal(getOrderRequestRedirect("/catalogo/p/pedido?producto=papa#otra"), null);
  });

  it("preserves approved catalog filters through sign-in", () => {
    assert.equal(
      getOrderRequestRedirect(
        "/catalogo/p/pedido?pagina=2&orden=precio-asc&municipio=La+Vega&producto=papa",
      ),
      "/catalogo/p/pedido?producto=papa&municipio=La+Vega&orden=precio-asc&pagina=2",
    );
  });
});
