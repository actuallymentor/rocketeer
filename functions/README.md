## Requirements

- [ ] use Node 22 from `./functions/.nvmrc`
- [ ] install backend dependencies with `npm ci` in `./functions`
- [ ] store the legacy configuration JSON in the `RUNTIME_CONFIG` secret
- [ ] grant the Gen1 runtime service account access to that secret:

```bash
gcloud secrets add-iam-policy-binding RUNTIME_CONFIG \
  --project=rocketeer-nft \
  --member=serviceAccount:rocketeer-nft@appspot.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

Configuration is loaded lazily inside function invocations. Keep legacy Runtime
Config intact until the secret-backed functions have been deployed and smoked.

## Deploy functions

The default deployment updates the HTTP APIs, outfit queues, and callable
maintenance function. It intentionally excludes the dormant monthly holder
notifier so a deploy cannot recreate its Cloud Scheduler job.

```bash
cd functions
nvm use
npm run deploy
```

Deploy the holder notifier only when its scheduled email behavior should resume:

```bash
npm run deploy:scheduler
```

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
Gen1 imports explicit; bare imports use Gen2 behavior in current SDK releases.

## Verify storage costs

Enable the Cloud Billing **Detailed usage cost** export for project
`rocketeer-nft` into the EU dataset `cloud_billing_export`. Then inspect current
storage and billing-export availability:

```bash
cd functions
GOOGLE_APPLICATION_CREDENTIALS=../.github-actions-deployer.json npm run report:storage:costs
```

After the soft-deleted migration data and legacy artifact bucket expire, enforce
the expected savings and materialize a pre/post cost comparison:

```bash
GOOGLE_APPLICATION_CREDENTIALS=../.github-actions-deployer.json \
  npm run report:storage:costs -- --verify
```

Verification requires billing export data through 2026-08-25. It fails if old
SVG generations remain, the legacy bucket remains soft-deleted, live SVGs lack
gzip encoding, or the detailed export is unavailable.
