'use client';

import React from 'react';
import { Heart, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export const Footer = () => (
  <footer className="bg-slate-800 text-white py-16">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-3 gap-12">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-full">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Rumah Kasih</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Bersama membangun harapan untuk masa depan yang lebih cerah bagi setiap anak Indonesia.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Kontak Kami</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-center space-x-3">
              <Phone size={16} className="text-orange-400" />
              <span>(0838) 9629-7994</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail size={16} className="text-orange-400" />
              <span>info@rumahkasih.org</span>
            </li>
            <li className="flex space-x-3">
              <MapPin size={16} className="text-orange-400 mt-1 flex-shrink-0" />
              <span>https://github.com/DimasMP3</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Ikuti Kami</h3>
          <div className="flex space-x-4 mb-6">
            <a href="#!" className="bg-slate-700 hover:bg-orange-500 transition-colors p-3 rounded-full">
              <Facebook size={20} />
            </a>
            <a href="#!" className="bg-slate-700 hover:bg-orange-500 transition-colors p-3 rounded-full">
              <Instagram size={20} />
            </a>
            <a href="#!" className="bg-slate-700 hover:bg-orange-500 transition-colors p-3 rounded-full">
              <Twitter size={20} />
            </a>
          </div>
          <p className="text-slate-300 text-sm">
            Berlangganan untuk mendapatkan kabar terbaru dari kami.
          </p>
          <div className="mt-3 flex">
            <input 
              type="email" 
              placeholder="Email Anda"
              className="bg-slate-700 border-none rounded-l-lg px-4 py-2 focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm flex-grow"
            />
            <button className="bg-orange-500 hover:bg-orange-600 px-3 rounded-r-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Rumah Kasih Sayang. Hak Cipta Dilindungi.</p>
      </div>
    </div>
  </footer>
); 