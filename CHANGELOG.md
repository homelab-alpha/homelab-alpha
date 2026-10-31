# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-10-29

### Added

### Changed

- Move the repository tooling (`lint.sh`, `setup_gpg.sh`, and
  `verify_signatures.sh`) from `scripts/` to `.github/scripts/` and the code
  style guide from `docs/` to `.github/docs/`
- Describe the two lint stages (pull requests and pushes to `main`) in
  `.github/docs/code_style_and_standards_guides.md`
- Explain in `codeql.yml` when to add a language
- Ignore `notes.md`, `super_linter.log`, and Python cache files in `.gitignore`

### Deprecated

### Removed

### Fixed

### Security

- Override the transitive dev dependencies `glob` (14.0.3) and `minimatch`
  (11.0.3) to fix Dependabot alerts, which textlint pulls in

[Unreleased]: https://github.com/homelab-alpha/homelab-alpha/compare/main...HEAD

---
