module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Monorepo 환경에서 TypeScript 설정을 효율적으로 찾도록 설정
    project: [
      './tsconfig.json',
      './frontend/tsconfig.json',
      './frontend/tsconfig.app.json',
      './frontend/tsconfig.node.json',
      './backend/tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    es2021: true,
    node: true, // 기본적으로 node 환경 지원
  },
  // 기본 공통 규칙 (airbnb-base의 TypeScript 버전)
  extends: [
    'airbnb-typescript/base', // React 규칙 제외된 기본 JS/TS 규칙
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  rules: {
    // 공통 규칙
    'import/prefer-default-export': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        // 모든 tsconfig 파일 참조
        project: ['./tsconfig.json', './frontend/tsconfig.json', './backend/tsconfig.json'],
      },
    },
  },
  overrides: [
    // 백엔드 전용 설정
    {
      files: ['backend/**/*.ts'],
      env: { node: true, browser: false, jest: true },
      parserOptions: {
        project: './backend/tsconfig.json',
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'prettier/prettier': ['error', { endOfLine: 'auto' }], // Prettier 규칙 유지

        'import/extensions': ['error', 'ignorePackages', { ts: 'never', js: 'never' }],
        'class-methods-use-this': 'off',
        '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
        'max-classes-per-file': ['error', { ignoreExpressions: true, max: 30 }],
        'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['client'] }],
      },
    },
    // 프론트엔드 전용 설정 (React 규칙 추가)
    {
      files: ['frontend/**/*.ts', 'frontend/**/*.tsx'],
      env: { browser: true, node: false },
      settings: {
        react: { version: 'detect' },
      },
      extends: [
        // 에어비앤비 규칙 추가
        'airbnb',
        'airbnb/hooks',
        'airbnb-typescript',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
      ],
      plugins: ['react', 'react-hooks', 'react-refresh'],
      settings: {
        react: { version: 'detect' },
      },
      rules: {
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        // React 17+ 설정 (JSX 변환기 자동 삽입으로 인한 규칙 끄기)
        'react/react-in-jsx-scope': 'off',
        'react/jsx-uses-react': 'off',
        // import 관련 규칙 (프론트엔드에만 적용)
        'import/extensions': [
          'error',
          'ignorePackages',
          { ts: 'never', tsx: 'never', js: 'never', jsx: 'never' },
        ],
        'import/no-extraneous-dependencies': [
          'error',
          {
            // 프론트엔드 폴더 내의 개발 의존성만 확인하도록 경로 조정
            devDependencies: [
              'frontend/vite.config.ts',
              'frontend/**/*.config.ts',
              'frontend/**/*.config.js',
            ],
          },
        ],
        'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
      },
    },
  ],
  ignorePatterns: [
    'dist',
    'frontend/dist',
    'backend/dist',
    'node_modules',
    '.eslintrc.cjs',
    'vite.config.ts',
    'coverage',
  ],
};
