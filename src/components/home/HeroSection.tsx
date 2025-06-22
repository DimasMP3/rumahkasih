'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';

// Animation variants
const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" as const 
    } 
  }
};

const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

// Function to handle smooth scrolling
const smoothScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
  e.preventDefault();
  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    window.scrollTo({
      top: targetElement.offsetTop,
      behavior: 'smooth'
    });
  }
};

export const HeroSection = () => (
  <motion.section 
    id="home" 
    className="relative container mx-auto px-6 pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden"
    initial="initial"
    animate="animate"
    variants={staggerContainer}
  >
    <div className="absolute -top-20 -left-20 w-72 h-72 bg-orange-200/50 rounded-full filter blur-3xl opacity-50"></div>
    <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-amber-200/50 rounded-full filter blur-3xl opacity-50"></div>
    
    <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
      <motion.div className="space-y-8" variants={staggerContainer}>
        <motion.h1 
          className="text-5xl lg:text-7xl font-extrabold text-slate-800 leading-tight tracking-tighter"
          variants={fadeInUp}
        >
          Membawa
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
            {" "}Harapan{" "}
          </span>
          Untuk Masa Depan
        </motion.h1>
        
        <motion.p className="text-lg text-slate-600 leading-relaxed" variants={fadeInUp}>
          Rumah Kasih Sayang adalah bahtera cinta bagi anak-anak yang membutuhkan perlindungan, pendidikan, dan kesempatan untuk meraih mimpi.
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row gap-4" variants={fadeInUp}>
          <Link 
            href="#donasi" 
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-center"
            onClick={(e) => smoothScrollToSection(e, 'donasi')}
          >
            Halaman Donasi
          </Link>
          <Link 
            href="#about" 
            className="bg-white border-2 border-amber-300 text-amber-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-50 hover:border-amber-400 transform hover:-translate-y-1 transition-all duration-300 text-center"
            onClick={(e) => smoothScrollToSection(e, 'about')}
          >
            Pelajari Lebih Lanjut
          </Link>
        </motion.div>
      </motion.div>

      <motion.div 
        className="relative group mt-12 lg:mt-0"
        variants={{
           initial: { opacity: 0, scale: 0.8 },
           animate: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
        }}
      >
        <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 to-amber-400 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-2xl"></div>
        <Image
          src="/image/Gemini_Generated_Image_qnkb1vqnkb1vqnkb.png"
          alt="Anak-anak di Rumah Kasih Sayang"
          width={700}
          height={800}
          className="w-full h-full object-cover rounded-3xl shadow-2xl relative z-10"
          priority
        />
      </motion.div>
    </div>
  </motion.section>
); 