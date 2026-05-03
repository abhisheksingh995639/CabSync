import React from 'react';
import { MapPin, Calendar, Clock, DollarSign, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './RideCard.css';

const RideCard = ({ ride, isPoster }) => {
  const getStatusBadge = () => {
    switch(ride.status) {
      case 'open':
        return <span className="badge badge-success">Open</span>;
      case 'matched':
        return <span className="badge badge-accent">Matched</span>;
      case 'completed':
        return <span className="badge badge-warning">Completed</span>;
      default:
        return null;
    }
  };

  const splitFare = ride.status === 'matched' ? ride.totalFare / 2 : ride.totalFare;

  return (
    <div className="card ride-card">
      <div className="ride-header">
        <div className="ride-poster">
          <div className="avatar-sm">
            {ride.posterName.charAt(0)}
          </div>
          <div>
            <p className="poster-name">{isPoster ? 'Your Ride' : ride.posterName}</p>
            {getStatusBadge()}
          </div>
        </div>
        <div className="ride-fare">
          <span className="fare-label">{ride.status === 'matched' ? 'Your Share' : 'Total Fare'}</span>
          <span className="fare-amount">${splitFare.toFixed(2)}</span>
        </div>
      </div>

      <div className="ride-route">
        <div className="route-point">
          <MapPin size={18} className="route-icon pickup" />
          <span>{ride.pickup}</span>
        </div>
        <div className="route-line"></div>
        <div className="route-point">
          <MapPin size={18} className="route-icon dropoff" />
          <span>{ride.dropoff}</span>
        </div>
      </div>

      <div className="ride-details">
        <div className="detail-item">
          <Calendar size={16} />
          <span>{ride.date}</span>
        </div>
        <div className="detail-item">
          <Clock size={16} />
          <span>{ride.time}</span>
        </div>
        {isPoster && ride.requests.length > 0 && ride.status === 'open' && (
          <div className="detail-item requests-alert">
            <Users size={16} />
            <span>{ride.requests.length} Requests</span>
          </div>
        )}
      </div>

      <div className="ride-actions">
        <Link to={`/ride/${ride.id}`} className="btn btn-outline btn-full">
          View Details
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default RideCard;
