import prettier from "eslint-config-prettier";
import path from "node:path";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import { defineConfig, globalIgnores, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";

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
);
