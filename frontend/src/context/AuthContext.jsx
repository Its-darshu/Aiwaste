import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const checkUserLoggedIn = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await client.get('/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error("Token invalid", error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      // OAuth2PasswordRequestForm expects form data, not JSON
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const response = await client.post('/auth/login', formData);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      
      // Fetch user details immediately after login
      const userResponse = await client.get('/auth/me');
      setUser(userResponse.data);
      
      return true;
    } catch (error) {
      console.error("Login Error", error);
      throw error;
    }
  };

  const qrLogin = async (token) => {
    try {
      const response = await client.post('/auth/qr-login', { token });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      const userResponse = await client.get('/auth/me');
      setUser(userResponse.data);
      return true;
    } catch (error) {
      console.error("QR Login Error", error);
      throw error;
    }
  };

  const signup = async (email, password, fullName, role, phoneNumber) => {
    try {
      await client.post('/auth/signup', { 
        email, 
        password, 
        full_name: fullName, 
        role,
        phone_number: phoneNumber
      });
      // Auto login after signup
      await login(email, password);
    } catch (error) {
      console.error("Signup Error", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
        await client.post('/auth/logout');
    } catch (e) {
        console.error("Logout notify failed", e);
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, qrLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
