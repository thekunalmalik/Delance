import React, { useState, useEffect } from 'react';
import { getAccounts, setFreelancerRating } from '../../services/web3';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Auth() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [role, setRole] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Error message state
  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      const accs = await getAccounts(); // Use getAccounts for fetching accounts
      if (accs && accs.length) {
        setAccounts(accs);
        setSelectedAccount(accs[0]);
      } else {
        setErrorMessage('No accounts available or user denied wallet access.');
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setErrorMessage('Failed to connect wallet.');
    }
  };

  // const handleLogin = () => {
  //   if (!selectedAccount || !role) {
  //     alert('Please select an account and role to continue');
  //     return;
  //   }

  //   // Check for conflicting roles
  //   const storedRole = localStorage.getItem(selectedAccount);

  //   if(!storedRole){
  //     // Save account and role if there's no conflict
  //     localStorage.setItem(selectedAccount, role);
  //     localStorage.setItem('selectedAccount', selectedAccount);
  //     localStorage.setItem('role', role);

  //     if (role === 'client') {
  //       navigate('/client');
  //     } else if (role === 'freelancer') {
  //       setFreelancerRating(selectedAccount, 0);
  //       navigate('/freelancer');
  //     }
  //   }
  //   else if (storedRole){
  //     // // Save account and role if there's no conflict
  //     localStorage.setItem(selectedAccount, role);
  //     localStorage.setItem('selectedAccount', selectedAccount);
  //     //localStorage.setItem('role', role);
  //     if(storedRole !== role) {
  //       setErrorMessage(`This account is already registered as a ${storedRole}.`);
  //       return;
  //     }
  //     else{

  //       if (role === 'client') {
  //         navigate('/client');
  //       } else if (role === 'freelancer') {
  //         navigate('/freelancer');
  //       }
  //     }
  //   }

    
  // };
  const handleLogin = () => {
    if (!selectedAccount || !role) {
      alert('Please select an account and role to continue');
      return;
    }
  
    // Check for existing role in localStorage
    const storedRole = localStorage.getItem(selectedAccount);
  
    if (!storedRole) {
      // First-time login: set account and role
      localStorage.setItem(selectedAccount, role);
      localStorage.setItem('selectedAccount', selectedAccount);
      localStorage.setItem('role', role);
  
      if (role === 'client') {
        navigate('/client');
      } else if (role === 'freelancer') {
        setFreelancerRating(selectedAccount, 0);
        navigate('/freelancer');
      }
    } else {
      // Returning user
      if (storedRole === role) {
        // Correct role: update selected account and navigate
        localStorage.setItem('selectedAccount', selectedAccount);
  
        if (role === 'client') {
          navigate('/client');
        } else if (role === 'freelancer') {
          navigate('/freelancer');
        }
      } else {
        // Role conflict: show error message
        setErrorMessage(`This account is already registered as a ${storedRole}.`);
      }
    }
  };
  

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login with MetaMask</h2>
        
        {errorMessage && (
          <div className="auth-error">
            {errorMessage}
          </div>
        )}

        <div className="auth-field">
          <label>Choose Account:</label>
          <select
            className="auth-select"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            {accounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label>Role:</label>
          <select
            className="auth-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select Role</option>
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>

        <button className="auth-button" onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}

export default Auth;
