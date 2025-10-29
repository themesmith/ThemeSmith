# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [Unreleased]
- Placeholder: add upcoming changes here under Added/Changed/Fixed/Security.

## [0.2.0] - 2025-01-15

### Added
- **Complete WordPress theme generation support** with comprehensive platform module
- **WordPress platform module** (`platforms/wordpress/`) with theme builder and validator
- **Multi-platform support** - core theme-builder now routes to Ghost or WordPress builders
- **WordPress theme validation** with security checks and required files verification
- **WordPress-specific frontend features**:
  - Platform selector (Ghost/WordPress)
  - Dynamic form fields based on selected platform
  - WordPress-specific features (Gutenberg blocks, Customizer, widgets, menus)
  - Platform-aware descriptions and help text
- **Complete WordPress theme structure** with all required files:
  - Core files: `style.css`, `index.php`, `functions.php`, `header.php`, `footer.php`
  - Templates: `single.php`, `page.php`, `archive.php`, `search.php`, `404.php`, `searchform.php`
  - Modern features: `theme.json` for Gutenberg, custom CSS/JS assets
- **WordPress standards compliance**:
  - Security best practices (ABSPATH checks, input sanitization)
  - Performance optimizations (removed unnecessary scripts)
  - Accessibility compliance (WCAG 2.1)
  - Internationalization ready (i18n functions)
  - Responsive design with mobile-first approach
- **WordPress-specific features**:
  - Gutenberg/Block Editor support with `theme.json`
  - WordPress Customizer integration with color controls
  - Widget areas (sidebar, footer) and menu locations
  - Dark mode support with localStorage
  - AJAX functionality for future enhancements
- **Comprehensive documentation** (`WORDPRESS_SUPPORT.md`) with implementation details

### Changed
- **Core theme-builder** now supports both Ghost and WordPress platforms
- **Frontend UI** enhanced with platform selection and dynamic form fields
- **API validation middleware** routes to platform-specific validators
- **README** updated with WordPress features and capabilities

### Fixed
- N/A (new feature implementation)

### Security
- **WordPress themes** include security best practices (ABSPATH checks, input sanitization)
- **Performance optimizations** remove unnecessary WordPress scripts and features
- **Input validation** and output escaping in generated WordPress themes

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

