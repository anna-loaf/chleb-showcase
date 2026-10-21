// Tryb próbny tylko dla `npm run dev` bez klucza API: udaje strumień Chleba, nic nie kosztuje.
// Na Vercelu nie jest używany.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function mockChatResponse(body) {
  const last = body?.messages?.at(-1);
  const parts = typeof last?.content === 'string' ? [last.content] : (last?.content ?? []).map((p) => p?.text ?? '');
  const question = parts.at(-1)?.replace(/\s+/g, ' ').trim().slice(0, 120) || '…';
  const reply =
    `*Tryb próbny — w pliku .env nie ma ANTHROPIC_API_KEY, więc odpowiadam bez modelu.*\n\n` +
    `Dostałem: „${question}”. Gdy dodasz klucz, odpowie prawdziwy Chleb.\n\n` +
    `Na dziś i tak konkret:\n- **10 minut dykcji** (łamańce, nagraj ostatnie podejście)\n- jedno zgłoszenie do agencji — mail, 3 zdjęcia, CV`;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o) => controller.enqueue(encoder.encode(`${JSON.stringify(o)}\n`));
      await wait(500);
      for (const token of reply.match(/\S+\s*/g)) {
        send({ t: 'text', v: token });
        await wait(25);
      }
      send({
        t: 'done',
        model: 'tryb-probny',
        stop: 'end_turn',
        usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      });
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8' } });
}
