import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { donations } from '@/db/schema';
import { paymentStatusEnum } from '@/db/schema/donation';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

// Direct database client for raw queries if needed
let pgClient: ReturnType<typeof postgres> | null = null;
if (process.env.DIRECT_URL) {
  pgClient = postgres(process.env.DIRECT_URL);
  console.log('Database connection established with pgClient');
}

// Map Midtrans transaction status to our payment status enum
const mapTransactionStatus = (transaction_status: string, fraud_status?: string): string => {
  // Valid statuses in our system: 'pending', 'success', 'failed', 'expired', 'cancel', 'deny', 'challenge'
  console.log(`Mapping transaction status: ${transaction_status}, fraud status: ${fraud_status}`);
  switch (transaction_status) {
    case 'capture':
      return fraud_status === 'accept' ? 'success' : (fraud_status === 'challenge' ? 'challenge' : 'pending');
    case 'settlement':
      return 'success';
    case 'deny':
      return 'deny';
    case 'cancel':
      return 'cancel';
    case 'expire':
      return 'expired';
    case 'pending':
      return 'pending';
    case 'refund':
      return 'cancel';
    default:
      return 'pending';
  }
};

// Handle webhook notifikasi dari Midtrans
export async function POST(req: NextRequest) {
  console.log('======================================================');
  console.log('WEBHOOK RECEIVED: ' + new Date().toISOString());
  
  try {
    // Enable signature verification for production
    if (process.env.NODE_ENV === 'production' && process.env.BYPASS_WEBHOOK_VERIFICATION !== 'true') {
      console.log('Verifying webhook signature...');
      const isRequestValid = await verifyMidtransSignature(req);
      if (!isRequestValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('Webhook signature valid');
    } else {
      console.log('Webhook signature verification bypassed');
    }
    
    // Get body and validate
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();
    console.log('Raw webhook payload:', rawBody);
    
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse webhook data as JSON:', e);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    console.log('Webhook data:', JSON.stringify(data, null, 2));
    
    // Extract data from notification
    const { 
      order_id, 
      transaction_id, 
      transaction_status, 
      payment_type,
      fraud_status,
      gross_amount,
      status_code,
      status_message,
      transaction_time
    } = data;
    
    if (!order_id) {
      console.error('Missing order_id in webhook data');
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }
    
    console.log(`WEBHOOK: Processing for order ${order_id}`);
    console.log(`WEBHOOK: Transaction status: ${transaction_status}`);
    console.log(`WEBHOOK: Fraud status: ${fraud_status}`);
    console.log(`WEBHOOK: Payment type: ${payment_type}`);
    
    // Map the transaction status to our payment status enum
    const paymentStatus = mapTransactionStatus(transaction_status, fraud_status);
    console.log(`WEBHOOK: Mapped payment status: ${paymentStatus}`);
    
    // Store payment details as JSON string
    const paymentDetails = JSON.stringify({
      transaction_time,
      status_code,
      status_message,
      gross_amount,
      payment_type,
      transaction_id,
      transaction_status,
      fraud_status,
      last_updated: new Date().toISOString(),
      webhook_received_at: new Date().toISOString()
    });
    
    console.log(`WEBHOOK: Attempting to update database for order ${order_id}`);
    
    // SIMPLIFIED UPDATE APPROACH: Use only one reliable method
    try {
      // First check if the order exists
      const existing = await db.select()
        .from(donations)
        .where(eq(donations.orderId, order_id))
        .limit(1);
      
      if (!existing || existing.length === 0) {
        console.error(`WEBHOOK ERROR: Donation not found for order_id ${order_id}`);
        return NextResponse.json({ error: 'Donation not found', order_id }, { status: 404 });
      }
      
      console.log(`WEBHOOK: Current payment status for ${order_id}: ${existing[0].paymentStatus}`);
      
      // Use drizzle's update method
      await db.update(donations)
        .set({
          paymentStatus: paymentStatus as any, // Force the type
          transactionId: transaction_id,
          paymentType: payment_type,
          paymentDetails: paymentDetails,
          updatedAt: new Date()
        })
        .where(eq(donations.orderId, order_id));
      
      console.log(`WEBHOOK: Database update attempted for order ${order_id}`);
      
      // Verify the update
      const updatedDonation = await db.select()
        .from(donations)
        .where(eq(donations.orderId, order_id))
        .limit(1);
      
      if (updatedDonation && updatedDonation.length > 0) {
        console.log(`WEBHOOK: Verified update - new payment status: ${updatedDonation[0].paymentStatus}`);
        
        // If payment is successful, trigger additional events here
        if (paymentStatus === 'success') {
          console.log(`WEBHOOK: Payment successful for order ${order_id}. Triggering success processes.`);
          // Example: await sendThankYouEmail(order_id);
        }
        
        return NextResponse.json({ 
          success: true,
          order_id,
          status: paymentStatus,
          verified_status: updatedDonation[0].paymentStatus
        });
      } else {
        console.error(`WEBHOOK ERROR: Update verification failed`);
        return NextResponse.json({ error: 'Failed to verify donation update' }, { status: 500 });
      }
    } catch (error) {
      console.error(`WEBHOOK ERROR: Database update failed:`, error);
      return NextResponse.json({ 
        error: 'Failed to update donation',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('WEBHOOK ERROR: Unhandled exception:', error);
    return NextResponse.json({ 
      error: 'Failed to process webhook',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    console.log('======================================================');
  }
}

// Untuk testing webhook dan simulasi
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const orderId = url.searchParams.get('order_id');
  
  // Check status only without updating
  if (action === 'check' && orderId) {
    try {
      console.log(`Checking payment status for order ${orderId}`);
      
      // Query the database for the donation with the given order ID
      const donation = await db.select()
        .from(donations)
        .where(eq(donations.orderId, orderId))
        .limit(1);
      
      if (!donation || donation.length === 0) {
        console.log(`Status check: Donation not found for order_id ${orderId}`);
        return NextResponse.json({ 
          error: 'Donation not found', 
          order_id: orderId 
        }, { status: 404 });
      }
      
      const donationData = donation[0];
      console.log(`Status check: Found donation with status ${donationData.paymentStatus}`);
      
      // Parse payment details JSON if it exists
      let parsedPaymentDetails = {};
      if (donationData.paymentDetails) {
        try {
          parsedPaymentDetails = JSON.parse(String(donationData.paymentDetails));
        } catch (e) {
          console.error('Error parsing payment details:', e);
          // Continue without parsed details
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Payment status for order ${orderId}`,
        data: {
          order_id: donationData.orderId,
          amount: donationData.amount,
          payment_status: donationData.paymentStatus,
          payment_method: donationData.paymentMethod,
          payment_type: donationData.paymentType,
          transaction_id: donationData.transactionId,
          updated_at: donationData.updatedAt,
          created_at: donationData.createdAt,
          email: donationData.email,
          name: donationData.name,
          payment_details: parsedPaymentDetails
        }
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
      return NextResponse.json({ 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  }
  
  // Direct update payment status (bypass webhook simulation)
  if (action === 'direct-update' && orderId) {
    try {
      const status = url.searchParams.get('status') || 'success';
      console.log(`Directly updating payment status to ${status} for order ${orderId}`);
      
      // Validate status is a valid enum value
      if (!['pending', 'success', 'failed', 'expired', 'cancel', 'deny', 'challenge'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      
      // Use drizzle update
      const updateResult = await db.update(donations)
        .set({
          paymentStatus: status as any, // Force the type
          updatedAt: new Date()
        })
        .where(eq(donations.orderId, orderId));
      
      // Verify the update
      const updated = await db.select()
        .from(donations)
        .where(eq(donations.orderId, orderId))
        .limit(1);
      
      if (updated && updated.length > 0) {
        return NextResponse.json({
          success: true,
          message: `Updated payment status to ${status}`,
          new_status: updated[0].paymentStatus
        });
      } else {
        return NextResponse.json({
          error: 'Failed to update or verify the update',
        }, { status: 500 });
      }
      
    } catch (error) {
      console.error('Direct update error:', error);
      return NextResponse.json({ 
        error: 'Failed to update payment status',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  }
  
  // If action and orderId are provided, simulate a payment status update
  if (action && orderId && !['check', 'direct-update'].includes(action)) {
    try {
      console.log(`Simulating ${action} for order ${orderId}`);
      
      // Map action to transaction_status
      let transactionStatus = '';
      let fraudStatus = '';
      
      switch(action) {
        case 'success':
          transactionStatus = 'settlement';
          fraudStatus = 'accept';
          break;
        case 'pending':
          transactionStatus = 'pending';
          break;
        case 'failed':
        case 'deny':
          transactionStatus = 'deny';
          break;
        case 'expire':
        case 'expired':
          transactionStatus = 'expire';
          break;
        case 'cancel':
          transactionStatus = 'cancel';
          break;
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
      
      // Create a simulated webhook payload
      const simulatedPayload = {
        order_id: orderId,
        transaction_id: `sim-${Date.now()}`,
        transaction_status: transactionStatus,
        fraud_status: fraudStatus,
        payment_type: 'simulation',
        gross_amount: 10000,
        status_code: '200',
        status_message: 'Simulation',
        transaction_time: new Date().toISOString(),
        simulation: true
      };
      
      // Process the simulated webhook
      // Create a new Request object to simulate a webhook
      const simulatedReq = new Request('http://localhost/api/payment/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simulatedPayload)
      }) as unknown as NextRequest;
      
      // Call the POST handler with the simulated request
      const response = await POST(simulatedReq);
      const responseData = await response.json();
      
      return NextResponse.json({
        success: true,
        message: `Simulated ${action} for order ${orderId}`,
        webhook_response: responseData,
        payload: simulatedPayload
      });
    } catch (error) {
      console.error('Simulation error:', error);
      return NextResponse.json({ 
        error: 'Simulation failed',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }
  }
  
  return NextResponse.json({
    status: 'ok',
    message: 'Midtrans webhook endpoint is active',
    timestamp: new Date().toISOString(),
    help: `
      Available actions:
      - ?action=direct-update&order_id=YOUR_ORDER_ID&status=success - Directly update payment status (bypass webhook)
      - ?action=check&order_id=YOUR_ORDER_ID - Check payment status without updating
      - ?action=success&order_id=YOUR_ORDER_ID - Simulate successful payment
      - ?action=pending&order_id=YOUR_ORDER_ID - Simulate pending payment
      - ?action=expire&order_id=YOUR_ORDER_ID - Simulate expired payment
      - ?action=deny&order_id=YOUR_ORDER_ID - Simulate denied payment
      - ?action=cancel&order_id=YOUR_ORDER_ID - Simulate cancelled payment
    `
  });
}

// Verify the Midtrans webhook signature
async function verifyMidtransSignature(req: NextRequest): Promise<boolean> {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('MIDTRANS_SERVER_KEY not configured');
      return false;
    }
    
    // Get signature from headers - try multiple possible header names
    const signatureKey = req.headers.get('X-Signature-Key') || 
                       req.headers.get('x-signature') ||
                       req.headers.get('signature-key') ||
                       req.headers.get('X-Callback-Signature') ||
                       req.headers.get('x-callback-signature');
                       
    console.log('Headers received:', Object.fromEntries(req.headers.entries()));
                       
    if (!signatureKey) {
      console.error('Missing signature header');
      return false;
    }
    
    // Clone the request to get the body without consuming the original
    const clonedReq = req.clone();
    const rawBody = await clonedReq.text();
    
    // Create signature using SHA512
    const expectedSignature = crypto
      .createHmac('sha512', serverKey)
      .update(rawBody)
      .digest('hex');
    
    // Compare signatures
    const isValid = expectedSignature === signatureKey;
    if (!isValid) {
      console.error('Signature mismatch. Possible security issue.');
      console.log('Expected:', expectedSignature);
      console.log('Received:', signatureKey);
    }
    
    return isValid;
  } catch (error) {
    console.error('Error verifying Midtrans signature:', error);
    return false;
  }
} 