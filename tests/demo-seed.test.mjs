import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getSafeLocalDatabaseConfig,
  requireTestDatabaseUrl,
} from "../scripts/seed-demo.mjs";

describe("demo seed database safety", () => {
  it("accepts only a local disposable test database", () => {
    assert.deepEqual(
      getSafeLocalDatabaseConfig(
        "postgresql://tester:local-only@localhost:5433/agricultor_test_demo",
      ),
      {
        host: "localhost",
        port: 5433,
        database: "agricultor_test_demo",
        user: "tester",
        password: "local-only",
        ssl: false,
      },
    );
  });

  it("rejects remote, production-named, and non-PostgreSQL databases", () => {
    for (const url of [
      "postgresql://user:pass@db.example.com/agricultor_test_demo",
      "postgresql://user:pass@localhost/agricultor_production",
      "mysql://user:pass@localhost/agricultor_test_demo",
    ]) {
      assert.throws(() => getSafeLocalDatabaseConfig(url), /local disposable/);
    }
  });

  it("rejects malformed or out-of-range ports", () => {
    assert.throws(
      () => getSafeLocalDatabaseConfig("not-a-url"),
      /valid PostgreSQL URL/,
    );
    assert.throws(
      () =>
        getSafeLocalDatabaseConfig(
        "postgresql://user:pass@localhost:0/agricultor_test_demo",
        ),
      /local disposable/,
    );
  });

  it("never falls back to DATABASE_URL", () => {
    assert.throws(
      () =>
        requireTestDatabaseUrl({
          DATABASE_URL: "postgresql://user:pass@remote.example.com/production",
        }),
      /DATABASE_URL is never used/,
    );
  });
});
