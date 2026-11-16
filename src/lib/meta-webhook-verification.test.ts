import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyMetaWebhookRequest } from "./meta-webhook-verification";

const VERIFY_TOKEN = "meta-webhook-test-token";

function createRequest(query: string): Request {
  return new Request(`https://example.test/api/meta/webhook?${query}`);
}

describe("Meta webhook verification", () => {
  it("returns the challenge for a valid subscription verification request", async () => {
    const response = verifyMetaWebhookRequest(
      createRequest(
        "hub.mode=subscribe&hub.verify_token=meta-webhook-test-token&hub.challenge=challenge-value",
      ),
      VERIFY_TOKEN,
    );

    assert.equal(response.status, 200);
    assert.equal(await response.text(), "challenge-value");
  });

  it("rejects an incorrect verify token", () => {
    const response = verifyMetaWebhookRequest(
      createRequest(
        "hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=challenge-value",
      ),
      VERIFY_TOKEN,
    );

    assert.equal(response.status, 403);
  });

  it("rejects requests missing any required query parameter", () => {
    const queries = [
      "hub.verify_token=meta-webhook-test-token&hub.challenge=challenge-value",
      "hub.mode=subscribe&hub.challenge=challenge-value",
      "hub.mode=subscribe&hub.verify_token=meta-webhook-test-token",
    ];

    for (const query of queries) {
      assert.equal(
        verifyMetaWebhookRequest(createRequest(query), VERIFY_TOKEN).status,
        400,
      );
    }
  });

  it("reports unavailable configuration without exposing the token", () => {
    const response = verifyMetaWebhookRequest(
      createRequest(
        "hub.mode=subscribe&hub.verify_token=meta-webhook-test-token&hub.challenge=challenge-value",
      ),
      undefined,
    );

    assert.equal(response.status, 503);
  });

  it("rejects modes other than subscribe", () => {
    const response = verifyMetaWebhookRequest(
      createRequest(
        "hub.mode=unsubscribe&hub.verify_token=meta-webhook-test-token&hub.challenge=challenge-value",
      ),
      VERIFY_TOKEN,
    );

    assert.equal(response.status, 403);
  });
});
