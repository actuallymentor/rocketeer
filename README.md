# Rocketeer NFT

Components:

- Solidity contract
- Firebase function for metadata

Project structure:

```

./
./*.{json,rules,js}
./- config files for the contracts and API

./contracts/
./- Solidity contracts

./migrations/
./- Migrations for the contracts

./test/
./- Tests for the contacts

./functions/
./- Firebase API code

```

## Requirements

[ ] `./functions`: set Infura project ID through `firebase functions:config:set infura.projectid=`
[ ] `./functions/package.json`: dependencies for backend, run `npm i` in `./functions`
[ ] `./package.json`: dependencies for contracts, run `npm i` in root