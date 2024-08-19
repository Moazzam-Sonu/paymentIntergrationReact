import { useEffect } from 'react';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Notification = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL);
    socket.on('paymentSuccess', (data) => {
      toast.success(data.message,{
        autoClose:false,
        closeOnClick:true,
      });
    });

    socket.on('paymentFailed', (data) => {
      toast.error(data.message,{
        autoClose:false,
       onClick: ()=>{
            navigate('/');
        },
        closeOnClick:true,
      });
    });

    socket.on('paymentActionRequired', (data) => {
      toast.warning(data.message, {
            autoClose: false,
            onClick: () => {handleAuthentication(data)},
            closeOnClick:true,
      },
    );
    });

    const handleAuthentication = (data) => {
      navigate(`/verify-payment/${data.productId}`, { state: { clientSecret: data.clientSecret, paymentMethodId:data.paymentMethodId } });
    };

    return () => {
      socket.disconnect();
    };
  }, [navigate]);

  return null;
};

export default Notification;
