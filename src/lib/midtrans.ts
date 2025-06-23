// Midtrans API Integration
// Documentation: https://docs.midtrans.com/en/snap/integration-guide

export type MidtransConfig = {
  isProduction: boolean;
  clientKey: string;
  serverKey: string;
};

export type MidtransPaymentRequest = {
  orderId: string;
  amount: number;
  customerDetails: {
    firstName: string;
    email: string;
  };
  paymentType?: string;
  callbackUrl?: string;
};

// Function to initialize Midtrans Snap
export const initMidtransSnap = (): Promise<void> => {
  return new Promise((resolve) => {
    // Check if Midtrans script is already loaded
    if (window.snap) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://app.sandbox.midtrans.com/snap/snap.js`;
    script.async = true;
    script.dataset.clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

// Function to generate a unique order ID
export const generateOrderId = (): string => {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000);
  return `DONATION-${timestamp}-${randomNum}`;
};

// Function to open Midtrans Snap payment page
export const openMidtransSnap = async (transactionToken: string): Promise<any> => {
  await initMidtransSnap();
  
  return new Promise((resolve, reject) => {
    if (!window.snap) {
      reject(new Error('Midtrans Snap is not initialized'));
      return;
    }

    window.snap.pay(transactionToken, {
      onSuccess: function(result: any) {
        resolve(result);
      },
      onPending: function(result: any) {
        resolve(result);
      },
      onError: function(result: any) {
        reject(result);
      },
      onClose: function() {
        reject(new Error('Payment canceled by user'));
      }
    });
  });
};

// Add TypeScript interface for window object to include snap
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
} 