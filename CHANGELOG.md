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
- feat(stats): show generation time as last login [b6b4dc8](https://github.com/homelab-alpha/homelab-alpha/commit/b6b4dc8ba76d3410dc6778ddd00a99903430a3f1) by [@homelab-alpha](https://github.com/homelab-alpha)
- feat(stats): add the conventional commits gist [b27c3a1](https://github.com/homelab-alpha/homelab-alpha/commit/b27c3a160076a64c48ee2c182787ac966fb00eaa) by [@homelab-alpha](https://github.com/homelab-alpha)
- feat(github): add accessibility checks [e35cd56](https://github.com/homelab-alpha/homelab-alpha/commit/e35cd56b66ca008865ae838f738ca63231dd8039) by [@homelab-alpha](https://github.com/homelab-alpha)

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
- ci(workflows): run workflows for bots [d15e46b](https://github.com/homelab-alpha/homelab-alpha/commit/d15e46b2044249fe9e9d072331f62cba09876ede) by [@homelab-alpha](https://github.com/homelab-alpha)
- ci(workflows): allow BlueOak-1.0.0 license [7fd423d](https://github.com/homelab-alpha/homelab-alpha/commit/7fd423d75140205534dc1bcd78682cea6e629c3f) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(labels): add dependency update labels [e074762](https://github.com/homelab-alpha/homelab-alpha/commit/e0747620555113fcb96cc43a43bea442c7964b9f) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(renovate): remove default assignees [fa69aa4](https://github.com/homelab-alpha/homelab-alpha/commit/fa69aa4125a2f93a21179fc5eb569a17f3926907) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(renovate): group and automerge updates [702f784](https://github.com/homelab-alpha/homelab-alpha/commit/702f7840c48d9f27f75bd1677b57d2dd6714d315) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(sync): sync shared files with blueprint [1073e71](https://github.com/homelab-alpha/homelab-alpha/commit/1073e710f90029da28aa8f6a263d12a07c5aa9ed) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs: move and update AI contribution policy [ddf63eb](https://github.com/homelab-alpha/homelab-alpha/commit/ddf63ebc931d227e666c7fa4a15a1d7512a0cc1a) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore: sync files with the blueprint [dcae680](https://github.com/homelab-alpha/homelab-alpha/commit/dcae680020a890f6f3463461bec8caae3692e621) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(workflows): allow the PSF-2.0 license [a4b0e19](https://github.com/homelab-alpha/homelab-alpha/commit/a4b0e1907a1f95a441f0b5c1e4a1f5a26cc1610f) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(workflows): allow more MIT-like licenses [ec6717c](https://github.com/homelab-alpha/homelab-alpha/commit/ec6717c96dcfe1f8669e825e7c802becef0233d5) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(renovate): group npm updates in one pr [a4f109c](https://github.com/homelab-alpha/homelab-alpha/commit/a4f109c0f1c9d64c38cb1f068ef0394e63e7a073) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(renovate): group docker compose images [e60d468](https://github.com/homelab-alpha/homelab-alpha/commit/e60d4688a6a6a77a5dc2a3338ebed71965f05d12) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(labels): add renovate dependency labels [b79ecd1](https://github.com/homelab-alpha/homelab-alpha/commit/b79ecd1bae777b4dbf1b7cf6f7e5f88dd9382d81) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs: add conventional commits cheatsheet [cf69acd](https://github.com/homelab-alpha/homelab-alpha/commit/cf69acd54e84c33d636c66ab00f92e365e4408d3) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs: add accessibility statement [c1e0ed7](https://github.com/homelab-alpha/homelab-alpha/commit/c1e0ed75a5e4f4962ce174bbe7f7094fbe385c45) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs: link the accessibility statement [a2848d9](https://github.com/homelab-alpha/homelab-alpha/commit/a2848d98f64617c1da535339ef67310a849a83f6) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs: document NO_COLOR support [1c8855f](https://github.com/homelab-alpha/homelab-alpha/commit/1c8855ff2daf1e6741baff8ea3b481717c95e30e) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs: update the accessibility statement [46aaac9](https://github.com/homelab-alpha/homelab-alpha/commit/46aaac9269c355133b865f053a830e7a190aac73) by [@homelab-alpha](https://github.com/homelab-alpha)
- chore(renovate): ignore bot and owner commits [ab112a2](https://github.com/homelab-alpha/homelab-alpha/commit/ab112a2b5a8e1e43a9056571fd91f8069a0c0aef) by [@homelab-alpha](https://github.com/homelab-alpha)
- ci(release): tag version commit, fix mentions [f8a13ca](https://github.com/homelab-alpha/homelab-alpha/commit/f8a13cab03be32f8e4a8771d602a0f73d6036067) by [@homelab-alpha](https://github.com/homelab-alpha)
- docs(policy): fix timeout-minutes indentation [35c1253](https://github.com/homelab-alpha/homelab-alpha/commit/35c125346807b0ecc52f4a3d0b6abc79f6563851) by [@homelab-alpha](https://github.com/homelab-alpha)

### Deprecated

### Removed

### Fixed

- fix(renovate): fix invalid automergeType and vulnerability rule [50424ad](https://github.com/homelab-alpha/homelab-alpha/commit/50424ad1d22d524a72652f451c7b76def829a2bf) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(stats): read profile data with a personal access token [5495482](https://github.com/homelab-alpha/homelab-alpha/commit/5495482332901bffa67853e456b7a0c7e57faa12) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(labels): skip unchanged labels and retry failed writes [f2f2b80](https://github.com/homelab-alpha/homelab-alpha/commit/f2f2b80fabd910d1ea58a07f53092a9b6aed328f) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(changelog): remove the date from Unreleased [cf765ec](https://github.com/homelab-alpha/homelab-alpha/commit/cf765ec3509a51f23b5aa790cd7727c689b2e0b5) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(scripts): restore pull_request_body.py logic [5282812](https://github.com/homelab-alpha/homelab-alpha/commit/5282812009b470718bb6357f04e7a33dddf2a183) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(changelog): remove the Unreleased link [895ef5f](https://github.com/homelab-alpha/homelab-alpha/commit/895ef5f754343e81ed768d10f08b450095e5eb3f) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(workflow): do not draft Renovate PRs [2f8f092](https://github.com/homelab-alpha/homelab-alpha/commit/2f8f092b97666bc7ffb41ceaaba3c145adee0a56) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(renovate): remove invalid security rule that disabled grouping [a311f61](https://github.com/homelab-alpha/homelab-alpha/commit/a311f6122ea1e8cf8c80d705cfd4991a50b7111a) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(renovate): label all updates in a group [e9199eb](https://github.com/homelab-alpha/homelab-alpha/commit/e9199ebb1f214469ec5f54eec445e6f715234d05) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(readme): show the motto after the listing [789376f](https://github.com/homelab-alpha/homelab-alpha/commit/789376fc00e5c2a08b0065fd6ac3d2569dde34cc) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(profile): improve alt text and add text view [ec0ec27](https://github.com/homelab-alpha/homelab-alpha/commit/ec0ec2748ec5a79a6be10a2d8bffb57a9f1ac71e) by [@homelab-alpha](https://github.com/homelab-alpha)
- fix(profile): move text version link to bottom [a759d28](https://github.com/homelab-alpha/homelab-alpha/commit/a759d28752d77639836afbc117566a5eb8f203f4) by [@homelab-alpha](https://github.com/homelab-alpha)

### Security

- Override the transitive dev dependencies `glob` (14.0.3) and `minimatch`
  (11.0.3) to fix Dependabot alerts, which textlint pulls in
