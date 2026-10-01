# Changelog

## [0.4.0] - 2026-10-01

### Added

- add public chainlist RPC fallbacks behind the configured mainnet RPC
- add live-network contract read and signature recovery tests

### Changed

- replace archived web3.js with viem for contract reads and signature recovery
- batch Rocketeer token enumeration into a single multicall
- move SES emails from end-of-support AWS SDK v2 to `@aws-sdk/client-ses` v3
- use native `fetch` and `express.json` instead of extra dependencies
- bump `firebase-functions` to 7.4.0 and `firebase-admin` to 14.5.0

### Removed

- remove the unused Mailgun email module

## [0.3.1] - 2026-08-15

### Fixed

- keep informational storage reports read-only before the billing window
- reject live legacy storage during realized-cost verification
- reserve enough memory for browser-backed metadata generation

## [0.3.0] - 2026-08-15

### Added

- add live storage and realized-cost verification reports
- add structured Secret Manager runtime configuration

### Changed

- update Gen1 Firebase SDKs and Chromium tooling for Node 22
- exclude the dormant holder notifier from default function deployments

## [0.2.0] - 2026-08-15

### Added

- add deterministic migration shards for bounded parallel processing
- isolate large SVG parses in disposable workers to bound migration memory

### Changed

- move Firebase Functions and deployment CI from Node 16 to Node 22

## [0.1.0] - 2026-08-15

### Added

- add lossless SVG pruning and a guarded Cloud Storage migration command

### Fixed

- store new SVGs compressed with explicit cache and content metadata
