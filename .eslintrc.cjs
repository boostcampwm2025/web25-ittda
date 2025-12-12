module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["@typescript-eslint", "react", "react-hooks", "import"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    // 팀 규칙에 맞춰 커스터마이즈
    "import/prefer-default-export": "off",
    "react/jsx-filename-extension": [1, { extensions: [".tsx"] }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
  },
  overrides: [
    {
      files: ["backend/**/*.ts"],
      env: { node: true, browser: false },
    },
    {
      files: ["frontend/**/*.ts", "frontend/**/*.tsx"],
      env: { browser: true, node: false },
    },
  ],
};
