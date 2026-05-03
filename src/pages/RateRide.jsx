import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';

const RateRide = () => {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [ride, setRide] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;
      try {
        const docSnap = await getDoc(doc(db, 'rides', rideId));
        if (docSnap.exists()) {
          setRide({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error("Error fetching ride:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRide();
  }, [rideId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Please select a rating.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Add review to 'reviews' collection
      await addDoc(collection(db, 'reviews'), {
        rideId,
        reviewerId: currentUser.uid,
        targetId: ride.hostId, // Rating the host
        rating,
        comment,
        createdAt: serverTimestamp()
      });

      // 2. Optionally update host's average rating in 'users' collection
      // (This would typically be done via a Cloud Function for consistency)

      alert("Thank you for your feedback!");
      navigate('/dashboard');
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!ride) return <div className="text-center py-20">Ride not found.</div>;

  return (
    <main className="max-w-xl mx-auto px-lg py-2xl animate-fade-in">
      <div className="text-center mb-xl">
        <h1 className="font-h2 text-h2 text-text-primary mb-sm">Rate Your Experience</h1>
        <p className="text-secondary font-body-md">How was your ride share with {ride.hostName}?</p>
      </div>

      <section className="bg-background-primary rounded-xl shadow-md p-xl border border-border-subtle flex flex-col items-center">
        <div className="relative mb-lg">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-container shadow-sm">
            <img 
              alt={ride.hostName} 
              className="w-full h-full object-cover" 
              src={ride.hostPhoto || "https://lh3.googleusercontent.com/aida-public/AB6AXuDdfU0ffpwOHhvz7Tvve5sq_rEUiGmX8gnC8lnIHR7J3QZz-n7iI_IXO89--bJ7z_0rYTI5z_PJciSxYRvv2irIXp0XTzD9-SoWHtbhrA7pyIxsOoXHXbt6NuLcaB9dnYVA6MUzeh0TEAxHwTBDuE9PxGhQNZfrjtkiT2iZi5aULwcxheMqORUEX_LP9ulquicXFQ62nIF1Htg2Y6ARynbpgwntrqsQmrKO4fk58_Z3DcAqoxxwrwJVe3iKEA5C6Ww_8SJPb9GSNPqX"} 
            />
          </div>
          <div className="absolute bottom-0 right-2 bg-primary-container text-on-primary-container rounded-full p-2 border-2 border-white">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>

        <h2 className="font-h3 text-h3 text-text-primary mb-base">{ride.hostName}</h2>
        <div className="flex items-center gap-1 mb-xl text-secondary">
          <span className="material-symbols-outlined text-sm">directions_car</span>
          <span className="font-label-caps uppercase tracking-wider text-xs">Ride to {ride.destination}</span>
        </div>

        {/* Star Rating System */}
        <div className="flex flex-col items-center w-full mb-xl">
          <p className="font-label-caps text-secondary mb-md tracking-widest uppercase">Tap to rate</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star}
                onClick={() => setRating(star)}
                className={`${rating >= star ? 'text-primary-container' : 'text-border-subtle'} hover:scale-110 active:scale-95 transition-transform`}
              >
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}>star</span>
              </button>
            ))}
          </div>
        </div>

        {/* Review Text Area */}
        <div className="w-full space-y-md">
          <label className="font-label-caps text-secondary tracking-widest uppercase block" htmlFor="review-comments">Leave a comment</label>
          <textarea 
            id="review-comments"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-white border border-border-subtle rounded-lg p-md focus:ring-2 focus:ring-primary-container focus:border-primary-container outline-none transition-all placeholder:text-secondary-fixed-dim text-text-primary" 
            placeholder={`How was the ride with ${ride.hostName}?`}
            rows="4"
          ></textarea>
        </div>

        {/* Quick Chips for Review */}
        <div className="flex flex-wrap gap-2 mt-md w-full">
          {['Punctual', 'Good Music', 'Clean Car', 'Great Convo'].map(chip => (
            <span 
              key={chip}
              onClick={() => setComment(prev => prev ? `${prev} ${chip}` : chip)}
              className="bg-surface-container-high text-on-surface-variant font-label-caps py-2 px-4 rounded-full text-xs cursor-pointer hover:bg-accent-light transition-colors"
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-md mt-xl">
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-primary-container text-text-primary font-body-lg py-4 px-xl rounded-full font-bold shadow-sm hover:bg-accent-light active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
            {!submitting && <span className="material-symbols-outlined">send</span>}
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-transparent text-secondary font-label-caps py-3 px-xl rounded-full hover:bg-zinc-50 active:scale-95 transition-all text-xs tracking-widest uppercase"
          >
            Skip for now
          </button>
        </div>
      </section>

      {/* Informational Card */}
      <div className="mt-xl p-lg bg-surface-container-low rounded-xl border border-primary-fixed-dim/30 flex gap-md items-start">
        <span className="material-symbols-outlined text-primary">info</span>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Your feedback is anonymous and helps us maintain a high-quality community of commuters. Ratings are updated instantly on the profile.
        </p>
      </div>
    </main>
  );
};

export default RateRide;
