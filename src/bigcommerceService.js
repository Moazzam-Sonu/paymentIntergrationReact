import axios from 'axios';

export const placeOrder = async (orderData) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/create-order`, orderData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};
