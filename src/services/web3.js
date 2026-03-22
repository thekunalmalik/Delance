import Web3 from 'web3';
import ProjectsContract from '../contracts/Projects.json'; 
import RequestManagerContract from '../contracts/RequestManager.json';
import { downloadFileFromIPFS } from './ipfs';

// helper to pick contract address from deployed networks or fall back to an env var
const getDeployedAddress = async (web3, contractJson, envVar) => {
  // prefer explicit env var for situations like hosted testnet
  if (process.env[envVar]) {
    console.log(`Using ${envVar} from environment:`, process.env[envVar]);
    return process.env[envVar];
  }

  const networkId = await web3.eth.net.getId();
  console.log(`Detected network ID: ${networkId}, contract: ${contractJson.contractName}`);
  
  if (contractJson.networks && contractJson.networks[networkId]) {
    const address = contractJson.networks[networkId].address;
    console.log(`Found address for network ${networkId}: ${address}`);
    return address;
  }
  
  // Fallback: try common Ganache network IDs if exact match not found
  const ganacheIds = ['5777', '1337'];
  for (const id of ganacheIds) {
    if (contractJson.networks && contractJson.networks[id]) {
      console.log(`Falling back to Ganache network ${id}: ${contractJson.networks[id].address}`);
      return contractJson.networks[id].address;
    }
  }
  
  console.error(`No address found for network ${networkId} or any Ganache fallback for ${contractJson.contractName}`);
  console.log('Available networks:', Object.keys(contractJson.networks || {}));
  return null;
};

// note: the old hardcoded addresses have been removed to enable local development with Ganache


export const connectWallet = async () => {
  if (window.ethereum) {
    // handle cases where multiple wallets are injected (e.g. MetaMask + Phantom)
    let provider = window.ethereum;
    if (provider.providers && Array.isArray(provider.providers)) {
      // prefer MetaMask if present
      const mm = provider.providers.find(p => p.isMetaMask);
      provider = mm || provider.providers[0];
    }

    const web3 = new Web3(provider);
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      return { accounts, web3 };
    } catch (error) {
      console.error('Wallet access denied or failed:', error);
      return null;
    }
  } else {
    console.error('No Ethereum provider detected. Install MetaMask and refresh.');
    return null;
  }
};

export const getAccounts = async () => {
  const result = await connectWallet();
  if (result && result.accounts) {
    return result.accounts;
  }
  return []; // no accounts available or user denied access
};

export const getBalance = async (account) => {
  const { web3 } = await connectWallet();
  if (web3) {
    const balance = await web3.eth.getBalance(account);
    return web3.utils.fromWei(balance, 'ether');
  }
  return null;
};

// Utility to get stored account and role from localStorage
export const getStoredCredentials = () => {
  const account = localStorage.getItem('selectedAccount');
  const role = localStorage.getItem('role');
  return { account, role };
};

// Initialize Projects contract instance (address resolved dynamically)
export const getProjectsContract = async () => {
  const { web3 } = await connectWallet();
  if (web3) {
    const address = await getDeployedAddress(web3, ProjectsContract, 'REACT_APP_PROJECTS_CONTRACT_ADDRESS');
    if (!address) {
      console.error('Unable to determine Projects contract address for current network.');
      return null;
    }
    return new web3.eth.Contract(ProjectsContract.abi, address);
  }
  return null;
};

// Initialize RequestManager contract instance (address resolved dynamically)
export const getRequestManagerContract = async () => {
  const { web3 } = await connectWallet();
  if (web3) {
    const address = await getDeployedAddress(web3, RequestManagerContract, 'REACT_APP_REQUEST_MANAGER_ADDRESS');
    if (!address) {
      console.error('Unable to determine RequestManager contract address for current network.');
      return null;
    }
    return new web3.eth.Contract(RequestManagerContract.abi, address);
  }
  return null;
};

// Function to add a project
export const addProject = async (name, description, reward, account) => {
  const contract = await getProjectsContract();
  if (contract) {
    try {
      // Convert reward to Wei and send the transaction
      const rewardInWei = Web3.utils.toWei(reward, 'ether');
      await contract.methods.addProject(name, description, rewardInWei).send({ from: account });
      return { success: true, message: 'Project added successfully.' };
    } catch (error) {
      console.error('Error adding project:', error);
      return { success: false, message: 'Failed to add project.' };
    }
  }
  return { success: false, message: 'Failed to connect to the contract.' };
};

export const fetchAllProjects = async () => {
  try {
    const contract = await getProjectsContract();
    if (!contract) {
      console.error("Contract not found. Ensure you are connected to the correct network.");
      return [];
    }

    // Call viewProjects function
    const projectData = await contract.methods.viewProjects().call();

    // Deconstruct arrays from projectData
    const ids = projectData[0];
    const names = projectData[1];
    const descriptions = projectData[2];
    const rewards = projectData[3];
    const statuses = projectData[4];
    const employers = projectData[5];

    // Map the arrays to create an array of project objects
    const projects = ids.map((id, index) => ({
      id: id.toString(), // Convert BigInt to string if needed
      title: names[index],
      description: descriptions[index],
      reward: rewards[index], // Convert BigInt to string if needed
      status: statuses[index].toString(), // Assuming status is an enum, adjust as needed
      employer: employers[index],
    }));

    return projects;

  } catch (error) {
    console.error("Error fetching user projects:", error);
    return [];
  }
};

// src/services/web3.js
// src/services/web3.js
export const fetchUserProjects = async (selectedAccount) => {
  //console.log(selectedAccount);
  //console.log(1);
  try {
    const contract = await getProjectsContract();
    if (!contract) {
      console.error("Contract not found. Ensure you are connected to the correct network.");
      return [];
    }

    // Call viewProjects function to get all projects
    const projectData = await contract.methods.viewProjects().call();
    const statusEnum = ["Closed", "Open"];
    // Deconstruct arrays from projectData
    const ids = projectData[0];
    const names = projectData[1];
    const descriptions = projectData[2];
    const rewards = projectData[3];
    const statuses = projectData[4];
    const employers = projectData[5];
    // Map the arrays to create an array of project objects and filter by employer
    const projects = ids.map((id, index) => ({
      id: id, // Convert BigInt to string if needed
      title: names[index],
      description: descriptions[index],
      reward: rewards[index], // Convert BigInt to string if needed
      status: statusEnum[statuses[index]], // Assuming status is an enum, adjust as needed
      employer: employers[index],
    })).filter(project => project.employer && project.employer.toLowerCase() === selectedAccount.toLowerCase());

    return projects;

  } catch (error) {
    console.error("Error fetching user projects:", error);
    return [];
  }
};

export async function addMilestone(projectId, name, description, daycount, percentage, selectedAccount) {
  try {
    const contract = await getProjectsContract(); // Await the contract instance
    
    if (!contract) {
      console.error("Contract instance not initialized");
      return;
    }

    // Debugging logs to verify parameters and account
    console.log("Parameters: ", { projectId, name, description, daycount, percentage, selectedAccount });
    console.log("Contract Address: ", contract.options.address);

    // Call contract method with `send` to trigger the transaction
    const transaction = await contract.methods.addMilestone(projectId, name, description, daycount, percentage)
      .send({ from: selectedAccount });
    
    console.log("Transaction successful:", transaction);
  } catch (error) {
    console.error("Error adding milestone:", error);
  }
}

export const getMilestones = async (projectId) => {
  try {
    const contract = await getProjectsContract();
    // Call the contract function
    const result = await contract.methods.getMilestones(projectId).call();

    // Destructure the returned object to match the Solidity return values
    const ids = result[0];
    const projectIds = result[1];
    const names = result[2];
    const descriptions = result[3];
    const daycounts = result[4];
    const percentages = result[5];
    const completions = result[6];
    const proofFileHashes = result[7];

    // Map the milestones into an array of objects
    return ids.map((id, index) => ({
      id : id.toString(),
      projectId: projectIds[index],
      name: names[index],
      description: descriptions[index],
      daycount: daycounts[index].toString(),
      percentage: percentages[index].toString(),
      completed: completions[index],
      proofFileHash: proofFileHashes[index],
    }));
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
};

// src/services/web3.js

export const setFreelancerRating = async (freelancerAddress, rating) => {
  try {
    const contract = await getProjectsContract();
    if (!contract) {
      console.error("Contract not found. Ensure you are connected to the correct network.");
      return { success: false, message: 'Contract not found.' };
    }

    // Call the contract method to set the freelancer rating
    await contract.methods.setFreelancerRating(freelancerAddress, rating).send({ from: freelancerAddress });
    
    console.log("Freelancer rating set successfully.");
    return { success: true, message: 'Freelancer rating set successfully.' };
  } catch (error) {
    console.error("Error setting freelancer rating:", error);
    return { success: false, message: 'Failed to set freelancer rating.' };
  }
};

// src/services/web3.js

export const getFreelancerRating = async (freelancerAddress) => {
  try {
    const contract = await getProjectsContract();
    if (!contract) {
      console.error("Contract not found. Ensure you are connected to the correct network.");
      return { success: false, message: 'Contract not found.' };
    }

    // Call the contract method to get the freelancer rating
    const rating = await contract.methods.getFreelancerRating(freelancerAddress).call();

    console.log(`Freelancer rating: ${rating}`);
    return { success: true, rating: rating.toString() };
  } catch (error) {
    console.error("Error getting freelancer rating:", error);
    return { success: false, message: 'Failed to get freelancer rating.' };
  }
};

export const sendRequest = async (projectId, freelancerRating, freelancerAddress) => {
  try {
    const requestManagerContract = await getRequestManagerContract();
    if (!requestManagerContract) {
      console.error("RequestManager contract not found. Ensure you are connected to the correct network.");
      return { success: false, message: 'Contract not found.' };
    }

    // Convert parameters to BigInt
    const formattedProjectId = Web3.utils.toBigInt(projectId);  // Convert projectId to BigInt
    const formattedRating = Web3.utils.toBigInt(freelancerRating);  // Convert freelancerRating to BigInt

    console.log("Sending request with:", {
      projectId: formattedProjectId.toString(),
      freelancerRating: formattedRating.toString(),
      from: freelancerAddress,
    });

    // Call the contract method to send the request
    await requestManagerContract.methods
      .sendRequest(formattedProjectId, formattedRating)
      .send({ from: freelancerAddress });

    console.log("Request sent successfully.");
    return { success: true, message: 'Request sent successfully.' };
  } catch (error) {
    console.error("Error sending request:", error);
    return { success: false, message: 'Failed to send request.' };
  }
};

export const fetchRequestsByProjectId = async (projectId) => { 
  console.log("Project ID:", projectId);
  try {
    console.log("Step 1: Getting contract instance...");
    const contract = await getRequestManagerContract(); // Get the instance of the RequestManager contract
    console.log("Step 2: Calling viewAllRequests...");

    // Call the contract function
    const result = await contract.methods.viewAllRequests().call();
    console.log("Step 3: Response received:", result);

    // Destructure the returned arrays to match the Solidity return values
    const requestIds = result[0];
    const projectIds = result[1];
    const freelancers = result[2];
    const freelancerRatings = result[3];
    const statuses = result[4];
    const escrowContracts = result[5];
    console.log("4");
    // Map the requests into an array of objects and filter by projectId
    const statusEnum = ["Pending", "Approved", "Rejected"];
    const filteredRequests = requestIds.map((id, index) => ({
      requestId: id.toString(),
      projectId: projectIds[index].toString(),
      freelancer: freelancers[index],
      freelancerRating: freelancerRatings[index].toString(),
      status: statusEnum[statuses[index]], // Assuming you want to keep the enum or convert it to a string
      escrowContract: escrowContracts[index], // This can be an address or object based on your requirements
    })).filter(request => request.projectId === projectId.toString()); // Filter by projectId
    
    return filteredRequests; // Return the filtered array of requests
  } catch (error) {
    console.error("Error fetching requests by project ID:", error);
    throw error; // Re-throw the error for further handling if needed
  }
};

export const acceptRequest = async (requestId, employer, projectReward) => {
  try {
    console.log(1);
    const contract = await getRequestManagerContract();
    const reward = projectReward;
    console.log(2);
    await contract.methods.acceptRequest(requestId).send({
      from: employer,
      value: reward,
    });
    console.log('Request accepted successfully');
  } catch (error) {
    console.error('Error accepting request:', error);
  }
};

export const rejectRequest = async (requestId, employer) => {
  try {
    const contract = await getRequestManagerContract();
    console.log(1);
    await contract.methods.rejectRequest(requestId).send({
      from: employer,
    });
    console.log('Request rejected successfully');
  } catch (error) {
    console.error('Error rejecting request:', error);
  }
};

export const fetchAcceptedProjectsByFreelancer = async (freelancer) => {
  try {
    console.log("Fetching accepted projects for freelancer:", freelancer);

    // Get the instance of your smart contract (adjust as needed)
    const contract = await getRequestManagerContract(); // Replace with the actual function to get the Projects contract instance

    // Call the viewAcceptedProjectsByFreelancer function with the freelancer address
    const result = await contract.methods.viewAcceptedProjectsByFreelancer(freelancer).call();

    console.log("Response received:", result);

    // Destructure the returned arrays to match the Solidity return values
    const projectIds = result[0];
    const names = result[1];
    const descriptions = result[2];
    const rewards = result[3];
    const statuses = result[4];
    const employers = result[5];

    // Assuming you have a status enum in your frontend to convert indexes to human-readable strings
    const statusEnum = ["Closed", "Open"]; // Adjust to match the actual Project.Status enum in Solidity

    // Map the projects into an array of objects
    const projects = projectIds.map((id, index) => ({
      id: id.toString(),
      name: names[index],
      description: descriptions[index],
      reward: rewards[index].toString(),
      status: statusEnum[statuses[index]], // Convert enum index to string
      employer: employers[index],
    }));

    return projects; // Return the array of project objects
  } catch (error) {
    console.error("Error fetching accepted projects for freelancer:", error);
    throw error; // Re-throw the error for further handling if needed
  }
};

export async function addFile(milestoneId, name, rid, cid, account) {
  try {
      // Validate all required parameters
      if (!milestoneId || milestoneId === undefined || milestoneId === null) {
        throw new Error("Missing required parameter: milestoneId");
      }
      if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error("Missing required parameter: name (must be a non-empty string)");
      }
      if (!rid || typeof rid !== 'string' || rid.trim() === '') {
        throw new Error("Missing required parameter: rid (must be a non-empty string)");
      }
      if (!cid || typeof cid !== 'string' || cid.trim() === '') {
        throw new Error("Missing required parameter: cid (must be a non-empty string)");
      }
      if (!account || typeof account !== 'string' || account.trim() === '') {
        throw new Error("Missing required parameter: account (must be a valid address)");
      }

      // Get the contract instance
      const contract = await getRequestManagerContract();
      // Call the addFile function in the smart contract
      await contract.methods.addFile(
        String(milestoneId),
        String(name),
        String(rid),
        String(cid)
      ).send({ from: account });
      
      await contract.methods.sendMilestoneReviewRequest(
        String(milestoneId),
        String(cid),
        account
      ).send({from: account});
      console.log('Transaction successful: File added');
  } catch (error) {
      console.error('Error calling addFile:', error);
      throw error;
  }
};

/**
 * Downloads all files associated with a specific milestone.
 * @param {number} milestoneId - The ID of the milestone to retrieve files for.
 */
export const downloadFilesForMilestone = async (milestoneId) => {
  try {
    console.log("Fetching files for milestone:", milestoneId);
    
    // Call the smart contract function to get all files for the milestone
    const contract = await getRequestManagerContract();
    const result = await contract.methods.viewAllFilesForMilestone(milestoneId).call();
    
    // Destructure the result
    const ids = result[0];
    const names = result[2];
    const cids = result[4];
    
    if (!ids || ids.length === 0) {
      console.log("No files found for milestone:", milestoneId);
      throw new Error(`No files found for milestone ${milestoneId}`);
    }

    console.log(`Found ${ids.length} file(s) to download`);

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const downloadErrors = [];
    let successCount = 0;

    // Iterate through the files and download each one
    for (let i = 0; i < ids.length; i++) {
      try {
        const cid = cids[i];
        const filename = names[i] || `downloadedFile_${ids[i]}`;
        
        if (!cid) {
          console.warn(`Skipping file ${i + 1}: No CID provided`);
          continue;
        }

        console.log(`Downloading file ${i + 1}/${ids.length}: ${filename} (CID: ${cid})`);
        await downloadFileFromIPFS(cid, filename);
        successCount++;
        
        // Wait before the next download to avoid rate limiting
        if (i < ids.length - 1) {
          await delay(1000);
        }
      } catch (fileError) {
        console.error(`Error downloading file ${i + 1}:`, fileError);
        downloadErrors.push({
          index: i,
          error: fileError.message
        });
      }
    }

    console.log(`Download complete: ${successCount}/${ids.length} files downloaded successfully`);
    
    if (downloadErrors.length > 0) {
      throw new Error(`Downloaded ${successCount} file(s) but encountered ${downloadErrors.length} error(s)`);
    }
  } catch (error) {
    console.error('Error downloading files for milestone:', error);
    throw error;
  }
};

export const fetchMilestoneReviewRequestsByMilestoneId = async (milestoneId) => {
  console.log("Milestone ID:", milestoneId);
  try {
    console.log("Step 1: Getting contract instance...");
    const contract = await getRequestManagerContract(); // Get the instance of the RequestManager contract
    console.log("Step 2: Calling viewAllMilestoneReviewRequests...");

    // Call the contract function
    const result = await contract.methods.viewAllMilestoneReviewRequests().call();
    console.log("Step 3: Response received:", result);

    // Destructure the returned arrays to match the Solidity return values
    const requestIds = result[0];
    const milestoneIds = result[1];
    const freelancers = result[2];
    const cids = result[3];
    const reviewedStatuses = result[4];

    // Map the requests into an array of objects and filter by milestoneId
    const filteredRequests = requestIds.map((id, index) => ({
      requestId: id.toString(),
      milestoneId: milestoneIds[index].toString(),
      freelancer: freelancers[index],
      cid: cids[index],
      reviewed: reviewedStatuses[index],
    })).filter(request => request.milestoneId === milestoneId.toString()); // Filter by milestoneId

    return filteredRequests; // Return the filtered array of requests
  } catch (error) {
    console.error("Error fetching milestone review requests by milestone ID:", error);
    throw error; // Re-throw the error for further handling if needed
  }
};

// Function to accept a milestone review request
export const acceptMilestoneReviewRequest = async (reviewRequestId, projId, selectedAccount) => {
  try {
    // Get the RequestManager and Projects contract instances
    console.log(1);
    const requestManagerContract = await getRequestManagerContract();
    console.log(2);
    // Call the acceptMilestoneReviewRequest function
    await requestManagerContract.methods
      .acceptMilestoneReviewRequest(reviewRequestId, projId)
      .send({ from: selectedAccount });
    console.log('Milestone review request accepted:');
  } catch (error) {
    console.error('Error accepting milestone review request:', error);
    throw error; // Re-throw the error for handling in the UI
  }
};

// Function to reject a milestone review request
export const rejectMilestoneReviewRequest = async (reviewRequestId, reason, selectedAccount) => {
  try {
    // Get the RequestManager contract instance
    const requestManagerContract = await getRequestManagerContract();

    // Call the rejectMilestoneReviewRequest function
    await requestManagerContract.methods
      .rejectMilestoneReviewRequest(reviewRequestId, reason)
      .send({ from: selectedAccount });
  } catch (error) {
    console.error('Error rejecting milestone review request:', error);
    throw error; // Re-throw the error for handling in the UI
  }
};

export const fetchReviewResponsesByMilestoneId = async (milestoneId) => {
  console.log("Fetching review responses for Milestone ID:", milestoneId);

  try {
    console.log("Step 1: Getting contract instance...");
    const contract = await getRequestManagerContract(); // Get the instance of the RequestManager contract
    console.log("Step 2: Calling viewAllReviewResponses...");

    // Call the contract function
    const result = await contract.methods.viewAllReviewResponses().call();
    console.log("Step 3: Response received:", result);

    // Destructure each array from the result
    const responseIds = result[0];
    const milestoneIds = result[1];
    const freelancers = result[2];
    const responses = result[3];
    const acceptedStatuses = result[4];

    // Map each response into an object and filter by milestoneId
    const filteredResponses = responseIds.map((id, index) => ({
      responseId: id,
      milestoneId: milestoneIds[index].toString(),
      freelancer: freelancers[index],
      response: responses[index],
      accepted: acceptedStatuses[index],
    })).filter(response => response.milestoneId === milestoneId.toString()); // Filter by milestoneId

    return filteredResponses; // Return the filtered array of responses
  } catch (error) {
    console.error("Error fetching review responses by milestone ID:", error);
    throw error; // Re-throw the error for further handling if needed
  }
};

export const acceptRejectionReason = async (reviewRequestId, selectedAccount) => {
  console.log("Accepting rejection reason for Review Request ID:", reviewRequestId);

  try {
    console.log("Step 1: Getting contract instance...");
    const contract = await getRequestManagerContract(); // Get the instance of the RequestManager contract
    console.log("Step 2: Sending transaction...");

    // Send the transaction to the blockchain
    const receipt = await contract.methods.acceptRejectionReason(reviewRequestId)
      .send({ from: selectedAccount });

    console.log("Transaction successful! Receipt:", receipt);
    return receipt; // Return the transaction receipt for further handling if needed
  } catch (error) {
    console.error("Error accepting rejection reason:", error);
    throw error; // Re-throw the error for further handling if needed
  }
};

// ===== NEW FUNCTIONS FOR ADDITIONAL FEATURES =====

/**
 * Send a request draft from freelancer to employer
 */
export const sendRequestDraft = async (requestId, draftContent, selectedAccount) => {
  try {
    const contract = await getRequestManagerContract();
    const receipt = await contract.methods.sendRequestDraft(requestId, draftContent)
      .send({ from: selectedAccount });
    console.log('Request draft sent successfully:', receipt);
    return receipt;
  } catch (error) {
    console.error('Error sending request draft:', error);
    throw error;
  }
};

/**
 * Get all request drafts for a specific request
 */
export const getRequestDrafts = async (requestId) => {
  try {
    const contract = await getRequestManagerContract();
    const drafts = await contract.methods.getRequestDrafts(requestId).call();
    return drafts;
  } catch (error) {
    console.error('Error fetching request drafts:', error);
    throw error;
  }
};

/**
 * Rate a freelancer (called by client/employer)
 */
export const rateFreelancer = async (requestId, rating, review, selectedAccount) => {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    const contract = await getRequestManagerContract();
    const receipt = await contract.methods.rateFreelancer(requestId, rating, review)
      .send({ from: selectedAccount });
    console.log('Freelancer rating submitted:', receipt);
    return receipt;
  } catch (error) {
    console.error('Error rating freelancer:', error);
    throw error;
  }
};

/**
 * Get all ratings for a specific freelancer
 */
export const getFreelancerRatings = async (freelancerAddress) => {
  try {
    const contract = await getRequestManagerContract();
    const ratings = await contract.methods.getFreelancerRatings(freelancerAddress).call();
    return ratings;
  } catch (error) {
    console.error('Error fetching freelancer ratings:', error);
    throw error;
  }
};

/**
 * Get average rating for a freelancer
 */
export const getFreelancerAverageRating = async (freelancerAddress) => {
  try {
    const contract = await getRequestManagerContract();
    const averageRating = await contract.methods.getFreelancerAverageRating(freelancerAddress).call();
    return parseInt(averageRating) / 1; // Convert to decimal if needed
  } catch (error) {
    console.error('Error fetching freelancer average rating:', error);
    throw error;
  }
};

/**
 * Complete a project (called by client/employer)
 */
export const completeProject = async (requestId, selectedAccount) => {
  try {
    const contract = await getRequestManagerContract();
    const receipt = await contract.methods.completeProject(requestId)
      .send({ from: selectedAccount });
    console.log('Project completed:', receipt);
    return receipt;
  } catch (error) {
    console.error('Error completing project:', error);
    throw error;
  }
};

/**
 * Get project completion status
 */
export const getProjectCompletion = async (projectId) => {
  try {
    const contract = await getRequestManagerContract();
    const completion = await contract.methods.getProjectCompletion(projectId).call();
    return completion;
  } catch (error) {
    console.error('Error fetching project completion:', error);
    throw error;
  }
};