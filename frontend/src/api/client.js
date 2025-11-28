import axios from 'axios';

const client = axios.create({
  baseURL: '', // Use relative path to leverage Vite proxy
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
