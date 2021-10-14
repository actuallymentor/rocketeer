const Rocketeer = artifacts.require("./Rocketeer.sol");

module.exports = async (deployer, network, addresses) => {

  // OpenSea proxy registry addresses for rinkeby and mainnet.
  // Source: https://github.com/ProjectOpenSea/opensea-creatures
  let proxyRegistryAddress = ""
  if (network === 'rinkeby') {
    proxyRegistryAddress = "0xf57b2c51ded3a29e6891aba85459d600256cf317"
  } else {
    proxyRegistryAddress = "0xa5409ec958c83c3f309868babaca7c86dcb077c1"
  }

  // Deploy rocketeer contract
  await deployer.deploy(Rocketeer, proxyRegistryAddress, {gas: 5000000})
  
}