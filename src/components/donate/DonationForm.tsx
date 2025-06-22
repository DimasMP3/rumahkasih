'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Landmark, Wallet, Heart, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from 'next/navigation';
import { useLoading } from '../providers/LoadingProvider';

export const DonationForm = () => {
  const router = useRouter();
  const [amount, setAmount] = useState(100000);
  const [selectedPayment, setSelectedPayment] = useState('credit-card');
  const { setIsLoading } = useLoading();
  const [showThankYou, setShowThankYou] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  
  useEffect(() => {
    // Matikan loading state setelah halaman dimuat
    setIsLoading(false);
    
    // Check for amount in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const amountParam = urlParams.get('amount');
    if (amountParam) {
      setAmount(parseInt(amountParam, 10));
    }
  }, [setIsLoading]);

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
    setSelectedPayment('credit-card');
    setFormData({
      name: '',
      email: ''
    });
  };

  const presetAmounts = [50000, 100000, 250000, 500000];
  
  // Data metode pembayaran dengan ikon
  const paymentMethods = [
    { id: 'credit-card', label: 'Kartu Kredit/Debit', icon: <CreditCard className="h-5 w-5 mr-3 text-slate-500" /> },
    { id: 'bank-transfer', label: 'Transfer Bank', icon: <Landmark className="h-5 w-5 mr-3 text-slate-500" /> },
    { id: 'ewallet', label: 'E-Wallet', icon: <Wallet className="h-5 w-5 mr-3 text-slate-500" /> },
  ];

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

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const donorData = {
      amount,
      name: formData.name,
      email: formData.email,
      paymentMethod: selectedPayment,
    };
    console.log(donorData);
    
    // Show thank you notification and reset form
    setShowThankYou(true);
    resetForm();
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowThankYou(false);
    }, 3000);
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
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label 
                  key={method.id}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPayment === method.id 
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={selectedPayment === method.id}
                    onChange={() => setSelectedPayment(method.id)}
                    className="sr-only"
                  />
                  <div className="flex items-center flex-grow">
                    {method.icon}
                    <span className="font-medium text-slate-800">{method.label}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPayment === method.id 
                      ? 'border-orange-500' 
                      : 'border-slate-300'
                  }`}>
                    {selectedPayment === method.id && (
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all transform hover:-translate-y-1"
          >
            Lanjutkan Donasi
          </button>
        </form>
      </motion.div>
    </div>
  );
}; 