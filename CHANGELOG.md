# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
- Placeholder: add upcoming changes here under Added/Changed/Fixed/Security.

## [0.1.0] - 2025-09-09

### Added
- Frontend scaffold (Next.js): `frontend/package.json`, `frontend/pages/_app.jsx`, `frontend/pages/_document.jsx`, `frontend/pages/index.jsx`, `frontend/components/site-header.jsx`, `frontend/styles/globals.css`, `frontend/public/.gitkeep`.
- API scaffold (Express): `api/package.json`, `api/index.js`, `api/.eslintrc.json`, `api/routes/.gitkeep`, `api/middleware/.gitkeep`, `api/utils/.gitkeep`.
- Core theme builder: `core/theme-builder.js` (generates minimal Ghost theme with required files and relative assets).
- GPT prompts: `gpt/user_agent_prompt.txt`, `gpt/code_agent_prompt.txt`.
- Spec example: `themeSpec.json`.
- Repository config: `.gitignore`, `.env.example`, root `package.json` (test stub).
- CI workflow: `.github/workflows/ci.yml` (API lint, frontend build).
- Platforms placeholders: `platforms/ghost/README.md`, `platforms/wordpress/README.md`.
- Frontend API proxy: `frontend/next.config.js` with rewrite from `/api/*` → `http://localhost:4000/*`.

### Changed
- Hardened `run-agent.js` to check for missing prompt/spec files and fail with clear errors.
- API serves `/output/*` statically for theme downloads.

### Fixed
- N/A (initial scaffold).

### Security
- Removed committed `.env` from repository and added `.env.example`.
- Added `.gitignore` to exclude secrets, build artifacts, and `node_modules/`.

[Unreleased]: https://github.com/your-org/themesmith/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/themesmith/releases/tag/v0.1.0

