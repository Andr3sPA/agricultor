import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPublicProductOrderHref,
  getPublicProducts,
} from "./public-products";

describe("public catalog projection", () => {
  it("excludes private, withdrawn, and zero-quantity products", () => {
    const products = [
      {
        id: "published-yuca",
        name: "Yuca",
        category: "TUBERS",
        availableQuantity: "4.5",
        unit: "KG",
        priceCOP: 3200,
        municipality: "La Vega",
        isPublished: true,
      },
      {
        id: "private-corn",
        name: "Maíz privado",
        category: "GRAINS",
        availableQuantity: "8",
        unit: "KG",
        priceCOP: 2800,
        municipality: "La Vega",
        isPublished: false,
      },
      {
        id: "withdrawn-beans",
        name: "Fríjol retirado",
        category: "GRAINS",
        availableQuantity: "6",
        unit: "KG",
        priceCOP: 5000,
        municipality: "La Vega",
        isPublished: false,
      },
      {
        id: "sold-out-product",
        name: "Producto agotado",
        category: "OTHER",
        availableQuantity: "0",
        unit: "UNIT",
        priceCOP: 1000,
        municipality: "La Vega",
        isPublished: true,
      },
    ];

    assert.deepEqual(getPublicProducts(products), [
      {
        id: "published-yuca",
        name: "Yuca",
        category: "TUBERS",
        availableQuantity: "4.5",
        unit: "KG",
        priceCOP: 3200,
        municipality: "La Vega",
      },
    ]);
    assert.equal(
      getPublicProductOrderHref(getPublicProducts(products)[0].id),
      "/catalogo/published-yuca/pedido",
    );
  });

  it("returns only approved public fields, even if private fields are present", () => {
    const product = {
      id: "public-yuca-id",
      name: "Yuca",
      category: "TUBERS",
      availableQuantity: "4.5",
      unit: "KG",
      priceCOP: 3200,
      municipality: "La Vega",
      isPublished: true,
      ownerId: "owner-private",
      email: "private@example.test",
      phone: "3000000000",
      preciseAddress: "Dirección privada 123",
    };

    const [publicProduct] = getPublicProducts([product]);

    assert.deepEqual(Object.keys(publicProduct), [
      "id",
      "name",
      "category",
      "availableQuantity",
      "unit",
      "priceCOP",
      "municipality",
    ]);
    assert.equal("ownerId" in publicProduct, false);
    assert.equal("email" in publicProduct, false);
    assert.equal("phone" in publicProduct, false);
    assert.equal("preciseAddress" in publicProduct, false);
  });
});
