import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Fungsi untuk generate order ID
function generateOrderId(): string {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000);
  return `EWALLET-${timestamp}-${randomNum}`;
}

// Fungsi untuk generate instruksi pembayaran e-wallet
function generateEWalletInstructions(walletType: string): string[] {
  switch (walletType) {
    case 'gopay':
      return [
        'Buka aplikasi Gojek di smartphone Anda',
        'Pastikan saldo GoPay Anda mencukupi',
        'Scan QR Code yang ditampilkan',
        'Atau klik tombol "Bayar dengan GoPay" untuk membuka aplikasi',
        'Konfirmasi pembayaran di aplikasi Gojek'
      ];
    case 'shopeepay':
      return [
        'Buka aplikasi Shopee di smartphone Anda',
        'Pastikan saldo ShopeePay Anda mencukupi',
        'Scan QR Code yang ditampilkan',
        'Atau klik tombol "Bayar dengan ShopeePay" untuk membuka aplikasi',
        'Konfirmasi pembayaran di aplikasi Shopee'
      ];
    case 'qris':
      return [
        'Buka aplikasi mobile banking atau e-wallet yang mendukung QRIS',
        'Pilih menu Scan QR atau QRIS',
        'Scan QR Code yang ditampilkan',
        'Periksa informasi merchant dan jumlah pembayaran',
        'Konfirmasi dan selesaikan pembayaran'
      ];
    default:
      return [
        'Buka aplikasi e-wallet Anda',
        'Pilih menu Scan QR',
        'Scan QR Code yang ditampilkan',
        'Konfirmasi pembayaran di aplikasi'
      ];
  }
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
    
    const { name, email, amount, ewalletType } = data;
    
    if (!name || !email || !amount || !ewalletType) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    // Generate order ID unik
    const orderId = generateOrderId();
    console.log('Generated E-Wallet Order ID:', orderId);
    
    try {
      // Create donation record in database
      await db.insert(donations).values({
        name,
        email,
        amount,
        orderId,
        paymentMethod: 'ewallet', // Sesuaikan dengan format DB
        paymentType: ewalletType,
        paymentStatus: 'pending',
      });
      
      console.log('E-wallet donation record created successfully');
    } catch (error) {
      console.error('Error creating donation record:', error);
      return NextResponse.json({ error: 'Gagal menyimpan data donasi' }, { status: 500 });
    }
    
    // Buat authorization header
    const auth = `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`;
    let response;
    
    // Siapkan payload sesuai dengan format Midtrans Charge API untuk e-wallet
    const payload = {
      payment_type: ewalletType,
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: name,
        email: email,
        phone: ''  // Bisa ditambahkan jika tersedia
      },
      custom_expiry: {
        expiry_duration: 60,
        unit: "minute"
      }
    };
    
    // Tambahkan konfigurasi khusus berdasarkan jenis e-wallet
    if (ewalletType === 'gopay') {
      Object.assign(payload, {
        gopay: {
          enable_callback: true,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate/success`
        }
      });
    } else if (ewalletType === 'shopeepay') {
      Object.assign(payload, {
        shopeepay: {
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/donate/success`
        }
      });
    }
    
    console.log('E-wallet API payload:', JSON.stringify(payload));
    
    try {
      // Panggil API Midtrans Charge untuk e-wallet
      response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify(payload)
      });
      
      console.log('E-wallet API response status:', response.status);
    } catch (error) {
      console.error('Error calling E-wallet API:', error);
      return NextResponse.json({ 
        error: 'Gagal terhubung ke payment gateway' 
      }, { status: 500 });
    }
    
    // Check if response is ok
    if (!response || !response.ok) {
      let errorMessage = 'Gagal membuat transaksi e-wallet';
      
      if (response) {
        try {
          const errorData = await response.json();
          console.error('Payment gateway error:', errorData);
          errorMessage = errorData.message || errorData.error_messages?.[0] || 'Gagal membuat transaksi e-wallet';
        } catch (e) {
          try {
            const text = await response.text();
            console.error('Payment gateway response (not JSON):', text);
            errorMessage = text || 'Gagal membuat transaksi e-wallet';
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
      console.log('Successful e-wallet response:', JSON.stringify(midtransResponse));
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json({ 
        error: 'Tidak dapat memproses respons dari payment gateway' 
      }, { status: 500 });
    }
    
    // Extract QR code URL dan deeplink URL dari response
    let qrCodeUrl = '', deeplinkUrl = '';
    
    if (midtransResponse.actions && Array.isArray(midtransResponse.actions)) {
      console.log('Found actions array in response');
      for (const action of midtransResponse.actions) {
        if (action.name === 'generate-qr-code') {
          qrCodeUrl = action.url;
        } else if (action.name === 'deeplink-redirect') {
          deeplinkUrl = action.url;
        } else if (action.name === 'get-qr-code') {
          qrCodeUrl = action.url;
        } else if (action.name === 'callback') {
          // Handle callback URL if needed
        }
      }
    }
    
    // Fallback untuk direct fields
    if (!qrCodeUrl) qrCodeUrl = midtransResponse.qr_code_url || '';
    if (!deeplinkUrl) deeplinkUrl = midtransResponse.deeplink_url || '';
    
    console.log('QR Code URL:', qrCodeUrl);
    console.log('Deeplink URL:', deeplinkUrl);
    
    // Generate payment instructions
    const paymentInstructions = {
      payment_type: ewalletType,
      qr_code_url: qrCodeUrl,
      deeplink_url: deeplinkUrl,
      payment_code: midtransResponse.payment_code || '',
      instructions: generateEWalletInstructions(ewalletType),
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
    console.error('Error processing e-wallet payment:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Gagal memproses pembayaran e-wallet' 
    }, { status: 500 });
  }
} 