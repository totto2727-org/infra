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
  lint: { ignorePatterns, options: { typeAware: true, typeCheck: true } },
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
