import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      boundaries,
    },
    rules: {
      "boundaries/entry-point": 2,
      "boundaries/external": 2,
      "boundaries/element-types": 2,
    },
    settings: {
      boundaries: {
        elements: [
          {
            type: "identity",
            pattern: "src/contexts/identity/**",
          },
          {
            type: "commissioning", 
            pattern: "src/contexts/commissioning/**",
          },
        ],
        rules: [
          {
            from: "identity",
            disallow: [
              "commissioning",
            ],
          },
          {
            from: "commissioning",
            disallow: [
              "identity",
            ],
          },
        ],
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
