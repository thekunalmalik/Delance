import React, { useState } from 'react';
import { completeProject } from '../../../services/web3';
import './ProjectCompletion.css';

function ProjectCompletion({ requestId, projectId, selectedAccount, onProjectCompleted }) {
  const [loading, setLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [message, setMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCompleteProject = async () => {
    setLoading(true);
    setMessage('');

    try {
      await completeProject(requestId, selectedAccount);
      setMessage('Project marked as completed successfully!');
      setIsCompleted(true);
      setShowConfirmation(false);
      
      // Call callback if provided
      if (onProjectCompleted) {
        onProjectCompleted();
      }
    } catch (error) {
      setMessage(`Error completing project: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-completion-container">
      {!isCompleted ? (
        <>
          <h3>Project Completion</h3>
          <p className="instruction-text">
            Mark this project as complete once the freelancer has finished all deliverables.
          </p>

          {!showConfirmation ? (
            <button 
              onClick={() => setShowConfirmation(true)}
              className="btn-complete-project"
            >
              Mark Project as Complete
            </button>
          ) : (
            <div className="confirmation-box">
              <h4>Confirm Project Completion</h4>
              <p>
                Are you sure you want to mark this project as complete? 
                This action is permanent and will finalize the project status.
              </p>
              <div className="confirmation-buttons">
                <button 
                  onClick={handleCompleteProject}
                  disabled={loading}
                  className="btn-confirm"
                >
                  {loading ? 'Completing...' : 'Yes, Complete Project'}
                </button>
                <button 
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="completion-success">
          <h3>✓ Project Completed</h3>
          <p>This project has been marked as complete.</p>
          <p className="project-id">Project ID: {projectId}</p>
        </div>
      )}

      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}
    </div>
  );
}

export default ProjectCompletion;
