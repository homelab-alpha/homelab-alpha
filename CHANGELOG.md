# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- feat(readme): add kairos repository card [bb98092](https://github.com/homelab-alpha/homelab-alpha/commit/bb98092021bc59e425c60635fe7f29bb75c96fb9) by [@homelab-alpha](https://github.com/homelab-alpha)
- feat(stats): add workflow that generates the profile cards [7a939e6](https://github.com/homelab-alpha/homelab-alpha/commit/7a939e6c5ac858eb03d22deb78fba5fb7b5f40c1) by [@homelab-alpha](https://github.com/homelab-alpha)
- feat(readme): render the profile as a terminal session with self-hosted stats cards [b49091c](https://github.com/homelab-alpha/homelab-alpha/commit/b49091c3f70c2d14dc99ba569e34af14e78b1a1b) by [@homelab-alpha](https://github.com/homelab-alpha)
- feat(readme): show the motto as motto.js in the terminal session [65348db](https://github.com/homelab-alpha/homelab-alpha/commit/65348dbf6cb190714da68565370210213a217858) by [@homelab-alpha](https://github.com/homelab-alpha)
- feat(readme): remove ls links from the terminal session [027f302](https://github.com/homelab-alpha/homelab-alpha/commit/027f30211bc6cf3636b40ae1fb09d2d05616189a) by [@homelab-alpha](https://github.com/homelab-alpha)
- feat(readme): remove the code of conduct from the pinned repositories [877fb38](https://github.com/homelab-alpha/homelab-alpha/commit/877fb38adf7a2de3f46a2ad90b10a2e75e770adb) by [@homelab-alpha](https://github.com/homelab-alpha)

### Changed

- Move the repository tooling (`lint.sh`, `setup_gpg.sh`, and
  `verify_signatures.sh`) from `scripts/` to `.github/scripts/` and the code
  style guide from `docs/` to `.github/docs/`
- Describe the two lint stages (pull requests and pushes to `main`) in
  `.github/docs/code_style_and_standards_guides.md`
- Explain in `codeql.yml` when to add a language
- Ignore `notes.md`, `super_linter.log`, and Python cache files in `.gitignore`
- Replace the deprecated `deny-licenses` option in `dependency_review.yml` with
  an `allow-licenses` list of permissive licenses and CC BY-NC-SA 4.0, so GPL
  and LGPL stay blocked
- Check development dependencies too in `dependency_review.yml`, by setting
  `fail-on-scopes` to `runtime, development`
- chore(stats-cards): remove the cards that the terminal session replaced [13e0ccb](https://github.com/homelab-alpha/homelab-alpha/commit/13e0ccb36bcd9ede42a3e7c68e959abf4e118fca) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore: adopt the blueprint template as the repository standard [449826d](https://github.com/homelab-alpha/homelab-alpha/commit/449826d47b6065d23cfdcf1721ab2ce4435d1369) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(deps): comment on the pull request only when the dependency review fails [374f64f](https://github.com/homelab-alpha/homelab-alpha/commit/374f64fd03d348a19dde2fcdeee8bd2d51cafae7) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs: add CLAUDE.md with the project rules for Claude Code [67a3de9](https://github.com/homelab-alpha/homelab-alpha/commit/67a3de9e9b6fd7a8993d9e302fbb5ebe3fefa5be) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(repo): adopt the current blueprint standard [a8bc682](https://github.com/homelab-alpha/homelab-alpha/commit/a8bc682ab50aab305ee93334a5dd51792d80ae41) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(repo): sync the latest blueprint updates [673386a](https://github.com/homelab-alpha/homelab-alpha/commit/673386a42428c36c426353b4f9b7086d84443b68) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(workflows): replace deny-licenses with allow-licenses [978464d](https://github.com/homelab-alpha/homelab-alpha/commit/978464d2a030a7ca149828a545bbcdc63a9f7f3f) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(blueprint): sync with the blueprint [207dadb](https://github.com/homelab-alpha/homelab-alpha/commit/207dadb923e484c7b26c242307856bab98da1e16) by [@homelab-alpha](https://github.com/homelab-alpha)
- ci(workflows): request a reviewer on bot PRs [33b6932](https://github.com/homelab-alpha/homelab-alpha/commit/33b6932375ab60ba1eae1168dd0fac8e697a82d8) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(github): sync Hugo and Dart Sass rules [cf0429d](https://github.com/homelab-alpha/homelab-alpha/commit/cf0429de0f35a0d0bade706d6d19495cc4341e21) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(github): sync runners, Renovate, and linters [8820a34](https://github.com/homelab-alpha/homelab-alpha/commit/8820a34ba42cf9d7d7d6405e76941ef9646c3416) by [@homelab-alpha](https://github.com/homelab-alpha)

### Deprecated

### Removed

### Fixed

- fix(renovate): fix invalid automergeType and vulnerability rule [50424ad](https://github.com/homelab-alpha/homelab-alpha/commit/50424ad1d22d524a72652f451c7b76def829a2bf) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(stats): read profile data with a personal access token [5495482](https://github.com/homelab-alpha/homelab-alpha/commit/5495482332901bffa67853e456b7a0c7e57faa12) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(labels): skip unchanged labels and retry failed writes [f2f2b80](https://github.com/homelab-alpha/homelab-alpha/commit/f2f2b80fabd910d1ea58a07f53092a9b6aed328f) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(changelog): remove the date from Unreleased [cf765ec](https://github.com/homelab-alpha/homelab-alpha/commit/cf765ec3509a51f23b5aa790cd7727c689b2e0b5) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(scripts): restore pull_request_body.py logic [5282812](https://github.com/homelab-alpha/homelab-alpha/commit/5282812009b470718bb6357f04e7a33dddf2a183) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(changelog): remove the Unreleased link [895ef5f](https://github.com/homelab-alpha/homelab-alpha/commit/895ef5f754343e81ed768d10f08b450095e5eb3f) by [@homelab-alpha](https://github.com/homelab-alpha)

### Security

- Override the transitive dev dependencies `glob` (14.0.3) and `minimatch`
  (11.0.3) to fix Dependabot alerts, which textlint pulls in
