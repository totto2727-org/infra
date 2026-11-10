import { createRepositoryFactory } from './repository.ts'
import { orgProvider } from './totto2727-org-provider.ts'

const createRepository = createRepositoryFactory('totto2727-org', orgProvider)

const template = (repository: string) => ({ includeAllBranches: false, owner: 'totto2727-org', repository })

export const workspace = createRepository(
  'workspace',
  {
    description: 'Virtual monorepo workspace for independent application and package repositories',
  },
  [],
)
export const agent = createRepository('agent', {
  description: 'Multi-product agent plugin marketplace for Claude Code, Cursor, and Codex',
})
export const monorepo = createRepository('monorepo', {
  description: 'A multi-language monorepo using Node.js, pnpm workspaces, and Vite+',
})
export const infra = createRepository('infra', {
  description: 'Pulumi infrastructure for AWS, Cloudflare, and GitHub',
})
export const agentCoreSdk = createRepository('agent-core-sdk', {
  description: 'Shared MoonBit process infrastructure for invoking agent CLIs through JSONL',
  template: template('template-moonbit-simple'),
})
export const agentSdk = createRepository('agent-sdk', {
  description: 'Provider-neutral MoonBit interfaces for Codex and OpenCode CLI sessions',
  template: template('template-moonbit-simple'),
})
export const codexSdk = createRepository('codex-sdk', {
  description: 'A MoonBit SDK for typed Codex CLI threads, turns, and events',
  template: template('template-moonbit-simple'),
})
export const opencodeSdk = createRepository('opencode-sdk', {
  description: 'MoonBit SDKs for OpenCode CLI sessions and managed server processes',
  template: template('template-moonbit-simple'),
})
export const atlasToKysely = createRepository('atlas-to-kysely', {
  description: 'Generate Kysely type definitions from Atlas schemas',
})
export const cPlugin = createRepository('c-plugin', {
  description: 'A MoonBit CLI for managing agent plugins',
  template: template('template-moonbit-simple'),
})
export const cloudflareOsStarter = createRepository(
  'cloudflare-os-starter',
  {
    description: 'A guide for customizing your Cloudflare OS deployment',
    fork: 'true',
    hasIssues: false,
    homepageUrl: 'https://os.cloudflare.app',
    sourceOwner: 'cloudflare',
    sourceRepo: 'cloudflare-os-starter',
  },
  [],
)
export const flowdeck = createRepository('flowdeck', {
  description: 'A local workflow cockpit for running, scheduling, and tracing graph-based workflows.',
})
export const glossshift = createRepository('glossshift', {
  description: 'A macOS translation app and CLI with OpenAI-compatible providers and streaming output',
})
export const mdts = createRepository('mdts', { description: 'Application repository for the mdts project' }, [])
export const nixCache = createRepository(
  'nix-cache',
  {
    description: 'Authenticated Nix binary cache on Cloudflare Workers and R2',
  },
  [],
)
export const openConnector = createRepository(
  'open-connector',
  {
    description:
      'Open-source auth gateway connecting 1500+ SaaS providers to AI agents through SDK, CLI, MCP, HTTP, and OpenAPI.',
    fork: 'true',
    hasIssues: false,
    homepageUrl: 'https://oomol.com',
    sourceOwner: 'oomol-lab',
    sourceRepo: 'open-connector',
  },
  ['Lint, Typecheck & Test'],
)
export const projektor = createRepository('projektor', {
  description: 'Self hosted Wiki + Jira-style AI native issue tracker on Cloudflare Workers',
  fork: 'true',
  hasIssues: false,
  homepageUrl: 'https://tajd.github.io/projektor/',
  sourceOwner: 'TAJD',
  sourceRepo: 'projektor',
})
export const reylo = createRepository(
  'reylo',
  {
    description: 'Import .sql files into TypeScript with full type inference and zero codegen.',
    fork: 'true',
    hasIssues: false,
    homepageUrl: 'https://reylo.dev',
    sourceOwner: 'colinhacks',
    sourceRepo: 'reylo',
  },
  ['SQLite and HCL on ubuntu-latest', 'SQLite and HCL on windows-latest'],
)
export const admiral = createRepository('admiral', {
  description: 'Declarative CLI builder for MoonBit, inspired by gunshi',
  fork: 'true',
  hasIssues: false,
  sourceOwner: 'mizchi',
  sourceRepo: 'admiral',
})
export const llmProfiles = createRepository('llm-profiles', {
  description: 'Shared OpenAI-compatible agent configuration with optional Rust client adapters',
  template: template('template-rust-simple'),
})
export const anyCollection = createRepository('any-collection', {
  description: 'Mutable and persistent immutable MoonBit maps with heterogeneous values and typed references',
})
export const oxlint = createRepository('oxlint', {
  description: 'Custom Oxlint rules and TypeScript / Effect presets for @totto2727/oxlint',
  homepageUrl: 'https://oxlint.totto2727.dev',
  template: template('template-vite-plus-lib'),
})
export const oxlintDocs = createRepository('oxlint-docs', {
  description: 'English and Japanese documentation for @totto2727/oxlint, built with Effront',
  homepageUrl: 'https://oxlint.totto2727.dev',
  template: template('template-vite-plus-app'),
})
export const effront = createRepository('effront', {
  description: 'Effront is a React meta-framework built on Web standards and Effect.',
  fork: 'true',
  hasIssues: false,
  homepageUrl: 'https://effront-docs-docs-production-6rpcuj2cm2urgl4w.totto2727.workers.dev/',
  sourceOwner: 'nikhilsnayak',
  sourceRepo: 'effective-rsc',
})
export const e2e = createRepository('e2e', {
  description: 'Reusable Go CLI end-to-end test helpers',
})
export const geo = createRepository(
  'geo',
  {
    description: 'A MoonBit port of georust/geo with 2D geometry algorithms, robust predicates, and R-tree indexing',
  },
  ['test'],
)
export const gitignorePatterns = createRepository('gitignore-patterns', {
  description: 'Generate Vite+ formatter and linter ignore patterns from Gitignore rules',
})
export const lens = createRepository('lens', {
  description: 'Typed JSON traversal, construction, and aggregate validation for MoonBit',
})
export const workgraph = createRepository('workgraph', {
  description:
    'Typed MoonBit workflow graphs with state reducers, scoped resources, LLM nodes, and coding-agent adapters',
})
export const x = createRepository(
  'x',
  {
    description:
      'MoonBit utilities for bounded collections, logical copying, filesystem paths, and JSON, YAML, and TOML conversion',
  },
  ['verify'],
)
export const templateGoSimple = createRepository('template-go-simple', {
  description: 'A simple Go CLI template with Nix, Just, and GitHub Actions',
  isTemplate: true,
  topics: ['go', 'just', 'nix', 'template'],
})
export const templateVitePlusLib = createRepository('template-vite-plus-lib', {
  description: 'A minimal Vite+ TypeScript library template with declarations and Nix development shell',
  isTemplate: true,
})
export const templateVitePlusApp = createRepository('template-vite-plus-app', {
  description: 'A minimal Vite+ TypeScript CLI template with Bun standalone executables and Nix packaging',
  isTemplate: true,
})
export const templateMoonbitSimple = createRepository('template-moonbit-simple', {
  description: 'A simple MoonBit library template with Nix and GitHub Actions',
  isTemplate: true,
  topics: ['moonbit', 'nix', 'template'],
})
export const templateRustSimple = createRepository('template-rust-simple', {
  description: 'A simple Rust library template with Nix, Just, and GitHub Actions',
  isTemplate: true,
  topics: ['just', 'nix', 'rust', 'template'],
})
export const templateHaskellSimple = createRepository('template-haskell-simple', {
  description: 'A simple Haskell CLI template with Nix, Cabal, and hpack',
  isTemplate: true,
})
export const moonbitOverlay = createRepository(
  'moonbit-overlay',
  {
    description: 'Reproducible nix overlay of binary distributed MoonBit toolchains and LSP',
    fork: 'true',
    hasIssues: false,
    sourceOwner: 'moonbit-community',
    sourceRepo: 'moonbit-overlay',
  },
  ['flake-check'],
)
