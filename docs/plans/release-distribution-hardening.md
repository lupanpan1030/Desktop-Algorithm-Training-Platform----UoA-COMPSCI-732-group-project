# Release Distribution Hardening Plan

## Goal

Make preview releases suitable for public linking from a personal website without
implying unsupported platform coverage or redistributing a full third-party
problem catalog.

## Decisions

- Public preview builds use the generated demo `seed.db`.
- Full LeetCode/力扣 imports remain local/private unless distribution rights are
  reviewed and documented.
- macOS and Windows packages must be generated per platform.
- Windows should not be advertised as available until a Windows runner or
  Windows machine has produced and opened the artifact.

## Implementation

- Document the release/data policy in `docs/release-distribution.md`.
- Add `THIRD_PARTY_NOTICES.md` for source and affiliation boundaries.
- Extend `npm run release:verify` so a large third-party problem catalog in a
  packaged `seed.db` fails public release verification by default.
- Add a manual GitHub Actions packaging workflow for macOS and Windows preview
  artifacts.

## Completion Criteria

- Local lint, typecheck, test, and package checks pass.
- macOS artifact remains buildable locally.
- Windows artifact is produced by the packaging workflow before being linked
  publicly.
