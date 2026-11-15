import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canEditProduct, canManageProducts } from "./product-access";
import {
  getAvailabilityLabel,
  validateProductInput,
} from "./product-validation";

const validInput = {
  name: "Producto",
  category: "FRUITS",
  availableQuantity: "12,5",
  unit: "KG",
  priceCOP: "2500",
  municipality: "Pueblo",
};

describe("product management policies and validation", () => {
  it("accepts valid product fields and normalizes decimal quantities", () => {
    const result = validateProductInput(validInput);

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.availableQuantity, "12.5");
      assert.equal(result.data.priceCOP, 2500);
    }
  });

  it("rejects malformed, negative, and over-precision quantities", () => {
    for (const availableQuantity of ["-1", "1.1234", "1e3", ""]) {
      const result = validateProductInput({ ...validInput, availableQuantity });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.ok(result.errors.availableQuantity);
      }
    }
  });

  it("rejects invalid categories, units, prices, and localities", () => {
    const result = validateProductInput({
      ...validInput,
      category: "UNKNOWN",
      unit: "UNKNOWN",
      priceCOP: "0",
      municipality: "x",
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.errors.category);
      assert.ok(result.errors.unit);
      assert.ok(result.errors.priceCOP);
      assert.ok(result.errors.municipality);
    }
  });

  it("allows only producers to manage products and only their owner to edit", () => {
    assert.equal(canManageProducts(["PRODUCER"]), true);
    assert.equal(canManageProducts(["BUYER"]), false);
    assert.equal(
      canEditProduct({ userId: "producer-1", roles: ["PRODUCER"] }, "producer-2"),
      false,
    );
    assert.equal(
      canEditProduct({ userId: "producer-1", roles: ["PRODUCER"] }, "producer-1"),
      true,
    );
  });

  it("derives availability from quantity so zero is always sold out", () => {
    assert.equal(getAvailabilityLabel("0.000"), "Agotado");
    assert.equal(getAvailabilityLabel("0.125"), "Disponible");
  });
});
