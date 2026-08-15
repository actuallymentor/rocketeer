## Requirements

- [ ] `./functions`: set Infura project ID through `firebase functions:config:set infura.projectid=`
	- [ ] also set `integration.secret`
	- [ ] also set `discord.webhookurl`
	- [ ] also set `mailgun.api_key`, `mailgun.api_url`, `mailgun.from_domain`, `mailgun.from_email`
- [ ] `./functions/package.json`: dependencies for backend, run `npm i` in `./functions`

## Compress stored SVGs

Newly generated SVGs remove unreachable embedded raster definitions and are
stored with gzip encoding. Existing objects can be measured or migrated with the
same lossless compressor:

```bash
cd functions
nvm use
GOOGLE_APPLICATION_CREDENTIALS=../.github-actions-deployer.json npm run compress:storage:svgs
```

The command is a ten-file dry run by default. Review the savings, then pilot one
Rocketeer prefix with `--apply --prefix=mainnetRocketeers/ --limit=10`. Apply
requires a directory-like prefix ending in `/` and an enabled soft-delete
policy. Rewrites use generation and metageneration preconditions and preserve
object ACLs, custom metadata, and storage class.
Cloud Storage soft delete retains replaced bytes for seven days, so storage can
temporarily increase during a full migration.

Use `--apply --all --prefix=mainnetRocketeers/` for the full mainnet set. Repeat
for each audited Rocketeer prefix; do not run an unscoped whole-bucket rewrite.
Large sets can run as parallel, non-overlapping workers with `--shard=1/6`
through `--shard=6/6`; object-name hashes keep assignment stable across hosts.
Add `--quiet --summary-only` for compact job logs. Apply summaries retain the
rollback generation for every changed object and the first ten object errors.
Each SVG is compressed in a disposable worker thread to keep JSDOM memory
bounded; `--concurrency` controls simultaneous workers and memory usage. The
caller needs object read/write and object ACL read permissions when the bucket
uses object ACLs.

Run the full migration in Google Cloud near the `EU` bucket with at least 2 GB
of memory at the default concurrency, and scale memory with concurrency. The
job downloads each original; running `--all` locally can incur transfer charges.

Functions target Node 22 and deploy through the pinned Firebase CLI. Keep the
current Gen1 Firebase SDK majors until runtime configuration is migrated away
from `functions.config()`.
