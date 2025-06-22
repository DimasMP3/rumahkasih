'use client';

import React from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { BookOpen, Utensils, Award, Palette } from "lucide-react";

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

export const AboutSection = () => (
  <motion.section 
    id="about" 
    className="py-24 bg-white"
    initial="offscreen"
    whileInView="onscreen"
    viewport={{ once: true, amount: 0.2 }}
    transition={{ staggerChildren: 0.2 }}
  >
    <div className="container mx-auto px-6">
      <motion.div className="text-center mb-16" variants={cardVariants}>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tighter">Tentang Rumah Kasih</h2>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Mengenal lebih dekat misi dan visi kami dalam memberikan kehidupan yang lebih baik.
        </p>
      </motion.div>
      
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <motion.div className="grid grid-cols-2 gap-4" variants={cardVariants}>
          <Image src="/image/Gemini_Generated_Image_obc1g4obc1g4obc1.png" alt="Kegiatan belajar" width={400} height={500} className="w-full rounded-2xl object-cover shadow-lg aspect-[3/4]" />
          <Image src="/image/Gemini_Generated_Image_8hqbn68hqbn68hqb.png" alt="Bermain bersama" width={400} height={500} className="w-full rounded-2xl object-cover shadow-lg aspect-[3/4] mt-8" />
        </motion.div>
        
        <motion.div className="space-y-8" variants={cardVariants}>
          <h3 className="text-3xl font-bold text-slate-800">Rumah Penuh Kasih dan Harapan</h3>
          <p className="text-lg text-slate-600 leading-relaxed">
            Didirikan pada tahun 2010, Rumah Kasih Sayang telah menjadi tempat perlindungan dan pengembangan diri bagi lebih dari 500 anak-anak kurang beruntung. Kami memberikan pendidikan, nutrisi, dan cinta yang mereka butuhkan untuk tumbuh menjadi individu yang percaya diri dan mandiri.
          </p>
          
          <div className="grid grid-cols-2 gap-5 mt-6">
            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
              <BookOpen className="h-8 w-8 text-orange-500 mb-3" />
              <h4 className="font-semibold text-lg text-slate-800 mb-2">Pendidikan</h4>
              <p className="text-slate-600">Akses ke pendidikan berkualitas untuk masa depan yang cerah.</p>
            </div>
            
            <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
              <Utensils className="h-8 w-8 text-amber-500 mb-3" />
              <h4 className="font-semibold text-lg text-slate-800 mb-2">Nutrisi</h4>
              <p className="text-slate-600">Makanan bergizi untuk mendukung kesehatan dan pertumbuhan.</p>
            </div>
            
            <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
              <Award className="h-8 w-8 text-amber-500 mb-3" />
              <h4 className="font-semibold text-lg text-slate-800 mb-2">Pengembangan</h4>
              <p className="text-slate-600">Mengembangkan minat dan bakat untuk masa depan.</p>
            </div>
            
            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
              <Palette className="h-8 w-8 text-orange-500 mb-3" />
              <h4 className="font-semibold text-lg text-slate-800 mb-2">Kreativitas</h4>
              <p className="text-slate-600">Mendorong ekspresi dan kreativitas setiap anak.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </motion.section>
); 