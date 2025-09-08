# Build & Test

- Install frontend dependencies: `npm install` (inside `/frontend`)
- Start frontend dev server: `npm run dev` (inside `/frontend`)
- Install backend dependencies: `npm install` (inside `/api`)
- Start API locally: `npm run dev` (inside `/api`)
- Run all tests: `npm test`
- Run Ghost theme validator: `gscan ./output/<your-theme-folder>`

# Code Style

- Frontend: Format with `prettier` using default config
- Backend: Use `eslint` with airbnb style guide
- File naming: kebab-case for files, camelCase for variables
- Max line length: 100 characters
- Use semicolons consistently (`;`)
- All AI prompts must be stored in `/gpt/*.txt`

# Platform Architecture

- ThemeSmith is composed of:
  - `/frontend`: React/Next.js UI for theme builder
  - `/api`: Express/Node API routes for theme generation and validation
  - `/gpt`: Prompt files for LLM agents (user-agent, code-agent)
  - `/core`: Optional logic for parsing spec and building files
  - `/output`: Generated themes (.zip + report)
- Platform-agnostic themes are generated from a `themeSpec.json`

# Git Workflow

- Branch naming:
  - Features: `feature/<short-name>`
  - Fixes: `fix/<bug-desc>`
  - Docs: `docs/<section>`
- Commit format: `<type>(<scope>): <description>`
  - Example: `feat(api): add GitHub export route`
- PRs must pass test and validator before merge

# Agent Instructions

- Always read `/gpt/user_agent_prompt.txt` for the user-facing flow
- Always read `/gpt/code_agent_prompt.txt` for code-gen tasks
- Never build or generate without a valid `themeSpec.json`
- Do not proceed if any required fields in the spec are missing (e.g. layout, platform, colors)
- After theme generation:
  - Run the Ghost validator (`gscan`)
  - Zip the theme into `/output/`
  - Return path + validation summary

# Deployment

- Deploy frontend via Vercel (`/frontend`)
- Deploy API via Vercel Serverless or Render (`/api`)
- Deployment script: `deploy.sh` (optional)

# Security

- Do NOT commit `.env` or API keys
- Secrets are read via `process.env` in Node or `.env.local` in React
- Images and themes are sanitized before zip
- No third-party theme code should be included unless explicitly whitelisted

# Gotchas

- `themeSpec.json` must be UTF-8 encoded and valid JSON
- Theme previews use dynamic Tailwind CSS and React templates
- Ghost CLI must be installed locally to run validation: `npm install -g gscan`
- Large image uploads (>1MB) are ignored during packaging
- Future CMS modules (e.g. WordPress, Shopify) go into `/platforms/<cms-name>/`

# Style Guide Summary

| Area      | Tool     | Rule                   |
|-----------|----------|------------------------|
| React     | Prettier | Auto-format all JSX    |
| JS/TS     | ESLint   | Airbnb config          |
| Prompts   | Markdown | `.txt` format only     |
| File names| kebab    | `theme-spec.json` etc. |
| Commits   | Conventional Commits | Use `feat`, `fix`, `docs` |

# LLM-Specific Behavior

- Use OpenAI’s `gpt-4` or `gpt-4o` for theme generation
- Temperature: `0.2` for code generation
- Max tokens: `4096` for GPT calls
- When generating templates:
  - Always include `package.json`, `default.hbs`, and core layouts
  - Ensure asset links are relative

# Proof of Completion (For Agents)

- All files in `/output/<theme-name>/` exist
- Theme passes validation with no errors
- `.zip` is created and accessible
- Markdown report includes:
  - Theme spec summary
  - Validation output
  - Platform tag (ghost, wordpress, etc.)

# References

- See [README.md](README.md) for human overview
- See [themeSpec.json](themeSpec.json) for format
- Prompt examples in `/gpt/*.txt`
- Ghost docs: https://ghost.org/docs/themes/

