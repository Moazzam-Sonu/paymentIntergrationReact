import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import OrderForm from './OrderForm';
import axios from 'axios';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function StripeWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [subscriptionProducts, setSubscriptionProducts] = useState([]);

  useEffect(() => {
    // Function to fetch data from your API
    const fetchData = async () => {
      try {
        const url = window.location.href;
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        const cartId = params.get('cartId');
        const items = params.get('items');
        const parsedItems = JSON.parse(decodeURIComponent(items));

        if (!Array.isArray(parsedItems)) {
          console.error('Parsed items is not an array:', parsedItems);
          return;
        }

        // Fetch cart data from the server
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/cart/${cartId}`);
        const data = response.data;

        // Safeguard: Check if line_items and physical_items exist
        const products = data.line_items?.physical_items || [];
        
        // Log the entire response to check the structure
        console.log('API Response:', data);

        const combinedData = parsedItems.map(item => {
          const product = products.find(product => product.product_id === parseInt(item.productId));

          if (product) {
            return {
              productId: parseInt(item.productId),
              subscription: item.subscription,
              quantity: product.quantity,
              amount: product.sale_price,
              email: data.email,
            };
          }

          return null;
        }).filter(Boolean);

        setCustomerId(data.customer_id);
        setSubscriptionProducts(combinedData);
        setIsMounted(true);
      } catch (error) {
        console.error('Error fetching cart data:', error.response ? error.response.data : error.message);
      }
    };

    fetchData();
  }, []);

  return (
    <Elements stripe={stripePromise}>
      {isMounted && (
        <OrderForm
          initialCustomerId={customerId}
          subscriptionProducts={subscriptionProducts}
        />
      )}
    </Elements>
  );
}

export default StripeWrapper;
