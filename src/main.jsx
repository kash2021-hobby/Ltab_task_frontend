import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import './index.css';

// Default API URL (VPS Production: https://task.ltabai.in)
const VPS_API_URL = 'https://task.ltabai.in';
const envApiUrl = import.meta.env.VITE_API_URL;

const apiBase = envApiUrl && envApiUrl.trim() !== '' ? envApiUrl.trim() : VPS_API_URL;
axios.defaults.baseURL = apiBase;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
