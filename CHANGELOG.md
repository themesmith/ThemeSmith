# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
- Placeholder: add upcoming changes here under Added/Changed/Fixed/Security.

## [0.1.0] - 2025-01-15

### Added
- Frontend scaffold (Next.js): Complete React-based UI with theme specification form
- API scaffold (Express): RESTful API with theme generation, validation, and zipping middleware
- Core theme builder: `core/theme-builder.js` - Generates production-ready Ghost themes from JSON specs
- GPT prompts: AI agent prompts for theme design and code generation workflows
- Spec example: `themeSpec.json` with complete theme configuration template
- Full UI form: Interactive form for configuring layout, colors, fonts, and features
- Theme validation: Integrated Ghost theme validator (gscan) with automatic validation
- ZIP export: Automatic theme packaging into deploy-ready `.zip` files
- CI workflow: GitHub Actions workflow for automated testing and validation
- Platforms placeholders: Structure for future WordPress and other CMS support
- LICENSE: MIT License file
- Comprehensive README: Installation guides, quick start, and development instructions

### Changed
- Enhanced frontend form to include all theme specification fields (layout, colors, fonts, features)
- Improved error handling and user feedback in UI
- Hardened `run-agent.js` to check for missing prompt/spec files and fail with clear errors
- API serves `/output/*` statically for theme downloads

### Fixed
- Fixed spec validation to ensure all required fields are present before theme generation
- Improved error messages for better developer experience

### Security
- Removed committed `.env` from repository and added `.env.example` template
- Added `.gitignore` to exclude secrets, build artifacts, and `node_modules/`

[Unreleased]: https://github.com/your-org/themesmith/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/themesmith/releases/tag/v0.1.0

