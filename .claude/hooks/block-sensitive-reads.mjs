import { block, readToolInput } from "./hook.mjs";

const { command = "" } = await readToolInput();

const sensitivePatterns = "\\.env|\\.pem|\\.key|id_rsa|id_ed25519|credentials";

// catch the read paths the deny rules don't look at
const readers = "xxd|strings|base64|od|hexdump|dd|python3?|node|perl|ruby";

if (new RegExp(`(${readers})\\s.*(${sensitivePatterns})`, "i").test(command)) {
  block(`Blocked: reading sensitive file via Bash: ${command}`);
}
