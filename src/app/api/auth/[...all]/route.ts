import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

type AuthHandlers = ReturnType<typeof toNextJsHandler>;

let handlers: AuthHandlers | undefined;

function getHandlers(): AuthHandlers {
  handlers ??= toNextJsHandler(getAuth());
  return handlers;
}

export const GET: AuthHandlers["GET"] = (...args) =>
  getHandlers().GET(...args);
export const POST: AuthHandlers["POST"] = (...args) =>
  getHandlers().POST(...args);
