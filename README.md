# txcript → Codex on a non-OpenAI provider

Unofficial demo by Cheryl Aurelia: not affiliated with Skillsync.

**Problem.** Codex 0.166 and later refuse to resume a session recorded under a provider other than the one they run with ([openai/codex#58865](https://github.com/openai/codex/issues/58865)). [txcript](https://github.com/skillsynchq/txcript) writes `"model_provider": "openai"` into every Codex session ([codex.rs#L530](https://github.com/skillsynchq/txcript/blob/c60e686e7ed30e67019288eed80c4be478512d64/src/harness/codex.rs#L530)). So for anyone whose `~/.codex/config.toml` sets another provider, `txcript continue <id> --with codex` fails with:

```
This chat uses openai, but your current provider is ollama-local. Switch to openai to continue.
```

The same happens to a txcript crop of a native Codex session.

**Fix.** [Branch](https://github.com/skillsynchq/txcript/compare/main...cherylaurelia:txcript:fix/codex-configured-provider): a write into the live Codex store saves under the top-level `model_provider` from `$CODEX_HOME/config.toml`. If there's no config or no key, nothing changes. `--out` exports keep `openai`. Their CI passes on the fork.

**What the page shows.** Real terminal runs from 2026-11-07 (macOS arm64, Codex CLI 0.167.0, Qwen3-4B on Ollama), parsed from `data/*.log` at build time:

- `before.log` / `after.log`: Claude Code session → Codex. Before, Codex refuses the copy. After, it resumes and answers "Label: Cancel, Style: ghost" from the carried-over history.
- `crop-before.log` / `crop-after.log`: a native `ollama-local` Codex session, cropped by txcript, then resumed.
- `control.log`: a fresh Codex session with no history can't answer the same question.

Only Ollama was tested live. A `profile`'s provider and the resume-time flags `--profile`, `-c` and `--oss` aren't covered.

## Run

```sh
npm install
npm test        # parser tests, including checks against the recorded logs
npm run build && npm start
```
