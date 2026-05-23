import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);

  const googleProvider = new GoogleAuthProvider();

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      try {
        // Check if profile exists, if not create one
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          const profileData = {
            name: user.displayName || '',
            phone: user.phoneNumber || '',
            email: user.email,
            photoUrl: user.photoURL || '',
            isVerified: false,
            rating: 0,
            createdAt: new Date().toISOString()
          };
          await setDoc(profileRef, profileData);
          setUserProfile(profileData);
        } else {
          setUserProfile(profileSnap.data());
        }
      } catch (firestoreError) {
        console.error("Firestore error during Google login:", firestoreError);
        // We still have the auth user, so we can proceed, 
        // but userProfile might be missing until they go online.
      }
      
      return result;
    } catch (authError) {
      console.error("Google Auth error:", authError);
      throw authError;
    }
  };

  // Sign up and create Firestore profile document
  const signup = async (email, password, additionalData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the profile document in Firestore
    const profileRef = doc(db, 'users', user.uid);
    const profileData = {
      name: additionalData.name || '',
      phone: additionalData.phone || '',
      email: email,
      photoUrl: '',
      isVerified: false,
      rating: 0,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(profileRef, profileData);
    setUserProfile(profileData);
    
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Update profile data in Firestore
  const updateProfileData = async (data) => {
    if (!currentUser) return;
    const profileRef = doc(db, 'users', currentUser.uid);
    await setDoc(profileRef, data, { merge: true });
    setUserProfile(prev => ({ ...prev, ...data }));
  };

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Clear previous profile listener if any
      if (unsubscribeProfile) unsubscribeProfile();

      if (user) {
        // We have the auth user, show the app immediately
        setLoading(false);
        
        // Use onSnapshot for instant cache access and real-time updates
        const profileRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserProfile(data);
            
            // Auto-reactivate if deactivated
            if (data.isDeactivated) {
              await setDoc(profileRef, { isDeactivated: false }, { merge: true });
            }
          } else {
            // No profile yet (new user), allow them to see the app
            setUserProfile(null);
          }
        }, (error) => {
          console.error("Firestore Profile Error:", error);
          setUserProfile(null);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfileData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex items-center justify-center min-h-screen bg-surface">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
