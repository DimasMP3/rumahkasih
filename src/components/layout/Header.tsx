'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

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

interface HeaderProps {
  handleNavigate: (path: string) => void;
}

export const Header = ({ handleNavigate }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'Tentang Kami' },
    { href: '#gallery', label: 'Galeri' },
  ];

  return (
    <>
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="#home" 
            className="flex items-center space-x-3"
            onClick={(e) => smoothScrollToSection(e, 'home')}
          >
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-full shadow-md">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-wide">Rumah Kasih</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-slate-600 hover:text-orange-500 font-medium transition-colors duration-300"
                onClick={(e) => smoothScrollToSection(e, link.href.substring(1))}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => handleNavigate('/donate')}
              className="bg-orange-500 text-white px-5 py-2 rounded-full font-semibold hover:bg-orange-600 transition-all transform hover:scale-105 shadow-sm"
            >
              Donasi
            </button>
          </nav>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 text-slate-700">
              <Menu size={28} />
            </button>
          </div>
        </div>
      </header>
      
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: '0%' }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-4/5 bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-slate-600"><X size={30} /></button>
              <motion.div className="flex flex-col space-y-8 mt-16" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }}>
                {navLinks.map((link) => (
                  <motion.a 
                    key={link.href} 
                    href={link.href} 
                    onClick={(e) => {
                      setIsMenuOpen(false); 
                      smoothScrollToSection(e, link.href.substring(1));
                    }} 
                    className="text-2xl font-semibold text-slate-700 hover:text-orange-500" 
                    variants={fadeInUp}
                  >
                    {link.label}
                  </motion.a>
                ))}
                <motion.button
                  onClick={() => { setIsMenuOpen(false); handleNavigate('/donate'); }}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white w-full py-4 rounded-xl text-lg font-bold shadow-lg"
                  variants={fadeInUp}
                >
                  Donasi Sekarang
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 