import { loadAnswer, loadRun, type Run } from "@/lib/runs";

const REPO = "https://github.com/cherylaurelia/skillsync-demo";

const BRANCH =
  "https://github.com/skillsynchq/txcript/compare/main...cherylaurelia:txcript:fix/codex-configured-provider";

const CODEX_ISSUE = "https://github.com/openai/codex/issues/58865";

const CODE_LINE =
  "https://github.com/skillsynchq/txcript/blob/c60e686e7ed30e67019288eed80c4be478512d64/src/harness/codex.rs#L530";

const LOGS = `${REPO}/tree/main/data`;

function tone(line: string): string {
  if (/Error:|modelProviderMismatch|"model_provider":"openai"/.test(line)) return "text-bad";

  if (/Label: "?Cancel|^heron$|"model_provider":"ollama-local"/.test(line)) return "text-good";

  return "text-term-dim";
}

function Terminal({ run, title, verdict }: { run: Run; title: string; verdict: string }) {
  return (
    <figure className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-term shadow-sm">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="ml-2 font-mono text-xs text-term-dim">{title}</span>
      </div>
      <pre className="flex-1 overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-term-ink">
        {run.steps.map((step) => (
          <span key={step.command} className="block pb-3">
            <span className="text-orange">$ </span>
            <span className="whitespace-pre-wrap break-all">{step.command}</span>
            {step.output.map((line, i) => (
              <span key={`${step.command}-${i}`} className={`block whitespace-pre-wrap break-all ${tone(line)}`}>
                {line}
              </span>
            ))}
          </span>
        ))}
      </pre>
      <figcaption className="border-t border-white/10 px-4 py-2.5 font-mono text-xs text-term-ink">
        {verdict}
      </figcaption>
    </figure>
  );
}

export default function Page() {
  const before = loadRun("before");
  const after = loadRun("after");
  const cropBefore = loadRun("crop-before");
  const cropAfter = loadRun("crop-after");
  const control = loadAnswer("control");

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <nav className="mb-12 flex flex-wrap items-center justify-between gap-4">
        <span className="font-mono text-sm tracking-wide text-muted">txcript · continue --with codex</span>
        <div className="flex flex-wrap gap-2">
          <a href={BRANCH} className="rounded-md bg-ink px-4 py-2 text-sm text-panel hover:bg-black">
            Fix branch
          </a>
          <a href={REPO} className="rounded-md border border-line bg-panel px-4 py-2 text-sm hover:border-ink">
            Demo repo
          </a>
        </div>
      </nav>

      <header className="max-w-3xl">
        <p className="mb-5 inline-block rounded bg-line px-3 py-1 font-mono text-xs tracking-[0.15em] text-muted uppercase">
          Recorded with Codex 0.167.0 on Ollama
        </p>
        <h1 className="text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
          <code className="font-mono text-[0.8em]">txcript continue <span className="whitespace-nowrap">--with codex</span></code> fails for anyone
          whose Codex isn&rsquo;t on OpenAI.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          <strong className="font-medium text-ink">Problem:</strong> Codex 0.166+ refuses a session recorded under a
          different provider, and txcript writes{" "}
          <a href={CODE_LINE} className="font-mono text-base text-orange-ink underline underline-offset-2">
            &quot;model_provider&quot;: &quot;openai&quot;
          </a>{" "}
          into every Codex session.
        </p>
        <p className="mt-3 text-lg leading-relaxed text-muted">
          <strong className="font-medium text-ink">Fix:</strong> write the provider set in the user&rsquo;s{" "}
          <code className="font-mono text-base">config.toml</code>. The same copy then resumes, and the model
          answers from the carried-over history.
        </p>
      </header>

      <section className="mt-14" aria-labelledby="handoff">
        <h2 id="handoff" className="text-xl font-medium">
          Claude Code session → Codex
        </h2>
        <p className="mt-2 max-w-3xl text-muted">
          One short Claude Code session (it created a <code className="font-mono">ghost</code> button labeled
          Cancel), continued into Codex with <code className="font-mono">model_provider = &quot;ollama-local&quot;</code>
          , then asked what it did earlier.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Terminal run={before} title="before · txcript main c60e686" verdict="✗ Codex won't open the copy" />
          <Terminal run={after} title="after · fix branch" verdict="✓ resumes and recalls the earlier turns" />
        </div>
      </section>

      <section className="mt-14" aria-labelledby="crop">
        <h2 id="crop" className="text-xl font-medium">
          It breaks the user&rsquo;s own Codex sessions too
        </h2>
        <p className="mt-2 max-w-3xl text-muted">
          A native Codex session records <code className="font-mono">ollama-local</code> and resumes fine. A txcript
          crop of it (<code className="font-mono">#1-2</code>) is rewritten to <code className="font-mono">openai</code>.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Terminal run={cropBefore} title="before · crop" verdict="✗ copy of a working session refused" />
          <Terminal run={cropAfter} title="after · crop" verdict="✓ copy keeps the provider, recalls “heron”" />
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_1fr]" aria-labelledby="how">
        <div>
          <h2 id="how" className="text-xl font-medium">
            The change
          </h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-muted">
            <li>
              A write into the live Codex store saves <code className="font-mono">session_meta.model_provider</code> as
              the top-level <code className="font-mono">model_provider</code> in{" "}
              <code className="font-mono">$CODEX_HOME/config.toml</code>. No config, or no key: nothing changes.
            </li>
            <li>
              The Codex arm of <code className="font-mono">local::write_with</code> passes it to the store. The codec,
              wasm, <code className="font-mono">--out</code> exports and a plain{" "}
              <code className="font-mono">CodexStore::new</code> round-trip are untouched.
            </li>
            <li>
              3 CLI tests against temp stores (2 fail with the fix reverted) and a unit table for the config line. Your CI
              passed on my fork: stable, Windows, wasm32, MSRV, both package dry-runs.
            </li>
            <li>
              Not covered: a <code className="font-mono">profile</code>&rsquo;s provider, or{" "}
              <code className="font-mono">--profile</code>, <code className="font-mono">-c</code>,{" "}
              <code className="font-mono">--oss</code> at resume time. Only Ollama was tested live.
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-line bg-panel p-6">
          <h2 className="text-xl font-medium">Why now</h2>
          <p className="mt-3 leading-relaxed text-muted">
            Codex added the check in 0.166.{" "}
            <a href={CODEX_ISSUE} className="text-orange-ink underline underline-offset-2">
              openai/codex#58865
            </a>{" "}
            has users&rsquo; A/B runs (0.165 resumed across providers, 0.166 refuses). Codex may relax it, but writing the
            provider the user actually runs is correct either way.
          </p>
          <p className="mt-4 font-mono text-sm leading-relaxed text-muted">
            Control: a fresh Codex session with no history, same question →
            <br />
            <span className="text-ink">&ldquo;{control}&rdquo;</span>
          </p>
          <a href={LOGS} className="mt-5 inline-block text-sm underline underline-offset-2">
            Raw run logs
          </a>
        </div>
      </section>

      <footer className="mt-20 border-t border-line pt-6 text-sm text-muted">
        Unofficial demo by Cheryl Aurelia: not affiliated with Skillsync. Runs recorded 2026-11-07 on macOS arm64 with
        txcript built from main and from the fix branch, Codex CLI 0.167.0, and Qwen3-4B on Ollama.
      </footer>
    </main>
  );
}
