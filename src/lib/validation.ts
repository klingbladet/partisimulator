import { z } from "zod";
import { PARTIES } from "./parties";

// A real session can run long, but nothing legitimate needs more turns than this per request -
// past it, a payload is more likely a forged history inflating LLM token cost than a real chat.
const MAX_HISTORY_ENTRIES = 40;

const CONTROL_CHAR_CODES = [
  ...Array.from({ length: 9 }, (_, index) => index), // U+0000-U+0008
  11,
  12, // U+000B, U+000C
  ...Array.from({ length: 18 }, (_, index) => index + 14), // U+000E-U+001F
  ...Array.from({ length: 5 }, (_, index) => index + 0x200b), // zero-width chars, U+200B-U+200F
  0xfeff, // byte-order mark
];
const HIDDEN_CHARS = new RegExp(`[${CONTROL_CHAR_CODES.map((code) => String.fromCharCode(code)).join("")}]`, "g");

/**
 * Strips zero-width and control characters a payload could use to hide or pad content past a
 * naive length check, then enforces the cap the UI's own maxLength already promises - the server
 * can't trust that promise unless it re-checks it here, since any of these routes can be called
 * directly, bypassing the input's maxLength entirely.
 */
function freeText(maxLength: number) {
  return z
    .string()
    .transform((value) => value.normalize("NFKC").replace(HIDDEN_CHARS, "").trim())
    .pipe(z.string().min(1).max(maxLength));
}

const chatHistoryEntrySchema = z.object({
  content: freeText(1000),
  role: z.enum(["user", "assistant"]),
});

export const askRequestSchema = z.object({
  history: z.array(chatHistoryEntrySchema).max(MAX_HISTORY_ENTRIES).optional(),
  partyId: z.string().min(1),
  question: freeText(500),
});

export const askAllRequestSchema = z.object({
  question: freeText(500),
});

const debateHistoryEntrySchema = z.object({
  speakerName: freeText(200),
  text: freeText(1000),
});

export const debateRequestSchema = z.object({
  history: z.array(debateHistoryEntrySchema).max(MAX_HISTORY_ENTRIES),
  isClosingStatement: z.boolean().optional(),
  nextSpeakerId: z.string().min(1),
  selectedParties: z.array(z.string().min(1)).min(1).max(PARTIES.length),
  topic: freeText(500),
});
