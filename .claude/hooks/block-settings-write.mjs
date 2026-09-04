import { block, readToolInput } from "./hook.mjs";

const { file_path: filePath = "" } = await readToolInput();

if (/\.claude[\\/]settings/.test(filePath)) {
  block("BLOCKED: Writing to Claude settings files is not allowed.");
}
