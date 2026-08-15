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

The command is a ten-file dry run by default. Review the savings, pilot a small
prefix with `--apply --limit=10`, then use `--apply --all` for the full bucket.
Rewrites use generation preconditions and keep the SVG public. Cloud Storage
soft delete retains replaced bytes for seven days, so storage can temporarily
increase during a full migration.

Run the full migration in Google Cloud near the `EU` bucket with at least 2 GB
of memory and the default concurrency of one. The job downloads each original;
running `--all` from a local machine can incur data-transfer charges.
