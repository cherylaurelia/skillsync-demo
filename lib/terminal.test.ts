import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { answer, header, parseLog, shorten } from "./terminal.ts";

const log = (name: string) => readFileSync(new URL(`../data/${name}.log`, import.meta.url), "utf8");

test("shortens the sandbox binary paths to the command names", () => {
  assert.equal(
    shorten("timeout 600 /tmp/codexbin/node_modules/.bin/codex exec resume x"),
    "codex exec resume x",
  );
  assert.equal(shorten("/tmp/txfix-bin continue f042"), "txcript continue f042");
  assert.equal(shorten("~/.codex at /tmp/txrun-after/.codex"), "~/.codex at ~/.codex");
});

test("splits a log into commands and their output, dropping the Codex banner", () => {
  const steps = parseLog(
    [
      "# before: txcript 0.14.4",
      "$ codex exec resume abc hi",
      "OpenAI Codex v0.167.0",
      "--------",
      "provider: ollama-local",
      "model: qwen3",
      "hi",
      "codex",
      "heron",
      "tokens used",
      "691",
      "heron",
    ].join("\n"),
  );

  assert.deepEqual(steps, [
    { command: "codex exec resume abc hi", output: ["provider: ollama-local", "heron"] },
  ]);
});

test("ignores output before the first command", () => {
  assert.deepEqual(parseLog("stray\n$ ls\na"), [{ command: "ls", output: ["a"] }]);
});

test("the recorded before run ends in Codex's provider mismatch", () => {
  const steps = parseLog(log("before"));
  assert.match(steps.at(-1)?.output.join("\n") ?? "", /This chat uses openai, but your current provider is ollama-local/);
  assert.match(header(log("before")), /^before: txcript 0\.14\.4, codex-cli 0\.167\.0/);
});

test("the recorded after run resumes and recalls the button", () => {
  const steps = parseLog(log("after"));
  const last = steps.at(-1)?.output ?? [];
  assert.match(last.join("\n"), /Label: "?Cancel"?, Style: "?ghost"?/);
  assert.ok(!last.some((line) => line.includes("modelProviderMismatch")));
});

test("the crop copy recalls the word only after the fix", () => {
  assert.match(parseLog(log("crop-before")).at(-1)?.output.join("\n") ?? "", /modelProviderMismatch/);
  assert.ok(parseLog(log("crop-after")).at(-1)?.output.includes("heron"));
});

test("the no-history control can't answer", () => {
  assert.match(answer(log("control")), /^I don't have access to previous conversation context/);
  assert.equal(answer("# h\n\ntokens used\n42\nhello"), "hello");
});
