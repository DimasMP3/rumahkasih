'use client';

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { Heart } from 'lucide-react';

// Animation variant
const cardVariants: Variants = {
  offscreen: {
    y: 50,
    opacity: 0
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      bounce: 0.4,
      duration: 0.8
    }
  }
};

interface DonationSectionProps {
  handleNavigate: (path: string) => void;
}

export const DonationSection = ({ handleNavigate }: DonationSectionProps) => {
  const donationOptions = [
    { amount: 100000, label: "Rp 100.000", description: "Bantuan nutrisi untuk 5 anak selama sehari" },
    { amount: 250000, label: "Rp 250.000", description: "Buku pendidikan dan alat belajar untuk 10 anak" },
    { amount: 500000, label: "Rp 500.000", description: "Biaya pendidikan untuk 1 anak selama 1 bulan" },
    { amount: 1000000, label: "Rp 1.000.000", description: "Biaya perlengkapan dan aktivitas untuk 20 anak" },
  ];

  return (
    <motion.section 
      id="donasi" 
      className="py-24 bg-slate-100 relative overflow-hidden"
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Decorative elements */}
      <div className="absolute -top-48 -right-48 w-96 h-96 bg-orange-100 rounded-full opacity-60 blur-3xl"></div>
      <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-amber-100 rounded-full opacity-60 blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div className="text-center mb-16" variants={cardVariants}>
          <div className="inline-block p-3 bg-orange-100 rounded-full mb-4">
            <Heart className="h-7 w-7 text-orange-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Berikan Bantuan</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Setiap donasi akan membantu kami memberikan kehidupan yang lebih baik untuk anak-anak di Rumah Kasih.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid lg:grid-cols-3 gap-12 items-center"
          variants={cardVariants}
        >
          <div className="lg:col-span-1">
            <Image
              src="/image/Gemini_Generated_Image_rlwzorrlwzorrlwz.png"
              alt="Anak-anak berterima kasih"
              width={500}
              height={600}
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <motion.p 
              className="text-lg text-slate-600 leading-relaxed"
              variants={cardVariants}
            >
              Donasi Anda akan membantu kami menyediakan makanan bergizi, pendidikan berkualitas, dan lingkungan yang aman dan nyaman bagi anak-anak. Dengan bantuan Anda, kami bisa memberikan masa depan yang lebih cerah untuk mereka.
            </motion.p>
            
            <motion.div 
              className="grid md:grid-cols-2 gap-5"
              variants={cardVariants}
            >
              {donationOptions.map((option, index) => (
                <div 
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-bold text-xl text-slate-800 mb-2">{option.label}</h3>
                  <p className="text-slate-600 mb-4">{option.description}</p>
                  <button 
                    onClick={() => handleNavigate(`/donate?amount=${option.amount}`)}
                    className="bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors w-full"
                  >
                    Donasi Sekarang
                  </button>
                </div>
              ))}
            </motion.div>
            
            {/* Removed "Donasi Jumlah Lainnya" button as requested */}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}; 