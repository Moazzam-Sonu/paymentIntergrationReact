import React from 'react';
import StripeWrapper from './stripeWrapper';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Notification from './notifications';
import VerifyPayment from './verifyPayment';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
            <Notification/>
           <ToastContainer/>

    <Routes>
      <Route path="/" element={<StripeWrapper />} />
      <Route path="/verify-payment/:productId" element={<VerifyPayment />} /> {/* New route */}
    </Routes>
  </Router>
  );
}

export default App;
