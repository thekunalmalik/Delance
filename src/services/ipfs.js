import axios from 'axios';
import { addFile } from './web3';

// Using NFT.storage (free and reliable)
const NFT_STORAGE_API_KEY = "d0c8e753.077aa2605b1147b8a6acbbf0b7fe1825"; // Get from https://nft.storage
const NFT_STORAGE_URL = "https://api.nft.storage/upload";

// Fallback to alternative: If you prefer Pinata instead
// const PINATA_API_KEY = "YOUR_PINATA_API_KEY";
// const PINATA_API_SECRET = "YOUR_PINATA_API_SECRET";
// const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

/**
 * Fetches all files from IPFS (using smart contract storage)
 * No need for QuickNode for this - we get files from blockchain
 */
export async function fetchFilesfromIPFS(pageNumber = 1, perPage = 10) {
  // Files are stored on blockchain, so we get them from smart contract
  // This function is maintained for API compatibility
  console.log("Files are retrieved from blockchain via smart contract");
  return { pins: [] };
}

export async function uploadFiletoIPFS(file, milestoneId, account) {
  if (!file) throw new Error("No file provided for upload");
  
  if (!NFT_STORAGE_API_KEY || NFT_STORAGE_API_KEY.includes("YOUR_")) {
    throw new Error("NFT.storage API key is not configured. Please set it up!");
  }

  try {
    // Create FormData with the file
    const formData = new FormData();
    formData.append("file", file);

    console.log("Uploading file to NFT.storage:", file.name);

    // Upload to NFT.storage
    const response = await fetch(NFT_STORAGE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NFT_STORAGE_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`NFT.storage upload failed with status ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result || !result.value || !result.value.cid) {
      throw new Error("Invalid response from NFT.storage API");
    }

    const cid = result.value.cid;
    const name = file.name;
    const requestId = `nft-storage-${Date.now()}`; // Generate a unique request ID

    console.log("File uploaded successfully to IPFS:", { cid, name, requestId });

    // Call addFile to record on blockchain
    try {
      await addFile(milestoneId, name, requestId, cid, account);
      return { cid, name, requestId };
    } catch (blockchainError) {
      console.error('Error adding file to blockchain:', blockchainError);
      throw new Error(`File uploaded to IPFS but failed to record on blockchain: ${blockchainError.message}`);
    }
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
}



/**
 * Downloads a file from IPFS and triggers a download in the browser.
 * Supports multiple gateway fallbacks for better reliability.
 * @param {string} cid - The IPFS content identifier.
 * @param {string} filename - The name to save the downloaded file as.
 */
export const downloadFileFromIPFS = async (cid, filename = 'downloadedFile') => {
  if (!cid) {
    throw new Error("No CID provided for download");
  }

  console.log("Starting download for CID:", cid);

  // List of IPFS gateways to try
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`
  ];

  let lastError = null;

  for (const url of gateways) {
    try {
      console.log(`Attempting download from: ${url}`);
      
      // Make a request to the IPFS gateway to get the file data as a blob
      const response = await fetch(url, {
        headers: {
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Gateway returned status: ${response.status}`);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Create a download link and click it to trigger download
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = filename || 'file';
      document.body.appendChild(link);
      link.click();

      // Clean up the link after download
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      console.log(`File downloaded successfully as ${filename} from ${url}`);
      return true; // Success
    } catch (error) {
      console.log(`Gateway ${url} failed: ${error.message}`);
      lastError = error;
      // Try next gateway
      continue;
    }
  }

  // All gateways failed
  const errorMessage = `Failed to download file from IPFS after trying all gateways. Last error: ${lastError?.message}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
};

/**
 * Verifies if a file is on IPFS using the provided CID.
 * @param {string} cid - The IPFS content identifier for the file.
 * @returns {Promise<string>} - A promise that resolves with the verification message.
 */
export const verifyIPFSFile = async (cid) => {
  try {
    const response = await axios.post(
      'https://api.quicknode.com/functions/rest/v1/functions/c7f2c204-4dd5-4aa4-9803-2b90b1cb8d12/call', 
      { user_data: { cid } }, // Ensure the structure matches what your function expects
      {
        headers: {
          'Authorization': 'Bearer QN_c8aa28a4799341c085c01650882a8753', // Ensure this is a valid API key and wrapped in backticks
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error verifying IPFS file:', error);
    throw new Error('An error occurred while verifying the file.');
  }
};