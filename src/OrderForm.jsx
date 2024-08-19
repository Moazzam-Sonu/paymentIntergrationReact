import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { placeOrder } from './bigcommerceService';
import React, { useState, useEffect } from 'react';
import {cardStyle} from './cardStyle';
import Modal from 'react-modal';
import axios from 'axios';

function OrderForm({ initialCustomerId,subscriptionProducts }) {
  const [orderDetails, setOrderDetails] = useState({
    status_id: 1,
    customer_id: initialCustomerId,
    billing_address: {
      street_1: "123 Main Street",
      city: "Austin",
      state: "Texas",
      zip: "78751",
      country: "United States",
      country_iso2: "US",
      email: 'testcustomer@gmail.com'
    },
    products: [{ product_id: "111", quantity: 1, price_inc_tax: 0, price_ex_tax: 0 }]
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const customerAddress = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/customer/${initialCustomerId}/address`);

        const address = customerAddress.data[0];

        setOrderDetails(prevOrderDetails => ({
          ...prevOrderDetails,
          billing_address: {
            street_1: address?.street_1 || prevOrderDetails.billing_address.street_1,
            city: address?.city || prevOrderDetails.billing_address.city,
            state: address?.state || prevOrderDetails.billing_address.state,
            zip: address?.zip || prevOrderDetails.billing_address.zip,
            country: address?.country || prevOrderDetails.billing_address.country,
            country_iso2: address?.country_iso2 || prevOrderDetails.billing_address.country_iso2,
            email: subscriptionProducts[0].email || prevOrderDetails.billing_address.email,
          },
          products: subscriptionProducts.map((product) => ({
            product_id: product.productId,
            quantity: product.quantity, 
            price_inc_tax: product.amount, 
            price_ex_tax: product.amount, 
          }))
        }));

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      }
    };

    if (initialCustomerId) {
      fetchData();
    }
  }, []);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
  
    if (!stripe || !elements) {
      console.error('Stripe or elements not loaded');
      return;
    }
  
    const cardElement = elements.getElement(CardElement);
  
    try {
      setLoading(true);
  
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
  
      if (paymentMethodError) {
        setError(`Payment method creation failed: ${paymentMethodError.message}`);
        setIsErrorModalOpen(true);
        return;
      }
      const { data: { clientSecret } } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/create-payment-intent`, {
        amount: orderDetails.products.reduce((sum, product) => sum + (product.price_inc_tax*product.quantity || 0), 0),
        email: orderDetails.billing_address.email,
        paymentMethodId: paymentMethod.id,
      });
  
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
        return_url: import.meta.env.VITE_BIGCOMMERCE_STORE_URL,
      });
  
      if (confirmError) {
        setError(`Payment confirmation failed: ${confirmError.message}`);
        setIsErrorModalOpen(true);
      } else if (paymentIntent.status === 'succeeded') {
        const result = await placeOrder(orderDetails);
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/save-products`, {
          products: subscriptionProducts,
        });
        setSuccess(`Order placed successfully! Order ID: ${result.id}`);
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
      setIsErrorModalOpen(true);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className='h-full w-full flex flex-col justify-center items-center min-h-[100vh]'>
      <div className='flex flex-col justify-center items-center gap-6 border p-10 w-[50%] bg-[#fdf8ee] rounded-xl'>
        <h1 className='flex justify-center text-2xl font-semibold w-[85%]'>
          Please enter your card details.
        </h1>

          <form className="w-full max-w-md mx-auto bg-white p-8 shadow-md rounded-lg" onSubmit={handleSubmitPayment}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="card-element">
                Credit or debit card
              </label>
              <CardElement id="card-element" options={cardStyle} className="p-2 border border-gray-300 rounded w-full" />
            </div>
            <button
              type="submit"
              disabled={!stripe}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
            <button
              type="button"
              onClick={() => window.location.href = import.meta.env.VITE_BIGCOMMERCE_STORE_URL}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full mt-2"
            >
              Cancel
            </button>
          </form>
      </div>
      <Modal
        isOpen={isErrorModalOpen}
        onRequestClose={() => setIsErrorModalOpen(false)}
        contentLabel="Error"
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75"
      >
        <div className='bg-white p-6 rounded-lg w-80 max-w-sm'>
          <h2 className="text-xl font-bold mb-4">Error</h2>
          <p>{error}</p>
          <button onClick={() => setIsErrorModalOpen(false)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Close</button>
        </div>
      </Modal>
      <Modal
        isOpen={isSuccessModalOpen}
        contentLabel="Success"
        ariaHideApp={false}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75"
      >
        <div className="bg-white p-6 rounded-lg w-80 max-w-sm">
          <h2 className="text-xl font-bold mb-4">Success</h2>
          <p>{success}</p>
          <button onClick={() => window.location.href = import.meta.env.VITE_BIGCOMMERCE_STORE_URL} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">OK</button>
        </div>
      </Modal>
    </div>
  );
}
export default OrderForm;
