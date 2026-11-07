import { readFileSync } from "node:fs";
import { join } from "node:path";
import { answer, header, parseLog, type Step } from "./terminal";

export interface Run {
  name: string;
  header: string;
  steps: Step[];
}

// Read once at build time from the logs recorded in data/.
function read(name: string): string {
  return readFileSync(join(process.cwd(), "data", `${name}.log`), "utf8");
}

export function loadRun(name: string): Run {
  const log = read(name);

  return { name, header: header(log), steps: parseLog(log) };
}

export function loadAnswer(name: string): string {
  return answer(read(name));
}
