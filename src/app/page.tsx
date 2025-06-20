'use client';

// SEMUA IMPORT DIGABUNG DI ATAS
import { useState, useEffect } from 'react';
import { Heart, Users, Home, Camera, Gift, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Menu, X, BookOpen, Utensils, Award, Palette } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useLoading } from "./components/LoadingProvider"; // Pastikan path ini benar
import { useRouter } from "next/navigation";

// VARIAN ANIMASI UNTUK FRAMER MOTION (dapat digunakan kembali)
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

// ---------------------------------
// --- SUB-KOMPONEN (dalam satu file) ---
// ---------------------------------

//--- 1. KOMPONEN HEADER ---
const Header = ({ handleNavigate }: { handleNavigate: (path: string) => void }) => {
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


//--- 2. KOMPONEN HERO SECTION ---
const HeroSection = () => (
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
              Donasi Sekarang
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


//--- 3. KOMPONEN ABOUT SECTION ---
const AboutSection = () => (
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
          <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-4">Misi Kami</h3>
            <p className="text-slate-600 leading-relaxed">
              Memberikan tempat tinggal yang aman, pendidikan berkualitas, dan kasih sayang tulus agar mereka dapat tumbuh menjadi individu yang mandiri dan berakhlak mulia.
            </p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-slate-800 mb-4">Visi Kami</h3>
            <p className="text-slate-600 leading-relaxed">
              Menjadi rumah yang menumbuhkan harapan dan mencetak generasi masa depan yang cerah, tangguh, dan berkontribusi positif bagi masyarakat.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  </motion.section>
);


//--- 4. KOMPONEN GALLERY SECTION ---
const GallerySection = () => {
    const galleryItems = [
      { title: "Pendidikan Karakter", desc: "Belajar dengan gembira", imageSrc: "/image/Gemini_Generated_Image_rlwzorrlwzorrlwz.png", icon: BookOpen },
      { title: "Keceriaan Bersama", desc: "Waktu bermain yang seru", imageSrc: "/image/Gemini_Generated_Image_gfjf95gfjf95gfjf.png", icon: Users },
      { title: "Gizi Terpenuhi", desc: "Makan bersama penuh syukur", imageSrc: "/image/Gemini_Generated_Image_kbtoibkbtoibkbto.png", icon: Utensils },
      { title: "Bakat & Kreativitas", desc: "Mengembangkan potensi diri", imageSrc: "/image/Gemini_Generated_Image_il9r5qil9r5qil9r.png", icon: Palette },
      { title: "Prestasi Membanggakan", desc: "Merayakan setiap pencapaian", imageSrc: "/image/Gemini_Generated_Image_xnl03uxnl03uxnl0.png", icon: Award },
      { title: "Momen Spesial", desc: "Kenangan tak terlupakan", imageSrc: "/image/Gemini_Generated_Image_rlwzorrlwzorrlwz.png", icon: Gift },
    ];
    return (
        <section id="gallery" className="py-24 bg-orange-50/50">
            <div className="container mx-auto px-6">
                <motion.div 
                    className="text-center mb-16"
                    initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.3 }} variants={cardVariants}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tighter">Galeri Momen Bahagia</h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Intip kehangatan dan keceriaan sehari-hari di Rumah Kasih Sayang.
                    </p>
                </motion.div>
                <motion.div 
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.1 }} transition={{ staggerChildren: 0.1 }}
                >
                    {galleryItems.map((item, index) => (
                        <motion.div
                            key={index}
                            className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                            variants={cardVariants}
                        >
                            <Image src={item.imageSrc} alt={item.title} width={400} height={400} className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                               <div className="flex items-center space-x-3 mb-2">
                                  <item.icon className="h-6 w-6 text-orange-300" />
                                  <h3 className="font-bold text-xl">{item.title}</h3>
                               </div>
                               <p className="text-sm opacity-90 ml-9">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                <div className="text-center mt-12">
                  <button className="bg-white text-orange-500 px-8 py-3 rounded-full font-semibold hover:bg-orange-100 transition-colors inline-flex items-center space-x-2 shadow-md">
                      <Camera className="h-5 w-5" />
                      <span>Lihat Lebih Banyak</span>
                  </button>
                </div>
            </div>
        </section>
    );
};

//--- 5. KOMPONEN DONATION SECTION ---
const DonationSection = ({ handleNavigate }: { handleNavigate: (path: string) => void }) => {
  const donationOptions = [
    { icon: Gift, title: "Donasi Rutin", desc: "Dukungan bulanan untuk operasional harian.", amount: "Rp 100.000/bln", color: "orange" },
    { icon: BookOpen, title: "Donasi Pendidikan", desc: "Investasi untuk masa depan dan ilmu mereka.", amount: "Mulai dari Rp 50.000", color: "amber", popular: true },
    { icon: Users, title: "Donasi Khusus", desc: "Bantuan untuk acara atau kebutuhan spesifik.", amount: "Seikhlasnya", color: "orange" },
  ];
  return(
    <motion.section 
      id="donasi" 
      className="py-24 bg-white"
      initial="offscreen" whileInView="onscreen" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.2 }}
    >
      <div className="container mx-auto px-6">
        <motion.div className="text-center mb-16" variants={cardVariants}>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tighter">Ulurkan Tangan Kebaikan</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Setiap kontribusi, sekecil apapun, menciptakan gelombang kebahagiaan yang besar bagi mereka.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {donationOptions.map((item, index) => (
            <motion.div 
              key={index} 
              className={`relative border-2 rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${item.popular ? 'border-amber-500 bg-amber-50' : 'border-transparent bg-slate-50'}`}
              variants={cardVariants}
            >
              {item.popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Populer</div>}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-gradient-to-br from-${item.color}-400 to-${item.color}-500 shadow-lg`}>
                <item.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-slate-600 mb-6 h-12">{item.desc}</p>
              <div className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-${item.color}-500 to-${item.color}-600`}>{item.amount}</div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 lg:p-12 text-white text-center shadow-2xl"
          variants={cardVariants}
        >
           <h3 className="text-3xl lg:text-4xl font-bold mb-4">Mari Berbagi Kebahagiaan</h3>
           <p className="text-lg mb-8 opacity-90 max-w-3xl mx-auto">
             Donasi Anda akan langsung disalurkan untuk kebutuhan anak-anak. Klik tombol di bawah untuk memulai.
           </p>
           <button onClick={() => handleNavigate('/donate')} className="bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-lg shadow-md hover:bg-orange-50 transform hover:scale-105 transition-all">
             Mulai Berdonasi
           </button>
           <div className="mt-8 pt-8 border-t border-white/20">
             <p className="text-sm opacity-80 mb-2">Rekening Donasi a.n. Yayasan Rumah Kasih Sayang:</p>
             <p className="font-semibold tracking-wider">Bank BCA: 1234567890</p>
           </div>
        </motion.div>
      </div>
    </motion.section>
  )
};

//--- 6. KOMPONEN FOOTER ---
const Footer = ({ handleNavigate }: { handleNavigate: (path: string) => void }) => (
    <footer className="bg-slate-800 text-white pt-16">
        <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-orange-400 to-amber-400 p-2 rounded-full"><Heart className="h-6 w-6 text-white" /></div>
                        <span className="text-xl font-bold">Rumah Kasih</span>
                    </div>
                    <p className="text-slate-300">Memberikan harapan dan masa depan cerah untuk anak-anak melalui kasih sayang dan pendidikan.</p>
                </div>
                <div>
                    <h4 className="font-semibold text-lg mb-4">Kontak</h4>
                    <div className="space-y-3 text-slate-300">
                        <div className="flex items-center space-x-3"><Phone className="h-4 w-4" /><span>DimasMP3</span></div>
                        <div className="flex items-center space-x-3"><Mail className="h-4 w-4" /><span>Fullstack Developer</span></div>
                        <div className="flex items-center space-x-3"><MapPin className="h-4 w-4" /><span>https://github.com/DimasMP3</span></div>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-lg mb-4">Menu</h4>
                    <div className="space-y-2 text-slate-300">
                        <Link 
                          href="#home" 
                          className="block hover:text-orange-400 transition-colors"
                          onClick={(e) => smoothScrollToSection(e, 'home')}
                        >
                          Home
                        </Link>
                        <Link 
                          href="#about" 
                          className="block hover:text-orange-400 transition-colors"
                          onClick={(e) => smoothScrollToSection(e, 'about')}
                        >
                          Tentang Kami
                        </Link>
                        <Link 
                          href="#gallery" 
                          className="block hover:text-orange-400 transition-colors"
                          onClick={(e) => smoothScrollToSection(e, 'gallery')}
                        >
                          Galeri
                        </Link>
                        <a onClick={(e) => { e.preventDefault(); handleNavigate('/donate'); }} className="block hover:text-orange-400 transition-colors cursor-pointer">Donasi</a>
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold text-lg mb-4">Ikuti Kami</h4>
                    <div className="flex space-x-4">
                        <Link href="#" className="bg-slate-700 p-2 rounded-full hover:bg-orange-500 transition-colors"><Facebook className="h-5 w-5" /></Link>
                        <Link href="#" className="bg-slate-700 p-2 rounded-full hover:bg-orange-500 transition-colors"><Instagram className="h-5 w-5" /></Link>
                        <Link href="#" className="bg-slate-700 p-2 rounded-full hover:bg-orange-500 transition-colors"><Twitter className="h-5 w-5" /></Link>
                    </div>
                </div>
            </div>
            <div className="border-t border-slate-700 mt-12 py-8 text-center text-slate-400">
                <p>&copy; {new Date().getFullYear()} Rumah Kasih. Semua hak dilindungi.</p>
            </div>
        </div>
    </footer>
);

// -----------------------------
// --- KOMPONEN UTAMA (PARENT) ---
// -----------------------------

export default function OrphanageLanding() {
  const router = useRouter();
  // Asumsi useLoading berasal dari file terpisah yang sudah Anda miliki
  const { setIsLoading } = useLoading(); 
  
  // Menambahkan useEffect untuk mematikan loading saat komponen dimount
  useEffect(() => {
    // Matikan loading state setelah halaman dimuat
    setIsLoading(false);
  }, [setIsLoading]);
  
  // Fungsi untuk handle navigasi dengan loading - sistem tidak dirusak
  const handleNavigate = (path: string) => {
    setIsLoading(true);
    // Timeout memberi waktu untuk animasi loading muncul sebelum halaman berpindah
    setTimeout(() => {
      router.push(path, { scroll: false });
    }, 500); 
  };

  return (
    // Menggunakan warna latar belakang yang lebih lembut
    <div className="min-h-screen bg-orange-50/30 text-slate-800">
      <Header handleNavigate={handleNavigate} />
      <main>
        <HeroSection />
        <AboutSection />
        <GallerySection />
        <DonationSection handleNavigate={handleNavigate} />
      </main>
      <Footer handleNavigate={handleNavigate} />
    </div>
  )
}