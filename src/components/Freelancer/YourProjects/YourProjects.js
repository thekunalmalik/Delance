// delance/src/components/YourProjects.js
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation hook
import { fetchAcceptedProjectsByFreelancer } from '../../../services/web3';
import YourProjectCard from './ProjectsCard/ProjectCard'; // Import YourProjectCard component
import './YourProjects.css'; // Import the CSS file

function YourProjects() {
  const [projects, setProjects] = useState([]);
  const location = useLocation(); // Use the useLocation hook
  const freelancer = location.state?.selectedAccount || localStorage.getItem('selectedAccount');

  const loadProjects = useCallback(async () => {
    try {
      const result = await fetchAcceptedProjectsByFreelancer(freelancer);
      setProjects(result);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }, [freelancer]);

  useEffect(() => {
    if (freelancer) {
      loadProjects();
    }
  }, [freelancer, loadProjects]);

  return (
    <div className="your-projects-container">
      <h2 className="your-projects-title">Your Accepted Projects</h2>
      <div className="projects-grid">
        {projects.length > 0 ? (
          projects.map((project) => (
            <div className="project-card" key={project.id}>
              <YourProjectCard project={project} selectedAccount={freelancer} /> {/* Pass selectedAccount to YourProjectCard */}
            </div>
          ))
        ) : (
          <p>No accepted projects to display.</p>
        )}
      </div>
    </div>
  );
}

export default YourProjects;
