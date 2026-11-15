import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

describe("Prisma client initialization", () => {
  it("defers the missing DATABASE_URL error until the first client access", () => {
    const source = `
      import assert from "node:assert/strict";
      const { prisma } = await import("./src/lib/db.ts");
      assert.throws(
        () => Reflect.get(prisma, "product"),
        { message: "DATABASE_URL debe estar configurada." },
      );
    `;
    const env = { ...process.env };
    delete env.DATABASE_URL;
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "--eval", source],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env,
      },
    );

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  });
});
