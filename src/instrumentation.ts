import type { Instrumentation } from "next";
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  // No request headers, query strings, provider payloads, or exception messages.
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : null;
  console.error(JSON.stringify({ event: "request_error", digest, method: request.method, route: context.routePath, router: context.routerKind }));
};
