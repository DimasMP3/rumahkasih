import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { donations } from '@/db/schema';
import { generateOrderId } from '@/lib/midtrans';
import { eq } from 'drizzle-orm';

// Helper function to get enabled payment methods
function getEnabledPayments(paymentMethod: string): string[] {
  switch(paymentMethod) {
  
    case 'bank-transfer':
      return ['permata_va', 'bca_va', 'mandiri_bill', 'bni_va', 'bri_va'];
    case 'e-wallet':
      return ['gopay', 'shopeepay', 'qris'];
    default:
      return [];
  } 
}

// Helper function to generate bank transfer instructions
function generateBankTransferInstructions(response: any): string[] {
  // In a real implementation, this would parse the response from Midtrans
  // and generate appropriate instructions based on the bank
  return [
    'Buka aplikasi mobile banking atau internet banking Anda.',
    'Pilih menu Transfer > Virtual Account.',
    'Masukkan nomor virtual account yang tertera di atas.',
    'Masukkan jumlah pembayaran sesuai dengan total yang tertera.',
    'Konfirmasi dan selesaikan pembayaran Anda.',
    'Pembayaran akan dikonfirmasi secara otomatis.'
  ];
}

// Helper function to generate e-wallet instructions
function generateEWalletInstructions(response: any): string[] {
  // In a real implementation, this would parse the response from Midtrans
  // and generate appropriate instructions based on the e-wallet type
  return [
    'Buka aplikasi e-wallet Anda.',
    'Pilih menu Scan atau Pay.',
    'Scan kode QR yang disediakan atau masukkan kode pembayaran.',
    'Konfirmasi pembayaran di aplikasi e-wallet Anda.',
    'Pembayaran akan dikonfirmasi secara otomatis.'
  ];
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, amount, paymentMethod, bankName, ewalletType } = data;
    
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
    
    // Get enabled payment methods based on selection
    let enabledPayments: string[] = [];
    if (paymentMethod === 'bank-transfer' && bankName) {
      // Map the bank name to Midtrans payment method
      switch(bankName) {
        case 'bca':
          enabledPayments = ['bca_va'];
          break;
        case 'bni':
          enabledPayments = ['bni_va'];
          break;
        case 'bri':
          enabledPayments = ['bri_va'];
          break;
        case 'mandiri':
          enabledPayments = ['mandiri_bill'];
          break;
        case 'permata':
          enabledPayments = ['permata_va'];
          break;
        default:
          enabledPayments = ['bca_va', 'bni_va', 'bri_va'];
      }
    } else if (paymentMethod === 'e-wallet' && ewalletType) {
      enabledPayments = [ewalletType];
    } else {
      enabledPayments = getEnabledPayments(paymentMethod);
    }
    
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
        },
        enabled_payments: enabledPayments
      })
    });
    
    const midtransResponse = await response.json();
    console.log(midtransResponse);
    
    if (!response.ok) {
      throw new Error(midtransResponse.message || 'Failed to create transaction');
    }
    
    // Generate payment instructions based on payment method
    let paymentInstructions;
    if (paymentMethod === 'bank-transfer') {
      paymentInstructions = {
        bank_name: midtransResponse.va_numbers?.[0]?.bank || 'default',
        va_number: midtransResponse.va_numbers?.[0]?.va_number || '123456789',
        instructions: generateBankTransferInstructions(midtransResponse)
      };
    } else if (paymentMethod === 'e-wallet') {
      paymentInstructions = {
        payment_code: midtransResponse.payment_code || '123456',
        instructions: generateEWalletInstructions(midtransResponse)
      };
    }
    
    return NextResponse.json({
      success: true,
      token: midtransResponse.token,
      redirect_url: midtransResponse.redirect_url,
      order_id: orderId,
      payment_instructions: paymentInstructions
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

// GET endpoint to check payment status by order_id
export async function GET(req: NextRequest) {
  try {
    // Get order_id from query params
    const url = new URL(req.url);
    const orderId = url.searchParams.get('order_id');
    console.log(`[STATUS CHECK] Checking payment status for order_id: ${orderId}`);

    if (!orderId) {
      console.log('[STATUS CHECK] Missing order ID');
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
    }

    // Query the database for the donation with the given order ID
    console.log(`[STATUS CHECK] Querying database for order_id: ${orderId}`);
    const donation = await db.select()
      .from(donations)
      .where(eq(donations.orderId, orderId))
      .limit(1);

    if (!donation || donation.length === 0) {
      console.log(`[STATUS CHECK] Donation not found for order_id: ${orderId}`);
      return NextResponse.json({ error: 'Donation not found', order_id: orderId }, { status: 404 });
    }

    const donationData = donation[0];
    console.log(`[STATUS CHECK] Found donation with status: ${donationData.paymentStatus}`);

    // Parse payment details JSON if available
    let paymentDetails = {};
    if (donationData.paymentDetails) {
      try {
        paymentDetails = JSON.parse(String(donationData.paymentDetails));
        console.log(`[STATUS CHECK] Payment details parsed successfully`);
      } catch (err) {
        console.error(`[STATUS CHECK] Error parsing payment details:`, err);
      }
    }

    // Return the payment status with comprehensive information
    return NextResponse.json({
      success: true,
      orderId: donationData.orderId,
      status: donationData.paymentStatus,
      amount: donationData.amount,
      transaction_status: donationData.paymentStatus, // For compatibility with Midtrans format
      transaction_id: donationData.transactionId,
      payment_method: donationData.paymentMethod,
      payment_type: donationData.paymentType,
      updated_at: donationData.updatedAt,
      created_at: donationData.createdAt,
      payment_details: paymentDetails,
      email: donationData.email,
      name: donationData.name
    });

  } catch (error) {
    console.error('[STATUS CHECK] Error checking payment status:', error);
    return NextResponse.json({ 
      error: 'Failed to check payment status',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 