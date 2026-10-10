import prettier from "eslint-config-prettier";
import path from "node:path";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    globalIgnores(["**/node_modules/**", "**/.svelte-kit/**", "**/build/**", "**/dist/**", "**/coverage/**"]),
    js.configs.recommended,
    ts.configs.recommended,
    svelte.configs.recommended,
    prettier,
    svelte.configs.prettier,
    {
        rules: {
            "no-undef": "off",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
        },
    },
    // Environment-specific globals
    { files: ["packages/frontend/**"], languageOptions: { globals: globals.browser } },
    {
        files: ["packages/backend/**", "**/*.config.{js,ts}"],
        languageOptions: { globals: globals.node },
    },
    // Svelte: type-aware parsing
    {
        files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: [".svelte"],
                parser: ts.parser,
            },
        },
    },
    // Backend and common: type-checked rules
    {
        files: ["packages/backend/**/*.ts", "packages/common/**/*.ts"],
        extends: [ts.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    // Proper casing for identifiers
    {
        files: ["packages/**/*.{ts,js,svelte}", "packages/**/*.svelte.ts"],
        rules: {
            "@typescript-eslint/naming-convention": [
                "error",
                // Fallback: everything is camelCase
                { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
                // Constants and imported components/classes
                {
                    selector: "variable",
                    format: ["camelCase", "UPPER_CASE"],
                    leadingUnderscore: "allow",
                },
                { selector: "import", format: ["camelCase", "PascalCase"] },
                // Types, interfaces, classes, enums
                { selector: "typeLike", format: ["PascalCase"] },
                { selector: "enumMember", format: ["PascalCase", "UPPER_CASE"] },
                // Don't police keys that must match an external shape
                // (HTTP headers, DB columns, env vars, quoted keys)
                { selector: "objectLiteralProperty", format: null },
                { selector: "typeProperty", format: null },
            ],
        },
    },
    // Proper casing for filenames
    {
        files: ["packages/**/*.{ts,js,css}"],
        plugins: { unicorn },
        rules: {
            "unicorn/filename-case": [
                "error",
                {
                    case: "kebabCase",
                    checkDirectories: false,
                    ignore: [/spec\.ts$/],
                },
            ],
        },
    },
    {
        files: ["packages/**/*.svelte"],
        plugins: { unicorn },
        rules: {
            "unicorn/filename-case": [
                "error",
                {
                    case: "pascalCase",
                    checkDirectories: false,
                    ignore: [/^\+/], // SvelteKit route files: +page.svelte, +layout.svelte, +error.svelte
                },
            ],
        },
    },
    {
        files: ["packages/**/*.{js,ts,svelte}"],
        rules: {
            "no-restricted-exports": [
                "error",
                {
                    restrictDefaultExports: {
                        direct: true, // export default foo
                        named: true, // export { foo as default }
                        defaultFrom: true, // export { default } from './foo'
                        namedFrom: true, // export { foo as default } from './foo'
                        namespaceFrom: true, // export * as default from './foo'
                    },
                },
            ],
        },
    },
    // Tools that require a default export
    {
        files: ["**/*.config.{js,ts}"],
        rules: { "no-restricted-exports": "off" },
    },
    // Force lang="ts" in Svelte scripts (commonly forgotten)
    {
        files: ["packages/frontend/**/*.svelte"],
        rules: {
            "svelte/block-lang": [
                "error",
                {
                    script: "ts",
                    style: null, // leave <style> alone (plain CSS)
                },
            ],
        },
    },
);
