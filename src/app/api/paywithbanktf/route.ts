import { NextRequest, NextResponse } from 'next/server';
import db from '@/db/db';
import { donations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Fungsi untuk generate order ID
function generateOrderId(): string {
  const timestamp = new Date().getTime();
  const randomNum = Math.floor(Math.random() * 1000);
  return `BANKTF-${timestamp}-${randomNum}`;
}

// Fungsi untuk mendapatkan nama bank dari kode
function getBankName(bankCode: string): string {
  const bankNames: Record<string, string> = {
    'bca': 'Bank Central Asia (BCA)',
    'bni': 'Bank Negara Indonesia (BNI)',
    'bri': 'Bank Rakyat Indonesia (BRI)',
    'mandiri': 'Bank Mandiri',
    'permata': 'Bank Permata'
  };
  
  return bankNames[bankCode] || bankCode.toUpperCase();
}

// Fungsi untuk generate instruksi pembayaran bank transfer
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
    
    const { name, email, amount, bankName } = data;
    
    if (!name || !email || !amount || !bankName) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    // Generate order ID unik
    const orderId = generateOrderId();
    console.log('Generated Bank Transfer Order ID:', orderId);
    
    try {
      // Create donation record in database
      await db.insert(donations).values({
        name,
        email,
        amount,
        orderId,
        paymentMethod: 'bank-transfer',
        paymentType: bankName,
        paymentStatus: 'pending',
      });
      
      console.log('Bank Transfer donation record created successfully');
    } catch (error) {
      console.error('Error creating donation record:', error);
      return NextResponse.json({ error: 'Gagal menyimpan data donasi' }, { status: 500 });
    }
    
    // Buat authorization header
    const auth = `Basic ${Buffer.from(process.env.MIDTRANS_SERVER_KEY + ':').toString('base64')}`;
    let response;
    
    // Siapkan payload sesuai dengan format Midtrans Charge API untuk bank transfer
    const payload = {
      payment_type: "bank_transfer",
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      bank_transfer: {
        bank: bankName
      },
      customer_details: {
        first_name: name,
        email: email
      }
    };
    
    console.log('Bank Transfer API payload:', JSON.stringify(payload));
    
    
    try {
      // Panggil API Midtrans Charge untuk bank transfer
      response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': auth
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Bank Transfer API response status:', response.status);
    } catch (error) {
      console.error('Error calling Bank Transfer API:', error);
      return NextResponse.json({ 
        error: 'Gagal terhubung ke payment gateway' 
      }, { status: 500 });
    }
    
    // Check if response is ok
    if (!response || !response.ok) {
      let errorMessage = 'Gagal membuat transaksi bank transfer';
      
      if (response) {
        try {
          const errorData = await response.json();
          console.error('Payment gateway error:', errorData);
          errorMessage = errorData.message || errorData.error_messages?.[0] || 'Gagal membuat transaksi bank transfer';
        } catch (e) {
          try {
            const text = await response.text();
            console.error('Payment gateway response (not JSON):', text);
            errorMessage = text || 'Gagal membuat transaksi bank transfer';
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
      console.log('Successful bank transfer response:', JSON.stringify(midtransResponse));
    } catch (error) {
      console.error('Error parsing response:', error);
      return NextResponse.json({ 
        error: 'Tidak dapat memproses respons dari payment gateway' 
      }, { status: 500 });
    }
    
    // Extract VA number correctly based on response structure
    let vaNumber = '';
    
    if (bankName === 'permata') {
      vaNumber = midtransResponse.permata_va_number || '';
    } else if (bankName === 'mandiri') {
      vaNumber = midtransResponse.bill_key || '';
    } else {
      // For BCA, BNI, BRI
      if (midtransResponse.va_numbers && midtransResponse.va_numbers.length > 0) {
        for (const va of midtransResponse.va_numbers) {
          if (va.bank === bankName) {
            vaNumber = va.va_number;
            break;
          }
        }
        
        if (!vaNumber && midtransResponse.va_numbers.length > 0) {
          vaNumber = midtransResponse.va_numbers[0].va_number;
        }
      }
    }
    
    console.log('Using VA number:', vaNumber);
    
    // Generate payment instructions
    const paymentInstructions = {
      bank_name: getBankName(bankName),
      va_number: vaNumber,
      instructions: generateBankTransferInstructions(bankName),
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
    console.error('Error processing bank transfer payment:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Gagal memproses pembayaran bank transfer' 
    }, { status: 500 });
  }
} 