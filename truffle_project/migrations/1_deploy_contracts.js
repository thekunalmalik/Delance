const Projects = artifacts.require("Projects");
const RequestManager = artifacts.require("RequestManager");

module.exports = async function (deployer) {
  // Deploy Projects contract first
  await deployer.deploy(Projects);
  const projectsInstance = await Projects.deployed();

  // Now deploy RequestManager with the address of the deployed Projects contract
  await deployer.deploy(RequestManager, projectsInstance.address);
};
