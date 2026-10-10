/** @type {import("prettier").Config} */
const config = {
    useTabs: false,
    singleQuote: false,
    trailingComma: "all",
    bracketSpacing: true,
    tabWidth: 4,
    arrowParens: "always",
    semi: true,
    bracketSameLine: true,
    endOfLine: "lf",
    printWidth: 120,
    plugins: ["prettier-plugin-svelte"],
    overrides: [{ files: "*.svelte", options: { parser: "svelte" } }],
};

export default config;
