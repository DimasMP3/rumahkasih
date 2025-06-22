'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

// Gallery images
const galleryImages = [
  {
    src: "/image/Gemini_Generated_Image_o25lvdo25lvdo25l.png",
    alt: "Anak-anak bermain di halaman"
  },
  {
    src: "/image/Gemini_Generated_Image_xnl03uxnl03uxnl0.png",
    alt: "Kegiatan belajar bersama"
  },
  {
    src: "/image/Gemini_Generated_Image_kbtoibkbtoibkbto.png",
    alt: "Kegiatan makan bersama"
  },
  {
    src: "/image/Gemini_Generated_Image_nfsu50nfsu50nfsu.png",
    alt: "Bermain di taman"
  },
  {
    src: "/image/Gemini_Generated_Image_gfjf95gfjf95gfjf.png",
    alt: "Aktivitas seni dan kreativitas"
  },
  {
    src: "/image/Gemini_Generated_Image_edq9caedq9caedq9.png",
    alt: "Kegiatan membaca buku"
  },
];

export const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<null | string>(null);

  return (
    <motion.section 
      id="gallery" 
      className="py-24 bg-gradient-to-b from-white to-amber-50"
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="container mx-auto px-6">
        <motion.div className="text-center mb-16" variants={cardVariants}>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tighter">Galeri Kegiatan</h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Momen-momen bahagia dan bermakna dari keseharian di Rumah Kasih Sayang.
          </p>
        </motion.div>
        
        <motion.div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" variants={cardVariants}>
          {galleryImages.map((image, index) => (
            <motion.div 
              key={index}
              className="relative group overflow-hidden rounded-xl shadow-lg cursor-pointer aspect-[4/3]"
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              onClick={() => setSelectedImage(image.src)}
              variants={cardVariants}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={800}
                height={600}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                <p className="text-white font-medium">{image.alt}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-5xl w-full max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedImage}
                  alt="Enlarged photo"
                  width={1200}
                  height={800}
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}; 