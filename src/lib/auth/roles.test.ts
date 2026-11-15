import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertHasRole,
  AuthorizationError,
  hasRole,
  isSelfAssignableRole,
} from "./roles";
import { normalizeDisplayName } from "./validation";

describe("role access rules", () => {
  it("allows only public roles to be self-assigned", () => {
    assert.equal(isSelfAssignableRole("PRODUCER"), true);
    assert.equal(isSelfAssignableRole("BUYER"), true);
    assert.equal(isSelfAssignableRole("TRADER"), true);
    assert.equal(isSelfAssignableRole("ASSOCIATION"), false);
    assert.equal(isSelfAssignableRole("ADMIN"), false);
    assert.equal(isSelfAssignableRole("unknown"), false);
    assert.equal(isSelfAssignableRole(null), false);
  });

  it("allows a role holder and denies a user without the required role", () => {
    assert.equal(hasRole(["PRODUCER", "BUYER"], "PRODUCER"), true);
    assert.equal(hasRole(["BUYER"], "PRODUCER"), false);
    assert.throws(
      () => assertHasRole(["BUYER"], "ADMIN"),
      AuthorizationError,
    );
    assert.doesNotThrow(() => assertHasRole(["ADMIN"], "ADMIN"));
  });

  it("normalizes names and rejects invalid lengths", () => {
    assert.equal(normalizeDisplayName("  Ana Pérez  "), "Ana Pérez");
    assert.equal(normalizeDisplayName("A"), null);
    assert.equal(normalizeDisplayName("a".repeat(101)), null);
    assert.equal(normalizeDisplayName(null), null);
  });
});
