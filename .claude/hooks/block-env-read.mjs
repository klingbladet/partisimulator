import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

if (/\.env($|\.|\s)/.test(command)) {
  block("BLOCKED: .env files are protected. Use .env.example with placeholders only.");
}
