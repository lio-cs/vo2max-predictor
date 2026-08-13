/**
 * LLM observability (LangFuse) — registered once when the Next.js server starts.
 * Per the mentor's guidance: Gemini token usage is non-linear and can quietly exhaust
 * free-tier limits, so tracing generations (not just logging outcomes) was flagged as a
 * priority, not optional. No-ops if LangFuse isn't configured, so the app still runs without
 * it — see .env.local.example.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) return;

  const { NodeSDK } = await import("@opentelemetry/sdk-node");
  const { LangfuseSpanProcessor } = await import("@langfuse/otel");

  const sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()],
  });
  sdk.start();
}
