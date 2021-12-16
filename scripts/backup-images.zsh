## ###############
## Manual image backup
## I intend to make this an online thing
## But the storage cost is a bit expensive
## ###############
timestamp=$( date )
cd .backups && \
gcloud config set project rocketeer-nft && \
gsutil -m cp -r gs://rocketeer-nft.appspot.com/mainnetRocketeers/ ./rocketeer-image-backups/ && \
tar -cv rocketeer-image-backups | gzip -9 > rocketeer-backup-$timestamp.tar.gz && \
mv rocketeer-backup-$timestamp.tar.gz ~/Google\ Drive/Backup/Rocketeers/
echo "✅ success" || echo "🛑 fail"

say "Backup process done"
