import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

if (/(DROP\s|DELETE\s+FROM|TRUNCATE\s|ALTER\s+TABLE.*DROP)/i.test(command)) {
  block(`Blocked: destructive SQL detected in command: ${command}`);
}
