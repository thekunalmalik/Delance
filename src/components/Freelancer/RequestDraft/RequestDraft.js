import React, { useState } from 'react';
import { sendRequestDraft, getRequestDrafts } from '../../../services/web3';
import './RequestDraft.css';

function RequestDraft({ requestId, selectedAccount }) {
  const [draftContent, setDraftContent] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendDraft = async () => {
    if (!draftContent.trim()) {
      setMessage('Please enter a draft proposal');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await sendRequestDraft(requestId, draftContent, selectedAccount);
      setMessage('Draft sent successfully!');
      setDraftContent('');
      
      // Refresh drafts list
      const updatedDrafts = await getRequestDrafts(requestId);
      setDrafts(updatedDrafts);
    } catch (error) {
      setMessage(`Error sending draft: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDrafts = async () => {
    if (!showDrafts) {
      setLoading(true);
      try {
        const fetchedDrafts = await getRequestDrafts(requestId);
        setDrafts(fetchedDrafts);
      } catch (error) {
        setMessage(`Error fetching drafts: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
    setShowDrafts(!showDrafts);
  };

  return (
    <div className="request-draft-container">
      <h3>Project Proposal</h3>
      
      <textarea
        value={draftContent}
        onChange={(e) => setDraftContent(e.target.value)}
        placeholder="Write your project proposal/draft here..."
        className="draft-textarea"
        rows="5"
      />
      
      <button 
        onClick={handleSendDraft} 
        disabled={loading}
        className="btn-send-draft"
      >
        {loading ? 'Sending...' : 'Send Proposal'}
      </button>

      <button 
        onClick={handleViewDrafts}
        className="btn-view-drafts"
      >
        {showDrafts ? 'Hide Proposals' : 'View My Proposals'}
      </button>

      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}

      {showDrafts && drafts.length > 0 && (
        <div className="drafts-list">
          <h4>Your Proposals:</h4>
          {drafts.map((draft, index) => (
            <div key={index} className="draft-item">
              <p><strong>Proposal {index + 1}:</strong></p>
              <p>{draft.draftContent}</p>
              <small>Sent: {new Date(draft.timestamp * 1000).toLocaleString()}</small>
              <small>Status: {draft.reviewed ? 'Reviewed' : 'Pending'}</small>
            </div>
          ))}
        </div>
      )}

      {showDrafts && drafts.length === 0 && !loading && (
        <p className="no-drafts">No proposals sent yet</p>
      )}
    </div>
  );
}

export default RequestDraft;
