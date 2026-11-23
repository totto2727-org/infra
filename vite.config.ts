import { generateIgnorePatterns } from '@totto2727/gitignore-patterns'
import { defineConfig } from 'vite-plus'

const ignorePatterns = await generateIgnorePatterns(new URL('.', import.meta.url))

export default defineConfig({
  fmt: {
    ignorePatterns,
    arrowParens: 'always',
    experimentalSortImports: {
      ignoreCase: true,
      newlinesBetween: true,
      order: 'asc',
    },
    experimentalSortPackageJson: true,
    jsxSingleQuote: true,
    printWidth: 120,
    proseWrap: 'preserve',
    semi: false,
    singleQuote: true,
  },
  lint: {
    ignorePatterns,
    jsPlugins: [{ name: 'rules', specifier: '@totto2727/oxlint' }],
    options: { typeAware: true, typeCheck: true },
    rules: {
      'rules/no-eslint-disable-comments': 'error',
      'rules/no-jsx-script-tag': 'error',
      'rules/require-disable-reason': 'error',
    },
  },
  test: { include: ['{aws,cloudflare,github}/**/*.test.ts'] },
  run: {
    tasks: {
      check: { command: 'vp check' },
      ci: { command: '', dependsOn: ['check', 'test'] },
      fix: { command: 'vp check --fix' },
      test: { command: 'vp test run' },
    },
  },
})
