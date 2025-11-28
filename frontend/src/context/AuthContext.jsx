import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get ID token
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('token', token);
        
        // Verify with backend and get role
        try {
          const response = await client.post('/auth/google', { token });
          setUser(response.data);
        } catch (error) {
          console.error("Backend auth failed", error);
          // Fallback or logout?
          // For now, let's keep the firebase user but maybe without role?
          // Or force logout.
          // Let's assume backend creates user if not exists.
        }
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async (role = 'user') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      
      // Send token and selected role to backend to create/update user
      const response = await client.post('/auth/google', { token, role });
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Google Sign-In Error", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
