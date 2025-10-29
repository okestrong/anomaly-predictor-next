'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastProvider = () => {
   return <ToastContainer autoClose={6000} />;
};

export default ToastProvider;
