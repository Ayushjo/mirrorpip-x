// Minimal Server-Sent Events helper. Pushes the result of `produce()` on connect
// and then on an interval, until the client disconnects. No Redis needed — each
// connection polls the DB server-side and pushes changes to that one client.

export function sseStream(
  req: Request,
  produce: () => Promise<unknown>,
  intervalMs = 3000,
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* controller already closed */
        }
      };
      const tick = async () => {
        try {
          send(await produce());
        } catch (err) {
          send({ error: String(err) });
        }
      };

      await tick(); // initial payload
      const timer = setInterval(tick, intervalMs);
      // Comment line as a keep-alive so proxies don't drop an idle connection.
      const beat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(': keep-alive\n\n'));
          } catch {
            /* noop */
          }
        }
      }, 20_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        clearInterval(beat);
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };
      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
