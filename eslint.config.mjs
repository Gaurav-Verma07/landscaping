import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Ignore the config file itself — it's not part of the TS project
    // and would cause "parserOptions.project" to error on it.
    "eslint.config.mjs",
  ]),

  {
    // Required for type-aware rules like no-floating-promises.
    // Without this, typescript-eslint can't resolve Promise types.
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      // Fixes: "contextOrFilename.getFilename is not a function"
      // eslint-plugin-react's auto-detection breaks under ESLint 9/10 flat config.
      // Pinning the version explicitly bypasses the broken detection path.
      react: {
        version: "19",
      },
    },
    rules: {
      // ── Type imports ────────────────────────────────────────────────────────
      // All provider interfaces, tool types, etc. are type-only imports.
      // Enforces `import type { AITool }` consistently across the codebase.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],

      // ── Unused variables ────────────────────────────────────────────────────
      // Several catch blocks intentionally swallow errors: catch { /* ignore */ }
      // Setting caughtErrors: "none" avoids false positives there.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],

      // ── Floating promises ───────────────────────────────────────────────────
      // The onChunk callback in ai-chat-route.ts is async and called inside a
      // sync provider loop — unhandled rejections would be silent without this.
      "@typescript-eslint/no-floating-promises": "error",

      // ── any usage ───────────────────────────────────────────────────────────
      // gemini.ts passes `as any` for tools; tool-executor.ts uses `as any`
      // for audienceFilters. Warn rather than error to allow intentional casts.
      "@typescript-eslint/no-explicit-any": "warn",

      // ── Non-null assertions ─────────────────────────────────────────────────
      // All three providers use `process.env.X_API_KEY!` — intentional, but
      // warn so the pattern isn't used carelessly elsewhere.
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },

  {
    // provider.factory.ts uses dynamic require() by design for lazy provider
    // loading. Scoping the override here avoids disabling it globally.
    files: ["**/provider.factory.ts", "**/provider_factory.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  {
    // React event handlers (onClick, onKeyDown) return void, not Promise<void>,
    // even when the underlying function is async. Disabling floating-promises
    // for .tsx files avoids noise on every button handler.
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
]);

export default eslintConfig;