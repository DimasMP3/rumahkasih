'use client';

import React, { useState } from 'react';
import { DonationForm } from '@/components/donate/DonationForm';

const DonatePage = () => {
  const [orderId, setOrderId] = useState('');
  const [statusResult, setStatusResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to test the payment status
  const checkPaymentStatus = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payment/webhook?action=check&order_id=${orderId}`);
      console.log('response', response);
      const data = await response.json();
      setStatusResult(data);
    } catch (error) {
      setStatusResult({ error: error instanceof Error ? error.message : 'Failed to check status' });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update the payment status
  const updatePaymentStatus = async (status: string) => {
    if (!orderId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payment/webhook?action=direct-update&order_id=${orderId}&status=${status}`);
      const data = await response.json();
      setStatusResult(data);
      
      // After updating, check the status again to verify
      setTimeout(checkPaymentStatus, 1000);
    } catch (error) {
      setStatusResult({ error: error instanceof Error ? error.message : 'Failed to update status' });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <DonationForm />

      {/* Debug panel - only show in development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-300 w-96 max-w-[90vw] overflow-auto">
          <h3 className="text-sm font-bold mb-2 text-gray-700">Payment Status Tester</h3>
          
          <div className="mb-3">
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            <button 
              className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
              onClick={checkPaymentStatus}
              disabled={isLoading || !orderId}
            >
              Check Status
            </button>
            <button 
              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
              onClick={() => updatePaymentStatus('success')}
              disabled={isLoading || !orderId}
            >
              Set Success
            </button>
            <button 
              className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
              onClick={() => updatePaymentStatus('pending')}
              disabled={isLoading || !orderId}
            >
              Set Pending
            </button>
            <button 
              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
              onClick={() => updatePaymentStatus('expired')}
              disabled={isLoading || !orderId}
            >
              Set Expired
            </button>
          </div>
          
          {isLoading && <div className="text-sm text-gray-500">Loading...</div>}
          
          {statusResult && (
            <div className="mt-2 text-xs">
              <div className="font-bold mb-1">Result:</div>
              <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(statusResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonatePage; 