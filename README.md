# Rocketeer NFT

This is the official repository of the [Rocketeers]( https://rocketeer.fans ) NFT collection.

- [Mint Rocketeers here]( https://mint.rocketeer.fans/#/mint )
- [View your Rocketeer portfolio here]( https://mint.rocketeer.fans/#/portfolio )
- [Set your Rocketpool node avatar here]( https://mint.rocketeer.fans/#/avatar )

Do you want to contribute to this project? Read `CONTRIBUTING.md`.

## Rocketeer components

The Rocketeer project consists out of a Solidity `ERC721` contract and a number of `web2` interfaces.

### Contract code

You can find the contract source in `contracts`. The `migrations/*` files set the parameters used for deployment.

### Minter code

The minter interface hosted at [mint.rocketeer.fans]( https://mint.rocketeer.fans/ ) is a React app that connects to Metamask. The code is inside the `minter` folder.

### Viewer code

The Rocketeer viewer hosted at [viewer.rocketeer.fans]( https://viewer.rocketeer.fans/ ) is the official place to view your Rocketeers. It's code is inside the `viewer` folder.

### Oracle code

The metadata and image oracle generates the Rocketeer data when one is minted. The code is inside the `functions` folder.
