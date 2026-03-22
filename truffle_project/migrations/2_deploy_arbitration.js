// 2_deploy_arbitration.js
const KlerosIntegration = artifacts.require("KlerosIntegration");

module.exports = async function(deployer, network, accounts) {
  // Replace this with the address of your Kleros Liquid arbitrator contract
  const klerosArbitratorAddress = "0x90992fb4E15ce0C59aEFfb376460Fda4Ee19C879"; 

  // Deploy the KlerosIntegration contract
  await deployer.deploy(KlerosIntegration, klerosArbitratorAddress);

  // Optionally, you can log the deployed contract address
  const klerosIntegrationInstance = await KlerosIntegration.deployed();
  console.log("KlerosIntegration deployed at:", klerosIntegrationInstance.address);
};
