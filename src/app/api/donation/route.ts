import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { donations } from '@/db/schema';
import { generateOrderId } from '@/lib/midtrans';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, amount, paymentMethod } = data;
    
    if (!name || !email || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Generate a unique order ID
    const orderId = generateOrderId();
    
    // Create donation record in database
    await db.insert(donations).values({
      name,
      email,
      amount,
      orderId,
      paymentMethod,
      paymentStatus: 'pending',
    });
    
    // Create Midtrans transaction
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        credit_card: {
          secure: true
        },
        customer_details: {
          first_name: name,
          email: email
        }
      })
    });
    
    const midtransResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(midtransResponse.message || 'Failed to create transaction');
    }
    
    return NextResponse.json({
      success: true,
      token: midtransResponse.token,
      redirect_url: midtransResponse.redirect_url
    });
    
  } catch (error) {
    console.error('Error processing donation:', error);
    return NextResponse.json({ 
      error: 'Failed to process donation' 
    }, { status: 500 });
  }
}

// Handle Midtrans notification webhook
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Get relevant data from notification
    const { 
      order_id, 
      transaction_id, 
      transaction_status, 
      payment_type, 
      fraud_status 
    } = data;
    
    // Validate signature (in production)
    // Here you would verify the notification is authentic
    
    // Map Midtrans status to our status
    let paymentStatus: 'pending' | 'success' | 'failed' | 'expired' | 'cancel' | 'deny' | 'challenge' = 'pending';
    
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept') {
        paymentStatus = 'success';
      }
    } else if (transaction_status === 'deny') {
      paymentStatus = 'deny';
    } else if (transaction_status === 'cancel' || transaction_status === 'expire') {
      paymentStatus = 'expired';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
    }
    
    // Update donation status in database
    await db.update(donations)
      .set({ 
        paymentStatus: paymentStatus, 
        transactionId: transaction_id,
        paymentType: payment_type,
        updatedAt: new Date()
      })
      .where(eq(donations.orderId, order_id));
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
} 