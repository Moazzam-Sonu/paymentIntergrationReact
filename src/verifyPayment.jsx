import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const VerifyPayment = () => {
  const { productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const clientSecret = location.state?.clientSecret;
  const paymentMethodId = location.state?.paymentMethodId;
  const [loading, setLoading] = useState(false);

  const handlePaymentConfirmation = async () => {
    if (!clientSecret) return;

    setLoading(true);

    const stripe = await stripePromise;

    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret,{
        payment_method:paymentMethodId,
    });
    console.error(error);

    if (error) {
      toast.error('Payment verification failed. Please try again.');
      navigate('/');
    } else if (paymentIntent.status === 'succeeded') {
     try{
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/confirm-payment/${productId}`);
     } catch(err){
        console.error('error updating database',err);
     }
     toast.success('Payment verified successfully!');
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-4">Payment Confirmation</h1>
        <p className="text-gray-600 mb-6">Please confirm your payment to proceed!</p>
        <button
          onClick={handlePaymentConfirmation}
          className={`bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-md w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Confirming...' : 'Confirm Payment'}
        </button>
        <button
          onClick={()=>navigate('/')}
          className={`mt-2 bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full `}
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
};

export default VerifyPayment;


