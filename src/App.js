import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';

function App() {
  return (
<HashRouter>
    <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Landing />} />
        <Route path="/websites" element={<Landing />} />
    </Routes>
</HashRouter>
)}

export default App;
