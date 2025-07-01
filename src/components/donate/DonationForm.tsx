'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Landmark, Wallet, Heart, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
import { useLoading } from '../providers/LoadingProvider';

// Mendefinisikan tipe data untuk metode pembayaran
type UIPaymentMethod = 'bank-transfer' | 'e-wallet';

export const DonationForm = () => {
  const router = useRouter();
  const [amount, setAmount] = useState(100000);
  const [selectedPayment, setSelectedPayment] = useState<UIPaymentMethod>('bank-transfer');
  const { setIsLoading } = useLoading();
  const [showThankYou, setShowThankYou] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [selectedBank, setSelectedBank] = useState('bca');
  const [selectedEwallet, setSelectedEwallet] = useState('gopay');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    orderId: string;
    amount: number;
    instructions?: string[];
    paymentCode?: string;
    expiryTime?: string;
    vaNumber?: string;
    bankName?: string;
    qrCodeUrl?: string;
    deeplinkUrl?: string;
  } | null>(null);
  
  // Ref untuk interval pengecekan status pembayaran
  const paymentCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Matikan loading state setelah halaman dimuat
    setIsLoading(false);
    
    // Check for amount in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const amountParam = urlParams.get('amount');
    if (amountParam) {
      setAmount(parseInt(amountParam, 10));
    }

    // Cleanup interval jika ada
    return () => {
      if (paymentCheckIntervalRef.current) {
        clearInterval(paymentCheckIntervalRef.current);
      }
    };
  }, [setIsLoading]);

  // Fungsi untuk memeriksa status pembayaran
  const checkPaymentStatus = async (orderId: string) => {
    try {
      console.log(`Checking payment status for order ${orderId}`);
      
      // Tampilkan loading state jika sedang memeriksa status
      if (!paymentCheckIntervalRef.current) {
        setError("Memeriksa status pembayaran...");
      }

      // Gunakan endpoint API untuk mengecek status
      const response = await fetch(`/api/donation?order_id=${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to check payment status: ${response.status} ${response.statusText}`, errorData);
        if (!paymentCheckIntervalRef.current) {
          setError(`Gagal memeriksa status: ${errorData.error || response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      console.log(`Payment status check result:`, data);
      
      // Clear error message if we're doing a manual check
      if (!paymentCheckIntervalRef.current) {
        setError(null);
      }
      
      // Cek apakah pembayaran berhasil berdasarkan status transaksi
      if (data.status === 'success' || 
          data.transaction_status === 'settlement' || 
          data.transaction_status === 'capture') {
        
        console.log(`Payment successful for order ${orderId}`);
        
        // Hentikan interval pengecekan
        if (paymentCheckIntervalRef.current) {
          clearInterval(paymentCheckIntervalRef.current);
          paymentCheckIntervalRef.current = null;
        }
        
        // Hilangkan pesan error dan reset form saat pembayaran sukses
        setError(null);
        resetForm();
        
        // Tampilkan notifikasi terima kasih
        setShowPaymentInstructions(false);
        setShowThankYou(true);
        return true;
      } else if (data.status === 'expired' || 
                data.status === 'cancel' || 
                data.status === 'deny' || 
                data.transaction_status === 'expire' || 
                data.transaction_status === 'cancel' || 
                data.transaction_status === 'deny') {
        
        console.log(`Payment failed or expired for order ${orderId}`);
        
        // Hentikan interval pengecekan
        if (paymentCheckIntervalRef.current) {
          clearInterval(paymentCheckIntervalRef.current);
          paymentCheckIntervalRef.current = null;
        }
        
        // Tampilkan pesan bahwa pembayaran gagal atau kedaluwarsa
        setError(`Pembayaran gagal atau kedaluwarsa. Status: ${data.status || data.transaction_status}`);
        
        // Untuk pengujian manual, kita perlu memberitahu pengguna status pembayaran
        if (!paymentCheckIntervalRef.current) {
          setError(`Status pembayaran: ${data.status || data.transaction_status} (${data.status === 'pending' ? 'Menunggu Pembayaran' : 'Gagal'})`);
        } else {
          setShowPaymentInstructions(false);
        }
        
        return false;
      } else if (data.status === 'pending' && !paymentCheckIntervalRef.current) {
        // Ini adalah pengecekan manual dan pembayaran masih pending
        setError(`Status pembayaran: Menunggu pembayaran (${data.status})`);
        return false;
      }
      
      // Jika status tidak dikenali, default return false
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (!paymentCheckIntervalRef.current) {
        setError(`Gagal memeriksa status: ${error instanceof Error ? error.message : String(error)}`);
      }
      return false;
    }
  };

  // Fungsi untuk memulai pengecekan status pembayaran secara berkala
  const startPaymentStatusCheck = (orderId: string) => {
    // Hapus interval sebelumnya jika ada
    if (paymentCheckIntervalRef.current) {
      clearInterval(paymentCheckIntervalRef.current);
    }
    
    // Periksa status pembayaran segera
    checkPaymentStatus(orderId);
    
    // Setel interval untuk memeriksa status setiap 3 detik
    paymentCheckIntervalRef.current = setInterval(() => {
      checkPaymentStatus(orderId);
    }, 3000); // 3000 ms = 3 detik
    
    // Hentikan pengecekan setelah 30 menit untuk mencegah memory leak
    setTimeout(() => {
      if (paymentCheckIntervalRef.current) {
        console.log(`Stopping payment status check for order ${orderId} after timeout`);
        clearInterval(paymentCheckIntervalRef.current);
        paymentCheckIntervalRef.current = null;
      }
    }, 30 * 60 * 1000); // 30 menit
  };
  
  // Fungsi untuk kembali ke halaman utama dengan animasi loading
  const handleBackToHome = () => {
    setIsLoading(true);
    // Timeout memberikan waktu untuk animasi loading muncul
    setTimeout(() => {
      router.push('/', { scroll: false });
    }, 500);
  };
  
  // Fungsi untuk reset form kembali ke nilai default
  const resetForm = () => {
    setAmount(100000);
    setSelectedPayment('bank-transfer');
    setFormData({
      name: '',
      email: ''
    });
    setSelectedBank('bca');
    setSelectedEwallet('gopay');
    setError(null);
    setProcessingPayment(false);
  };

  const presetAmounts = [50000, 100000, 250000, 500000];
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Mengizinkan field kosong untuk pengalaman pengguna yang lebih baik sebelum validasi
    setAmount(value === '' ? 0 : parseInt(value, 10));
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'bankName') {
      setSelectedBank(value);
    } else if (name === 'ewalletType') {
      setSelectedEwallet(value);
    }
  };
  
  const handlePaymentMethodChange = (method: UIPaymentMethod) => {
    setSelectedPayment(method);
    
    // Reset bank/ewallet selection jika metode berubah
    if (method === 'bank-transfer') {
      setSelectedBank('bca');
    } else if (method === 'e-wallet') {
      setSelectedEwallet('gopay');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !amount) {
      setError('Semua field wajib diisi');
      return;
    }
    
    try {
      setProcessingPayment(true);
      setError(null);
      
      // Tentukan endpoint API berdasarkan metode pembayaran yang dipilih
      let apiEndpoint = '';
      
      if (selectedPayment === 'bank-transfer') {
        apiEndpoint = '/api/paywithbanktf'; // Endpoint khusus bank transfer
      } else if (selectedPayment === 'e-wallet') {
        if (selectedEwallet === 'qris') {
          apiEndpoint = '/api/paywithqris'; // Endpoint khusus QRIS
        } else {
          apiEndpoint = '/api/paywithewallet'; // Endpoint khusus e-wallet
        }
      } else {
        // Fallback ke endpoint umum jika tidak ada yang cocok
        apiEndpoint = '/api/payment';
      }
      
      console.log(`Using API endpoint: ${apiEndpoint} for ${selectedPayment}`);
      
      // Send donation data to server to create Midtrans transaction
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          amount,
          // Sertakan data spesifik berdasarkan metode pembayaran
          ...(selectedPayment === 'bank-transfer' && { bankName: selectedBank }),
          ...(selectedPayment === 'e-wallet' && { ewalletType: selectedEwallet }),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Terjadi kesalahan saat memproses donasi');
      }
      
      const responseData = await response.json();
      console.log('Payment response:', responseData);
      
      // Set payment details based on response
      const orderId = responseData.order_id || 'DONATION-' + new Date().getTime();
      
      setPaymentDetails({
        orderId: orderId,
        amount: amount,
        // Use payment instructions from the API
        instructions: responseData.payment_instructions?.instructions || [],
        // Use payment details from the API
        vaNumber: responseData.payment_instructions?.va_number || '',
        bankName: responseData.payment_instructions?.bank_name || '',
        paymentCode: responseData.payment_instructions?.payment_code || '',
        expiryTime: responseData.payment_instructions?.expiry_time || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Default 60 minutes
        qrCodeUrl: responseData.payment_instructions?.qr_code_url || '',
        deeplinkUrl: responseData.payment_instructions?.deeplink_url || '',
      });
      
      // Show payment instructions
      setShowPaymentInstructions(true);
      
      // Reset form
      resetForm();
      
      // Mulai memeriksa status pembayaran secara otomatis
      startPaymentStatusCheck(orderId);
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Enhanced Thank You Notification */}
      <AnimatePresence>
        {showThankYou && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, type: "spring", damping: 25 }}
              className="bg-white max-w-sm w-11/12 pointer-events-auto"
              style={{
                borderRadius: '1.5rem',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                borderTop: '6px solid #F97316',
              }}
            >
              {/* Top Pattern */}
              <div 
                className="h-16 w-full relative overflow-hidden"
                style={{
                  background: 'linear-gradient(120deg, #ffecd2 0%, #fcb69f 100%)',
                }}
              >
                <svg 
                  className="absolute top-0 left-0 w-full h-full opacity-20" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M0,100 C30,50 70,50 100,100 V100 H0 V100 Z"
                    fill="#fff"
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white rounded-full p-2 shadow-md"
                  >
                    <div className="bg-orange-500 text-white p-2 rounded-full">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="px-8 py-8 text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-800 mb-3"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  Terima Kasih!
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 mb-4 leading-relaxed"
                >
                  Donasi Anda akan membantu mereka yang membutuhkan. Kami sangat menghargai kepedulian dan kemurahan hati Anda.
                </motion.p>
                
                <div className="w-16 h-0.5 bg-gray-200 mx-auto my-5"></div>
                
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowThankYou(false)}
                  className="px-8 py-3 font-medium rounded-xl text-orange-500 border border-orange-500 hover:bg-orange-50 transition-all"
                >
                  Tutup
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200 relative"
      >
        {/* Tombol kembali yang lebih simpel */}
        <button
          onClick={handleBackToHome}
          className="absolute top-6 left-6 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="text-center mb-10">
          {/* Ikon hati yang lebih terintegrasi */}
          <div className="inline-block bg-orange-100 text-orange-500 p-3 rounded-full mb-4">
            <Heart className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">
            Ulurkan Tangan Anda
          </h1>
          <p className="mt-2 text-md text-slate-500">
            Setiap donasi sangat berarti untuk melanjutkan misi kami.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-8">
          {/* STEP 1: Jumlah Donasi */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">
              1. Tentukan Jumlah Donasi (Rp)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`py-3 px-2 rounded-lg text-center font-medium transition-all duration-200 border ${
                    amount === preset
                      ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-orange-50 hover:border-orange-300'
                  }`}
                >
                  {preset.toLocaleString('id-ID')}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">Rp</span>
              <input
                type="number"
                name="amount"
                value={amount}
                onChange={handleAmountChange}
                className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                placeholder="Jumlah Lainnya"
                required
              />
            </div>
          </div>

          {/* STEP 2: Informasi Donatur */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">
              2. Informasi Donatur
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1" htmlFor="name">Nama Lengkap</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-600 mb-1" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Metode Pembayaran */}
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">
              3. Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('bank-transfer')}
                className={`flex items-center p-3 rounded-lg border transition-all ${
                  selectedPayment === 'bank-transfer'
                    ? 'bg-orange-50 border-orange-500 text-orange-600 ring-2 ring-orange-200'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Landmark className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Transfer Bank</span>
              </button>
              
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('e-wallet')}
                className={`flex items-center p-3 rounded-lg border transition-all ${
                  selectedPayment === 'e-wallet'
                    ? 'bg-orange-50 border-orange-500 text-orange-600 ring-2 ring-orange-200'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Wallet className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">E-Wallet</span>
              </button>
            </div>
            
            {/* Bank Selection Dropdown when Bank Transfer is selected */}
            {selectedPayment === 'bank-transfer' && (
              <div className="mt-4">
                <label className="block text-sm text-slate-600 mb-1" htmlFor="bankName">
                  Pilih Bank
                </label>
                <select
                  id="bankName"
                  name="bankName"
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                  defaultValue="bca"
                  onChange={handleSelectChange}
                >
                  <option value="bca">BCA Virtual Account</option>
                  <option value="bni">BNI Virtual Account</option>
                  <option value="bri">BRI Virtual Account</option>
                  <option value="mandiri">Mandiri Bill Payment</option>
                  <option value="permata">Permata Virtual Account</option>
                </select>
              </div>
            )}
            
            {/* E-Wallet Selection when E-Wallet is selected */}
            {selectedPayment === 'e-wallet' && (
              <div className="mt-4">
                <label className="block text-sm text-slate-600 mb-1" htmlFor="ewalletType">
                  Pilih E-Wallet
                </label>
                <select
                  id="ewalletType"
                  name="ewalletType"
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
                  defaultValue="gopay"
                  onChange={handleSelectChange}
                >
                  <option value="gopay">GoPay</option>
                  <option value="shopeepay">ShopeePay</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={processingPayment}
            className={`w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all transform hover:-translate-y-1 ${
              processingPayment ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {processingPayment ? 'Memproses...' : 'Lanjutkan Donasi'}
          </button>
        </form>
      </motion.div>
      
      {/* Payment Instructions Modal - Updated UI */}
      <AnimatePresence>
        {showPaymentInstructions && paymentDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-transparent"
          >
            <div className="absolute inset-0 pointer-events-none"></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 24 }}
              className="bg-white/95 max-w-md w-11/12 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 backdrop-blur-sm relative z-10"
            >
              {/* Header Bar with gradient */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 40C0 17.9086 17.9086 0 40 0H560C582.091 0 600 17.9086 600 40V560C600 582.091 582.091 600 560 600H40C17.9086 600 0 582.091 0 560V40Z" fill="white"/>
                    <path d="M140 170C140 151.775 154.775 137 173 137H227C245.225 137 260 151.775 260 170V224C260 242.225 245.225 257 227 257H173C154.775 257 140 242.225 140 224V170Z" fill="white"/>
                    <path d="M340 170C340 151.775 354.775 137 373 137H427C445.225 137 460 151.775 460 170V224C460 242.225 445.225 257 427 257H373C354.775 257 340 242.225 340 224V170Z" fill="white"/>
                    <path d="M140 370C140 351.775 154.775 337 173 337H227C245.225 337 260 351.775 260 370V424C260 442.225 245.225 457 227 457H173C154.775 457 140 442.225 140 424V370Z" fill="white"/>
                    <path d="M340 370C340 351.775 354.775 337 373 337H427C445.225 337 460 351.775 460 370V424C460 442.225 445.225 457 427 457H373C354.775 457 340 442.225 340 424V370Z" fill="white"/>
                  </svg>
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-xl font-bold text-white">Instruksi Pembayaran</h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowPaymentInstructions(false)}
                    className="text-white/80 hover:text-white rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
                <div className="mt-2 flex flex-col space-y-1 text-white/90 text-sm">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-medium">{paymentDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-bold">Rp {paymentDetails.amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 max-h-[70vh] overflow-y-auto">
                {/* Error display if any */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600"
                  >
                    {error}
                  </motion.div>
                )}
                
                {/* Status Bar - Shows payment expiration */}
                {paymentDetails.expiryTime && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 rounded-full p-2 text-orange-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600 block">Bayar sebelum</span>
                        <span className="font-medium text-orange-700">{new Date(String(paymentDetails.expiryTime)).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Manual Check Status Button */}
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paymentDetails && checkPaymentStatus(paymentDetails.orderId)}
                  className="w-full mb-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center transition-colors shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Periksa Status Pembayaran
                </motion.button>
                
                {/* Payment Information Section */}
                <div className="space-y-5">
                  {/* Bank Section */}
                  {paymentDetails.bankName && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Landmark className="h-4 w-4 text-gray-500" />
                          <h4 className="font-medium text-gray-700">Bank {paymentDetails.bankName.toUpperCase()}</h4>
                        </div>
                      </div>
              {paymentDetails.vaNumber && (
                        <div className="p-4">
                          <span className="text-sm text-gray-500 block mb-1">Nomor Virtual Account</span>
                  <div className="flex items-center">
                            <code className="bg-gray-50 p-3 rounded-l-lg border border-gray-200 flex-1 text-lg font-mono tracking-wider text-gray-800">{paymentDetails.vaNumber}</code>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        navigator.clipboard.writeText(paymentDetails.vaNumber || '');
                                // Show toast or feedback
                        alert('Nomor VA disalin!');
                      }}
                              className="ml-0 h-full py-3 px-4 bg-orange-500 text-white rounded-r-lg hover:bg-orange-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                            </motion.button>
                  </div>
                </div>
                      )}
                    </motion.div>
              )}
              
                  {/* Payment Code Section */}
              {paymentDetails.paymentCode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-700">Kode Pembayaran</h4>
                      </div>
                      <div className="p-4">
                  <div className="flex items-center">
                          <code className="bg-gray-50 p-3 rounded-l-lg border border-gray-200 flex-1 text-lg font-mono tracking-wider text-gray-800">{paymentDetails.paymentCode}</code>
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        navigator.clipboard.writeText(paymentDetails.paymentCode || '');
                              // Show toast or feedback
                        alert('Kode pembayaran disalin!');
                      }}
                            className="ml-0 h-full py-3 px-4 bg-orange-500 text-white rounded-r-lg hover:bg-orange-600 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                          </motion.button>
                  </div>
                </div>
                    </motion.div>
              )}
              
                  {/* QR Code Section */}
              {paymentDetails.qrCodeUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-700">Scan untuk Pembayaran</h4>
                      </div>
                      <div className="p-4 flex justify-center">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                        >
                      <img 
                        src={paymentDetails.qrCodeUrl} 
                        alt="QR Code Pembayaran" 
                        className="w-48 h-48 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%236b7280'%3EQR Code%3C/text%3E%3C/svg%3E";
                        }}
                      />
                        </motion.div>
                    </div>
                    </motion.div>
              )}
              
                  {/* E-Wallet Deeplink Button */}
              {paymentDetails.deeplinkUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-4"
                    >
                      <motion.a 
                    href={paymentDetails.deeplinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl flex items-center justify-center hover:from-green-600 hover:to-emerald-700 transition-colors shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                    </svg>
                    Buka Aplikasi E-Wallet
                      </motion.a>
                    </motion.div>
              )}
              
                  {/* Payment Instructions Accordion */}
                  {paymentDetails.instructions && paymentDetails.instructions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="mt-5 rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gray-50 p-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-700">Cara Pembayaran</h4>
                </div>
                      <div className="divide-y divide-gray-100">
                    {paymentDetails.instructions.map((instruction, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            className="p-4 hover:bg-gray-50"
                          >
                            <div className="flex">
                              <div className="flex-shrink-0 mr-3">
                                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-orange-100 text-orange-500 font-semibold text-sm">
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="text-gray-700">{instruction}</div>
                            </div>
                          </motion.div>
                    ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-7"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPaymentInstructions(false)}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Saya Mengerti
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 