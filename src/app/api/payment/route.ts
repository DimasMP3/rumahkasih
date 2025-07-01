import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Definisikan langsung generateOrderId di file ini untuk menghindari issue import
function generateOrderId(): string {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000);
  return `DONATION-${timestamp}-${randomNum}`;
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
    
    const { name, email, amount, paymentMethod, bankName, ewalletType } = data;
    
    if (!name || !email || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    // Generate order ID unik
    const orderId = generateOrderId();
    console.log('Generated Order ID:', orderId);
    
    // Convert paymentMethod dari format UI ke format database
    // UI: 'bank-transfer', 'e-wallet'
    // DB: 'bank-transfer', 'ewallet', 'gopay', 'shopeepay'
    let dbPaymentMethod = paymentMethod;
    
    if (paymentMethod === 'e-wallet') {
      // Untuk e-wallet, gunakan ewallet sebagai payment method
      dbPaymentMethod = 'ewallet';
    }
    
    try {
      // Create donation record in database
      await db.insert(donations).values({
        name,
        email,
        amount,
        orderId,
        paymentMethod: dbPaymentMethod,
        paymentType: paymentMethod === 'e-wallet' ? ewalletType : undefined,
        paymentStatus: 'pending',
      });
      
      console.log('Donation record created successfully');
    } catch (error) {
      console.error('Error creating donation record:', error);
      return NextResponse.json({ error: 'Gagal menyimpan data donasi' }, { status: 500 });
    }
    
    // Get enabled payment methods based on selection
    let enabledPayments: string[] = [];
    if (paymentMethod === 'bank-transfer' && bankName) {
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
          enabledPayments = ['bca_va'];
      }
    } else if (paymentMethod === 'e-wallet' && ewalletType) {
      enabledPayments = [ewalletType];
    } else {
      enabledPayments = ['bca_va', 'bni_va', 'gopay']; // Default payment methods
    }
    
    let response;
    let midtransResponse;
    const auth = `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`;
    
    console.log('Processing payment for orderId:', orderId);
    console.log('Payment method:', paymentMethod);
    
    // Untuk e-wallet gunakan Charge API v2
    if (paymentMethod === 'e-wallet') {
      const payload = {
        payment_type: ewalletType || 'gopay',
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: name,
          email: email,
          phone: ''  // Tambahkan field phone jika tersedia
        },
        custom_expiry: {
          expiry_duration: 60,
          unit: "minute"
        },
        metadata: {
          payment_method: paymentMethod,
          ewallet_type: ewalletType
        }
      };
      
      console.log('E-wallet payload:', JSON.stringify(payload));
      
      try {
        // Panggil Midtrans Charge API untuk e-wallet payments
        response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': auth
          },
          body: JSON.stringify(payload)
        });
        
        console.log('E-wallet response status:', response.status);
      } catch (error) {
        console.error('Error calling e-wallet API:', error);
        return NextResponse.json({ 
          error: 'Gagal terhubung ke payment gateway' 
        }, { status: 500 });
      }
    } else {
      // Untuk bank transfer gunakan Snap API seperti sebelumnya
      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          first_name: name,
          email: email
        },
        enabled_payments: enabledPayments
      };
      
      console.log('Bank transfer payload:', JSON.stringify(payload));
      
      try {
        response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
          },
          body: JSON.stringify(payload)
        });
        
        console.log('Bank transfer response status:', response.status);
      } catch (error) {
        console.error('Error calling bank transfer API:', error);
        return NextResponse.json({ 
          error: 'Gagal terhubung ke payment gateway' 
        }, { status: 500 });
      }
    }
    
    // Check if response is ok
    if (!response || !response.ok) {
      let errorMessage = 'Gagal membuat transaksi';
      
      if (response) {
        try {
          const errorData = await response.json();
          console.error('Payment gateway error:', errorData);
          errorMessage = errorData.message || errorData.error_messages?.[0] || 'Gagal membuat transaksi';
        } catch (e) {
          try {
            const text = await response.text();
            console.error('Payment gateway response (not JSON):', text);
            errorMessage = text || 'Gagal membuat transaksi';
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
    try {
      midtransResponse = await response.json();
      console.log('Successful response:', midtransResponse);
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json({ 
        error: 'Tidak dapat memproses respons dari payment gateway' 
      }, { status: 500 });
    }
    
    // Generate instruksi pembayaran berdasarkan metode pembayaran
    let paymentInstructions = null;
    
    if (paymentMethod === 'bank-transfer') {
      const bankCode = bankName || 'bca';
      console.log('Processing bank transfer for:', bankCode);
      console.log('Bank transfer response:', JSON.stringify(midtransResponse));
      
      // Extract VA number correctly based on response structure
      let vaNumber = '';
      
      if (midtransResponse.va_numbers && midtransResponse.va_numbers.length > 0) {
        vaNumber = midtransResponse.va_numbers[0].va_number;
      } else if (midtransResponse.permata_va_number) {
        vaNumber = midtransResponse.permata_va_number;
      } else if (midtransResponse.bill_key) {
        // For Mandiri Bill
        vaNumber = midtransResponse.bill_key;
      } else {
        console.log('VA number not found in response, using default');
        vaNumber = orderId; // Fallback to order ID if VA number not found
      }
      
      console.log('Using VA number:', vaNumber);
      
      paymentInstructions = {
        bank_name: getBankName(bankCode),
        va_number: vaNumber,
        instructions: generateBankTransferInstructions(bankCode)
      };
    } else if (paymentMethod === 'e-wallet') {
      const walletType = ewalletType || 'gopay';
      console.log('Processing e-wallet payment for:', walletType);
      console.log('E-wallet response:', JSON.stringify(midtransResponse));
      
      // Parse response dari Charge API v2 yang berbeda formatnya dari Snap
      let qrCodeUrl = '', deeplinkUrl = '', paymentCode = '';
      
      if (midtransResponse.actions && Array.isArray(midtransResponse.actions)) {
        console.log('Found actions array in response');
        for (const action of midtransResponse.actions) {
          console.log('Processing action:', action.name);
          if (action.name === 'generate-qr-code') {
            qrCodeUrl = action.url;
          } else if (action.name === 'deeplink-redirect') {
            deeplinkUrl = action.url;
          }
        }
      } else {
        console.log('No actions array in response, trying direct fields');
      }
      
      // Fallback to direct fields if actions not found
      if (!qrCodeUrl) qrCodeUrl = midtransResponse.qr_code_url || '';
      if (!deeplinkUrl) deeplinkUrl = midtransResponse.deeplink_url || '';
      
      console.log('QR Code URL:', qrCodeUrl);
      console.log('Deeplink URL:', deeplinkUrl);
      
      paymentInstructions = {
        payment_code: midtransResponse.payment_code || paymentCode,
        qr_code_url: qrCodeUrl,
        deeplink_url: deeplinkUrl,
        instructions: generateEWalletInstructions(walletType)
      };
    }
    
    console.log('Final payment instructions:', JSON.stringify(paymentInstructions));
    
    return NextResponse.json({
      success: true,
      token: midtransResponse.token || '',
      redirect_url: midtransResponse.redirect_url || '',
      order_id: orderId,
      payment_instructions: paymentInstructions,
      transaction_id: midtransResponse.transaction_id || '',
      status_code: midtransResponse.status_code || ''
    });
    
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Gagal memproses pembayaran' 
    }, { status: 500 });
  }
}

// Helper functions
function getBankName(code: string): string {
  const bankNames = {
    bca: 'Bank Central Asia (BCA)',
    bni: 'Bank Negara Indonesia (BNI)',
    bri: 'Bank Rakyat Indonesia (BRI)', 
    mandiri: 'Bank Mandiri',
    permata: 'Bank Permata'
  };
  
  return bankNames[code as keyof typeof bankNames] || code;
}

function generateBankTransferInstructions(bankCode: string): string[] {
  const commonInstructions = [
    'Simpan Nomor Virtual Account Anda',
    'Lakukan pembayaran melalui ATM, Mobile Banking atau Internet Banking',
    'Masukkan Nomor Virtual Account sebagai nomor rekening tujuan',
    'Masukkan jumlah transfer sesuai dengan total pembayaran',
    'Konfirmasi informasi pembayaran dan selesaikan transaksi'
  ];
  
  switch (bankCode) {
    case 'bca':
      return [
        'Buka aplikasi BCA Mobile atau Internet Banking',
        'Pilih menu Transfer > Virtual Account',
        ...commonInstructions
      ];
    case 'bni':
      return [
        'Buka aplikasi BNI Mobile atau Internet Banking',
        'Pilih menu Transfer > Virtual Account BNI',
        ...commonInstructions
      ];
    case 'bri':
      return [
        'Buka aplikasi BRImo atau Internet Banking BRI',
        'Pilih menu Pembayaran > Virtual Account',
        ...commonInstructions
      ];
    case 'mandiri':
      return [
        'Buka aplikasi Livin by Mandiri atau Internet Banking',
        'Pilih menu Pembayaran > Multipayment',
        'Pilih penyedia jasa "Midtrans"',
        'Masukkan kode pembayaran',
        ...commonInstructions
      ];
    case 'permata':
      return [
        'Buka aplikasi PermataMobile atau Internet Banking',
        'Pilih menu Pembayaran > Virtual Account',
        ...commonInstructions
      ];
    default:
      return commonInstructions;
  }
}

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

// Handle webhook notifikasi dari Midtrans
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Ambil data dari notifikasi
    const { 
      order_id, 
      transaction_id, 
      transaction_status, 
      payment_type, 
      fraud_status 
    } = data;
    
    // Map Midtrans status ke status sistem
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
    
    // Update status donasi di database
    await db.update(donations)
      .set({ 
        paymentStatus, 
        transactionId: transaction_id,
        paymentType: payment_type,
        updatedAt: new Date()
      })
      .where(eq(donations.orderId, order_id));
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error menangani webhook:', error);
    return NextResponse.json({ error: 'Gagal memproses webhook' }, { status: 500 });
  }
} 