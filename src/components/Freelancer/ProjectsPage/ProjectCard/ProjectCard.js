// FreelancerProjectCard.js
import React, { useEffect, useState } from 'react';
import { getFreelancerRating, sendRequest, getMilestones } from '../../../../services/web3'; // Adjust the path based on your project structure
import MilestoneCard from '../MilestoneCard/MilestoneCard';
import './ProjectCard.css'

const FreelancerProjectCard = ({ project, selectedAccount }) => { // Accept selectedAccount as a prop
  const { id, title, description, reward, status, employer } = project;
  const [freelancerRating, setFreelancerRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [showMilestones, setShowMilestones] = useState(false); // New state for toggling milestones view

  console.log(selectedAccount);

  // Fetch the freelancer's rating when the component mounts
  useEffect(() => {
    const fetchFreelancerRating = async () => {
      if (selectedAccount) {
        try {
          const rating = await getFreelancerRating(selectedAccount);
          setFreelancerRating(rating.rating);
        } catch (error) {
          console.error('Error fetching freelancer rating:', error);
        }
      }
    };

    fetchFreelancerRating();
  }, [selectedAccount]);

  // Handle the send request button click
  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const response = await sendRequest(id, freelancerRating, selectedAccount);
      if (response.success) {
        console.log('Request sent successfully:', response.message);
      } else {
        console.error('Error sending request:', response.message);
      }
    } catch (error) {
      console.error('Error while sending request:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing milestones for the project
  const handleViewMilestones = async () => {
    try {
      if (!showMilestones) {
        const fetchedMilestones = await getMilestones(id);

        // Ensure fetched milestones are in an array format
        if (Array.isArray(fetchedMilestones)) {
          setMilestones(fetchedMilestones);
        } else {
          console.error("Fetched milestones data is not an array:", fetchedMilestones);
          setMilestones([]);
        }
      }
      setShowMilestones(!showMilestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
    }
  };

  return (
    <div className="freelancer-project-card">
      <h3>{title}</h3>
      <p>Description: {description}</p>
      <p>Reward: {reward} ETH</p>
      <p>Status: {status}</p>
      <p>Employer: {employer}</p>
      <p>Freelancer Rating: {freelancerRating.toString()} / 5</p>

      <button onClick={handleSendRequest} disabled={loading}>
        {loading ? 'Sending...' : 'Send Request'}
      </button>

      {/* Button to view milestones */}
      <button onClick={handleViewMilestones}>
        {showMilestones ? "Hide Milestones" : "View Milestones"}
      </button>

      {/* Display milestones if showMilestones is true */}
      {showMilestones && (
        <div>
          <h4>Milestones</h4>
          {milestones.length > 0 ? (
            milestones.map((milestone) => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))
          ) : (
            <p>No milestones available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FreelancerProjectCard;

