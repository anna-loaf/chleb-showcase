// Funkcja Vercel: POST /api/chat → server/chat.js (tam cała logika i jedyne wywołanie Claude API).
import { handleChat } from '../server/chat.js';

export function POST(request) {
  return handleChat(request, process.env);
}
