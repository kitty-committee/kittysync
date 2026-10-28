/** @type {import("prettier").Config} */
const config = {
    plugins: ["prettier-plugin-svelte", "prettier-plugin-sort-imports"],
    overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
    arrowParens: "always",
    bracketSameLine: true,
    trailingComma: "all",
    bracketSpacing: true,
    singleQuote: false,
    endOfLine: "lf",
    printWidth: 120,
    useTabs: false,
    tabWidth: 4,
    semi: true,
};

export default config;
