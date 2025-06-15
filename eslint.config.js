import tseslint from "typescript-eslint";
import eslintPluginImport from "eslint-plugin-import";
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
            "@typescript-eslint/no-explicit-any": "warn",
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
            indent: ["error", 4],
        },
        ignores: ["dist/**", "node_modules/**", "vite.config.ts"],
    },
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        extends: [
            eslintPluginImport.flatConfigs.recommended,
            eslintPluginImport.flatConfigs.typescript,
        ],
        rules: {
            "import/no-absolute-path": "error",
            "import/order": [
                "error",
                {
                    groups: [
                        "builtin",
                        "external",
                        "internal",
                        "parent",
                        "sibling",
                        "index",
                    ],
                    "newlines-between": "always",
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                    pathGroups: [
                        {
                            pattern: "~/**",
                            group: "internal",
                        },
                    ],
                    pathGroupsExcludedImportTypes: ["builtin"],
                },
            ],
            "sort-imports": [
                "error",
                {
                    ignoreCase: true,
                    ignoreDeclarationSort: true,
                    ignoreMemberSort: false,
                    memberSyntaxSortOrder: [
                        "none",
                        "all",
                        "multiple",
                        "single",
                    ],
                    allowSeparatedGroups: true,
                },
            ],
        },
        settings: {
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                    project: "./tsconfig.json",
                },
                node: true,
            },
            "import/parsers": {
                "@typescript-eslint/parser": [".ts", ".tsx"],
            },
        },
    }
);