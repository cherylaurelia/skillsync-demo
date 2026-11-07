// Turns a recorded run log into terminal steps for the page. The logs are the
// raw output of data/research/skillsync/runs/*.sh: lines starting with "$ "
// are commands, everything after one is its output.

export interface Step {
  command: string;
  output: string[];
}

// Codex prints a banner before every exec; it is the same on every run and
// hides the line that matters, so it is dropped from the page (the raw logs
// keep it).
const BANNER =
  /^(OpenAI Codex v|-{4,}|workdir:|approval:|sandbox:|reasoning |session id:|user$|codex$|tokens used$|\d[\d,]*$|Reading additional input|warning: Model metadata|model: )/;

const TOOL_PATHS: [RegExp, string][] = [
  [/\/tmp\/txfix-bin\b/g, "txcript"],
  [/\/tmp\/txcript\/target\/release\/txcript\b/g, "txcript"],
  [/timeout \d+ \/tmp\/codexbin\/node_modules\/\.bin\/codex\b/g, "codex"],
  [/\/tmp\/txrun-(before|after)\b/g, "~"],
];

export function shorten(line: string): string {
  return TOOL_PATHS.reduce((text, [pattern, name]) => text.replace(pattern, name), line);
}

export function parseLog(log: string): Step[] {
  const steps: Step[] = [];

  for (const raw of log.split("\n")) {
    if (raw.startsWith("# ") || raw.trim() === "") continue;
    const line = shorten(raw);

    if (line.startsWith("$ ")) {
      steps.push({ command: line.slice(2), output: [] });
      continue;
    }

    const current = steps.at(-1);

    if (!current || BANNER.test(line.trim())) continue;

    // Codex prints its final answer twice (stream, then summary) and echoes
    // the prompt from the command line; keep neither copy.
    if (current.output.at(-1) === line || current.command.endsWith(line)) continue;
    current.output.push(line);
  }

  return steps;
}

// The header line of a log: "# <label>: <versions>, <timestamp>".
export function header(log: string): string {
  const first = log.split("\n", 1)[0] ?? "";

  return first.startsWith("# ") ? first.slice(2) : "";
}

// The model's answer in a log with no "$ " command lines (the control run):
// its first line that isn't the header or Codex's token count.
export function answer(log: string): string {
  return (
    log
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line !== "" && !line.startsWith("# ") && !BANNER.test(line)) ?? ""
  );
}
