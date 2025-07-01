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

// Define types for Midtrans response
export type MidtransResult = {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  [key: string]: unknown; // For any additional properties that might be returned
};

// Function to open Midtrans Snap payment page
export const openMidtransSnap = async (transactionToken: string): Promise<MidtransResult> => {
  await initMidtransSnap();
  
  return new Promise((resolve, reject) => {
    if (!window.snap) {
      reject(new Error('Midtrans Snap is not initialized'));
      return;
    }

    window.snap.pay(transactionToken, {
      onSuccess: function(result: MidtransResult) {
        resolve(result);
      },
      onPending: function(result: MidtransResult) {
        resolve(result);
      },
      onError: function(result: MidtransResult) {
        reject(result);
      },
      onClose: function() {
        reject(new Error('Payment canceled by user'));
      }
    });
  });
};

// Define type for Midtrans Snap options
type MidtransSnapOptions = {
  onSuccess: (result: MidtransResult) => void;
  onPending: (result: MidtransResult) => void;
  onError: (result: MidtransResult) => void;
  onClose: () => void;
};

// Add TypeScript interface for window object to include snap
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: MidtransSnapOptions) => void;
    };
  }
} 