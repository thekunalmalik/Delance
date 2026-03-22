// // // delance/src/components/Freelancer.js
// // import React, { useEffect, useState } from 'react';
// // import { connectWallet } from '../../services/web3'; // Import connectWallet function
// // import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

// // function Freelancer() {
// //   const [selectedAccount, setSelectedAccount] = useState('');
// //   const [balance, setBalance] = useState('');
// //   const navigate = useNavigate(); // Initialize the useNavigate hook

// //   useEffect(() => {
// //     const account = localStorage.getItem('selectedAccount');
// //     if (account) {
// //       setSelectedAccount(account);
// //       fetchBalance(account);
// //     }
// //   }, []); 

// //   const fetchBalance = async (account) => {
// //     const { web3 } = await connectWallet();
// //     if (web3) {
// //       const balance = await web3.eth.getBalance(account);
// //       setBalance(web3.utils.fromWei(balance, 'ether'));
// //     }
// //   };

// //   // Function to navigate to the FreelancerProjectsPage
// //   const handleViewProjects = () => {
// //     navigate('/freelancer/projects', { state: { selectedAccount } });
// //   };

// //   // Function to navigate to the YourProjects page
// //   const handleYourProjects = () => {
// //     navigate('/freelancer/your-projects', { state: { selectedAccount } });
// //   };

// //   return (
// //     <div>
// //       <h2>Freelancer Dashboard</h2>
// //       {selectedAccount && <p>Connected Account: {selectedAccount}</p>}
// //       {balance && <p>Account Balance: {balance} ETH</p>}
// //       <button onClick={handleViewProjects}>View Projects</button>
// //       <button onClick={handleYourProjects}>Your Projects</button> {/* New button */}
// //     </div>
// //   );
// // }

// // export default Freelancer;


// // delance/src/components/Freelancer.js
// import React, { useEffect, useState } from 'react';
// import { connectWallet } from '../../services/web3'; // Import connectWallet function
// import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
// import { getFreelancerRating } from '../../services/web3'; // Import getFreelancerRating function

// function Freelancer() {
//   const [selectedAccount, setSelectedAccount] = useState('');
//   const [balance, setBalance] = useState('');
//   const [rating, setRating] = useState(null); // State for freelancer rating
//   const navigate = useNavigate(); // Initialize the useNavigate hook

//   useEffect(() => {
//     const account = localStorage.getItem('selectedAccount');
//     if (account) {
//       setSelectedAccount(account);
//       fetchBalance(account);
//       fetchFreelancerRating(account); // Fetch the freelancer rating
//     }
//   }, []);

//   const fetchBalance = async (account) => {
//     const { web3 } = await connectWallet();
//     if (web3) {
//       const balance = await web3.eth.getBalance(account);
//       setBalance(web3.utils.fromWei(balance, 'ether'));
//     }
//   };

//   const fetchFreelancerRating = async (account) => {
//     const result = await getFreelancerRating(account); // Call the getFreelancerRating function
//     if (result.success) {
//       setRating(result.rating); // Set the rating state
//     } else {
//       console.error(result.message); // Handle error
//     }
//   };

//   // Function to navigate to the FreelancerProjectsPage
//   const handleViewProjects = () => {
//     navigate('/freelancer/projects', { state: { selectedAccount } });
//   };

//   // Function to navigate to the YourProjects page
//   const handleYourProjects = () => {
//     navigate('/freelancer/your-projects', { state: { selectedAccount } });
//   };

//   return (
//     <div>
//       <h2>Freelancer Dashboard</h2>
//       {selectedAccount && <p>Connected Account: {selectedAccount}</p>}
//       {balance && <p>Account Balance: {balance} ETH</p>}
//       {rating !== null && <p>Freelancer Rating: {rating}</p>} {/* Display the rating */}
//       <button onClick={handleViewProjects}>View Projects</button>
//       <button onClick={handleYourProjects}>Your Projects</button> {/* New button */}
//     </div>
//   );
// }

// export default Freelancer;

// delance/src/components/Freelancer.js
import React, { useEffect, useState } from 'react';
import { connectWallet } from '../../services/web3'; // Import connectWallet function
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { getFreelancerRating } from '../../services/web3'; // Import getFreelancerRating function
import './Freelancer.css'; // Import the CSS file

function Freelancer() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [rating, setRating] = useState(null); // State for freelancer rating
  const navigate = useNavigate(); // Initialize the useNavigate hook

  useEffect(() => {
    const account = localStorage.getItem('selectedAccount');
    if (account) {
      setSelectedAccount(account);
      fetchBalance(account);
      fetchFreelancerRating(account); // Fetch the freelancer rating
    }
  }, []);

  const fetchBalance = async (account) => {
    const { web3 } = await connectWallet();
    if (web3) {
      const balance = await web3.eth.getBalance(account);
      setBalance(web3.utils.fromWei(balance, 'ether'));
    }
  };

  const fetchFreelancerRating = async (account) => {
    const result = await getFreelancerRating(account); // Call the getFreelancerRating function
    if (result.success) {
      setRating(result.rating); // Set the rating state
    } else {
      console.error(result.message); // Handle error
    }
  };

  // Function to navigate to the FreelancerProjectsPage
  const handleViewProjects = () => {
    navigate('/freelancer/projects', { state: { selectedAccount } });
  };

  // Function to navigate to the YourProjects page
  const handleYourProjects = () => {
    navigate('/freelancer/your-projects', { state: { selectedAccount } });
  };

  return (
    <div className="freelancer-container">
      <h2 className="freelancer-title">Freelancer Dashboard</h2>
      {selectedAccount && <p className="freelancer-info">Connected Account: {selectedAccount}</p>}
      {balance && <p className="freelancer-info">Account Balance: {balance} ETH</p>}
      {rating !== null && <p className="freelancer-info">Freelancer Rating: {rating}</p>} {/* Display the rating */}
      <button className="freelancer-button" onClick={handleViewProjects}>View Projects</button>
      <button className="freelancer-button" onClick={handleYourProjects}>Your Projects</button> {/* New button */}
    </div>
  );
}

export default Freelancer;
