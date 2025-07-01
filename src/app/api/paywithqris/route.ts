import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Fungsi untuk generate order ID
function generateOrderId(): string {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000);
  return `QRIS-${timestamp}-${randomNum}`;
}

// Fungsi untuk generate instruksi pembayaran QRIS
function generateQRISInstructions(): string[] {
  return [
    'Buka aplikasi mobile banking atau e-wallet yang mendukung QRIS',
    'Pilih menu Scan QR atau QRIS',
    'Scan QR Code yang ditampilkan',
    'Periksa informasi merchant dan jumlah pembayaran',
    'Konfirmasi dan selesaikan pembayaran'
  ];
}

export async function POST(req: NextRequest) {
  try {
    // Validate Midtrans server key before proceeding
    if (!process.env.MIDTRANS_SERVER_KEY) {
      console.error('MIDTRANS_SERVER_KEY tidak ditemukan');
      return NextResponse.json({ error: 'Konfigurasi pembayaran tidak lengkap' }, { status: 500 });
    }
    
    // Validate request body
    let data;
    try {
      data = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Format request tidak valid' }, { status: 400 });
    }
    
    const { name, email, amount } = data;
    
    if (!name || !email || !amount) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    // Generate order ID unik
    const orderId = generateOrderId();
    console.log('Generated QRIS Order ID:', orderId);
    
    try {
      // Create donation record in database
      await db.insert(donations).values({
        name,
        email,
        amount,
        orderId,
        paymentMethod: 'ewallet', // QRIS dimasukkan sebagai ewallet di DB
        paymentType: 'qris',
        paymentStatus: 'pending',
      });
      
      console.log('QRIS donation record created successfully');
    } catch (error) {
      console.error('Error creating donation record:', error);
      return NextResponse.json({ error: 'Gagal menyimpan data donasi' }, { status: 500 });
    }
    
    // Buat authorization header
    const auth = `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`;
    let response;
    
    // Siapkan payload sesuai dengan format Midtrans Charge API untuk QRIS
    const payload = {
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: name,
        email: email
      },
      qris: {
        acquirer: "gopay"
      },
      custom_expiry: {
        expiry_duration: 60,
        unit: "minute"
      }
    };
    
    console.log('QRIS API payload:', JSON.stringify(payload));
    
    try {
      // Panggil API Midtrans Charge untuk QRIS
      response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify(payload)
      });
      
      console.log('QRIS API response status:', response.status);
    } catch (error) {
      console.error('Error calling QRIS API:', error);
      return NextResponse.json({ 
        error: 'Gagal terhubung ke payment gateway' 
      }, { status: 500 });
    }
    
    // Check if response is ok
    if (!response || !response.ok) {
      let errorMessage = 'Gagal membuat transaksi QRIS';
      
      if (response) {
        try {
          const errorData = await response.json();
          console.error('Payment gateway error:', errorData);
          errorMessage = errorData.message || errorData.error_messages?.[0] || 'Gagal membuat transaksi QRIS';
        } catch (e) {
          try {
            const text = await response.text();
            console.error('Payment gateway response (not JSON):', text);
            errorMessage = text || 'Gagal membuat transaksi QRIS';
          } catch (e2) {
            console.error('Failed to read error response');
          }
        }
      }
      
      // Update status transaksi menjadi failed jika ada error
      await db.update(donations)
        .set({ paymentStatus: 'failed' })
        .where(eq(donations.orderId, orderId));
      
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
    
    // Parse response
    let midtransResponse;
    try {
      midtransResponse = await response.json();
      console.log('Successful QRIS response:', JSON.stringify(midtransResponse));
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json({ 
        error: 'Tidak dapat memproses respons dari payment gateway' 
      }, { status: 500 });
    }
    
    // Extract QR code URL dari response
    let qrCodeUrl = '';
    
    if (midtransResponse.actions && Array.isArray(midtransResponse.actions)) {
      console.log('Found actions array in response');
      for (const action of midtransResponse.actions) {
        if (action.name === 'generate-qr-code' || action.name === 'get-qr-code') {
          qrCodeUrl = action.url;
          break;
        }
      }
    }
    
    // Fallback untuk direct fields
    if (!qrCodeUrl && midtransResponse.qr_string) {
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(midtransResponse.qr_string)}&size=300x300`;
    }
    
    console.log('QR Code URL:', qrCodeUrl);
    
    // Generate payment instructions
    const paymentInstructions = {
      payment_type: 'qris',
      qr_code_url: qrCodeUrl,
      qr_string: midtransResponse.qr_string || '',
      instructions: generateQRISInstructions(),
      expiry_time: midtransResponse.expiry_time || null
    };
    
    return NextResponse.json({
      success: true,
      order_id: orderId,
      payment_instructions: paymentInstructions,
      transaction_id: midtransResponse.transaction_id || '',
      status_code: midtransResponse.status_code || '',
      transaction_status: midtransResponse.transaction_status || 'pending'
    });
    
  } catch (error) {
    console.error('Error processing QRIS payment:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Gagal memproses pembayaran QRIS' 
    }, { status: 500 });
  }
} 