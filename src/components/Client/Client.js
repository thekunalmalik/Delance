// // src/components/Client/Client.js
// import React, { useEffect, useState } from 'react';
// import { addProject, getBalance } from '../../services/web3';
// import { useNavigate } from 'react-router-dom';
// import './Client.css';

// function Client() {
//   const [selectedAccount, setSelectedAccount] = useState('');
//   const [balance, setBalance] = useState('');
//   const [projectName, setProjectName] = useState('');
//   const [projectDescription, setProjectDescription] = useState('');
//   const [projectBudget, setProjectBudget] = useState('');
//   const [statusMessage, setStatusMessage] = useState('');
//   const navigate = useNavigate();

//   useEffect(() => {
//     const account = localStorage.getItem('selectedAccount');
//     if (account) {
//       setSelectedAccount(account);
//       fetchBalance(account);
//     }
//   }, []);

//   const fetchBalance = async (account) => {
//     const balance = await getBalance(account);
//     if (balance) {
//       setBalance(balance);
//     }
//   };

//   const handleAddProject = async (e) => {
//     e.preventDefault();
//     if (!projectName || !projectDescription || !projectBudget) {
//       alert("Please fill in all project details.");
//       return;
//     }

//     try {
//       await addProject(projectName, projectDescription, projectBudget, selectedAccount);
//       setStatusMessage("Project added successfully!");
//       setProjectName('');
//       setProjectDescription('');
//       setProjectBudget('');
//     } catch (error) {
//       console.error("Error adding project:", error);
//       setStatusMessage("Failed to add project. Please try again.");
//     }
//   };

//   const handleViewProjects = () => {
//     navigate('/client/projects', { state: { selectedAccount } });
//   };

//   return (
//     <div className="clients-projects-page">
//       <h2>Client Dashboard</h2>
//       {selectedAccount && <p>Connected Account: {selectedAccount}</p>}
//       {balance && <p>Account Balance: {balance} ETH</p>}

//       <h3>Add a New Project</h3>
//       <form onSubmit={handleAddProject}>
//         <div>
//           <label>Project Name:</label>
//           <input
//             type="text"
//             value={projectName}
//             onChange={(e) => setProjectName(e.target.value)}
//             required
//           />
//         </div>
//         <div>
//           <label>Project Description:</label>
//           <textarea
//             value={projectDescription}
//             onChange={(e) => setProjectDescription(e.target.value)}
//             required
//           />
//         </div>
//         <div>
//           <label>Project Budget (in ETH):</label>
//           <input
//             type="number"
//             value={projectBudget}
//             onChange={(e) => setProjectBudget(e.target.value)}
//             required
//           />
//         </div>
//         <button type="submit">Add Project</button>
//       </form>

//       {statusMessage && <p className="status-message">{statusMessage}</p>}

//       <button onClick={handleViewProjects}>View Projects</button>
//     </div>
//   );
// }

// export default Client;

// src/components/Client/Client.js


import React, { useEffect, useState } from 'react';
import { addProject, getBalance } from '../../services/web3';
import { useNavigate } from 'react-router-dom';
import './Client.css';

function Client() {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
 
  useEffect(() => {
    const account = localStorage.getItem('selectedAccount');
    if (account) {
      setSelectedAccount(account);
      fetchBalance(account);
    }
  }, []);

  const fetchBalance = async (account) => {
    const balance = await getBalance(account);
    if (balance) {
      setBalance(balance);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projectName || !projectDescription || !projectBudget) {
      alert("Please fill in all project details.");
      return;
    }

    try {
      await addProject(projectName, projectDescription, projectBudget, selectedAccount);
      setStatusMessage("Project added successfully!");
      setProjectName('');
      setProjectDescription('');
      setProjectBudget('');
      setIsModalOpen(false); // Close the modal after successful project addition
    } catch (error) {
      console.error("Error adding project:", error);
      setStatusMessage("Failed to add project. Please try again.");
    }
  };

  const handleViewProjects = () => {
    navigate('/client/projects', { state: { selectedAccount } });
  };

  return (
    <div className="clients-projects-page">
      <h2>Client Dashboard</h2>
      {selectedAccount && <p>Connected Account: {selectedAccount}</p>}
      {balance && <p>Account Balance: {balance} ETH</p>}

      <button onClick={() => setIsModalOpen(true)}>Add Project</button>
      <button onClick={handleViewProjects}>View Projects</button>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add a New Project</h3>
            <form onSubmit={handleAddProject}>
              <div>
                <label>Project Name:</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Project Description:</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>Project Budget (in ETH):</label>
                <input
                  type="number"
                  value={projectBudget}
                  onChange={(e) => setProjectBudget(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Done</button>
              <button type="button" onClick={() => setIsModalOpen(false)}>Close</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Client;

