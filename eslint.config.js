import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            parser: tseslint.parser,
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...prettierConfig.rules,
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "prettier/prettier": "error",
            "no-console": ["warn", { allow: ["error", "warn"] }],
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            indent: ["error", 4, { "SwitchCase": 1 }],
        },
    },
    ...tseslint.configs.recommended
);