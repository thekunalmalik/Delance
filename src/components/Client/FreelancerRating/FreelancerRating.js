import React, { useState, useEffect } from 'react';
import { rateFreelancer, getFreelancerRatings, getFreelancerAverageRating } from '../../../services/web3';
import './FreelancerRating.css';

function FreelancerRating({ requestId, freelancerAddress, selectedAccount }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showRatings, setShowRatings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadFreelancerRatings();
  }, [freelancerAddress]);

  const loadFreelancerRatings = async () => {
    try {
      const fetchedRatings = await getFreelancerRatings(freelancerAddress);
      const avgRating = await getFreelancerAverageRating(freelancerAddress);
      setRatings(fetchedRatings || []);
      setAverageRating((avgRating / 1) || 0);
    } catch (error) {
      console.error('Error loading freelancer ratings:', error);
    }
  };

  const handleSubmitRating = async () => {
    if (!review.trim()) {
      setMessage('Please write a review');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await rateFreelancer(requestId, rating, review, selectedAccount);
      setMessage('Rating submitted successfully!');
      setReview('');
      setRating(5);
      setHasRated(true);
      
      // Refresh ratings
      await loadFreelancerRatings();
    } catch (error) {
      setMessage(`Error submitting rating: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value) => {
    return '★'.repeat(value) + '☆'.repeat(5 - value);
  };

  return (
    <div className="freelancer-rating-container">
      <h3>Rate Freelancer</h3>
      
      {/* Average Rating Display */}
      <div className="rating-summary">
        <div className="average-rating">
          <span className="stars">{renderStars(Math.round(averageRating))}</span>
          <span className="rating-value">{(averageRating / 1).toFixed(1)} / 5</span>
          <span className="rating-count">({ratings.length} review{ratings.length !== 1 ? 's' : ''})</span>
        </div>
      </div>

      {!hasRated && (
        <div className="rating-form">
          <div className="rating-input">
            <label>Your Rating: </label>
            <select 
              value={rating} 
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="rating-select"
            >
              <option value={5}>5 Stars - Excellent</option>
              <option value={4}>4 Stars - Good</option>
              <option value={3}>3 Stars - Average</option>
              <option value={2}>2 Stars - Poor</option>
              <option value={1}>1 Star - Very Poor</option>
            </select>
            <span className="stars-preview">{renderStars(rating)}</span>
          </div>

          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your review here..."
            className="review-textarea"
            rows="4"
          />

          <button 
            onClick={handleSubmitRating}
            disabled={loading}
            className="btn-submit-rating"
          >
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      )}

      {hasRated && (
        <div className="rating-submitted">
          ✓ You have rated this freelancer
        </div>
      )}

      <button 
        onClick={() => setShowRatings(!showRatings)}
        className="btn-view-all-ratings"
      >
        {showRatings ? 'Hide All Ratings' : `View All Ratings (${ratings.length})`}
      </button>

      {message && <p className={`message ${message.includes('Error') ? 'error' : 'success'}`}>{message}</p>}

      {showRatings && ratings.length > 0 && (
        <div className="ratings-list">
          <h4>All Ratings:</h4>
          {ratings.map((r, index) => (
            <div key={index} className="rating-item">
              <div className="rating-header">
                <span className="stars">{renderStars(r.rating)}</span>
                <span className="rating-value">{r.rating}/5</span>
              </div>
              <p className="review-text">{r.review}</p>
              <small>By: {r.rater}</small>
              <small className="timestamp">
                {new Date(r.timestamp * 1000).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}

      {showRatings && ratings.length === 0 && (
        <p className="no-ratings">No ratings yet</p>
      )}
    </div>
  );
}

export default FreelancerRating;
