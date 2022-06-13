## ###############
## Manual image backup
## I intend to make this an online thing
## But the storage cost is a bit expensive
## ###############
brew update
brew install pigz
timestamp=$( date )
cd .backups && \
gcloud config set project rocketeer-nft && \
gsutil -m cp -r gs://rocketeer-nft.appspot.com/mainnetRocketeers/ ./rocketeer-image-backups/ && \
tar -cv rocketeer-image-backups | pigz -9 > rocketeer-backup-$timestamp.tar.gz && \
cp rocketeer-backup-$timestamp.tar.gz ~/Google\ Drive/My\ Drive/Backup/Rocketeers/ && \
echo "✅ $(date) success" || echo "🛑 $(date) fail"

say "Backup process done"
