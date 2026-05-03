import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [currentUser] = useState({
    id: 'u1',
    name: 'Alex Johnson',
    rating: 4.8,
  });

  const [rides, setRides] = useState([
    {
      id: 'r1',
      posterId: 'u2',
      posterName: 'Sarah Smith',
      pickup: 'JFK Airport',
      dropoff: 'Times Square',
      date: '2026-05-05',
      time: '14:00',
      totalFare: 60,
      status: 'open', // open, matched, completed
      requests: [], // list of user ids who requested to join
      approvedPassenger: null,
      chat: []
    },
    {
      id: 'r2',
      posterId: 'u1',
      posterName: 'Alex Johnson',
      pickup: 'Central Park',
      dropoff: 'Brooklyn Museum',
      date: '2026-05-06',
      time: '10:30',
      totalFare: 40,
      status: 'open',
      requests: [
        { id: 'u3', name: 'Mike Davis', rating: 4.9 }
      ],
      approvedPassenger: null,
      chat: []
    }
  ]);

  const addRide = (rideData) => {
    const newRide = {
      ...rideData,
      id: `r${Date.now()}`,
      posterId: currentUser.id,
      posterName: currentUser.name,
      status: 'open',
      requests: [],
      approvedPassenger: null,
      chat: []
    };
    setRides([...rides, newRide]);
  };

  const requestToJoin = (rideId) => {
    setRides(rides.map(ride => {
      if (ride.id === rideId) {
        return {
          ...ride,
          requests: [...ride.requests, { id: currentUser.id, name: currentUser.name, rating: currentUser.rating }]
        };
      }
      return ride;
    }));
  };

  const approveRequest = (rideId, passengerId) => {
    setRides(rides.map(ride => {
      if (ride.id === rideId) {
        const passenger = ride.requests.find(r => r.id === passengerId);
        return {
          ...ride,
          status: 'matched',
          approvedPassenger: passenger,
          chat: [
            { senderId: 'system', text: `Match confirmed! You can now chat.` }
          ]
        };
      }
      return ride;
    }));
  };

  const addChatMessage = (rideId, text) => {
    setRides(rides.map(ride => {
      if (ride.id === rideId) {
        return {
          ...ride,
          chat: [...ride.chat, { senderId: currentUser.id, text, timestamp: new Date().toISOString() }]
        };
      }
      return ride;
    }));
  };

  const value = {
    currentUser,
    rides,
    addRide,
    requestToJoin,
    approveRequest,
    addChatMessage
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
