# Changelog

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
