'use client';

import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import {
  useLoading,
  Header,
  HeroSection,
  AboutSection,
  GallerySection,
  DonationSection,
  Footer
} from "../components";

export default function HomePage() {
  const router = useRouter();
  const { setIsLoading } = useLoading();
  
  useEffect(() => {
    // Matikan loading setelah halaman dimuat
    setIsLoading(false);
  }, [setIsLoading]);

  // Fungsi navigasi dengan loading state
  const handleNavigate = (path: string) => {
    setIsLoading(true);
    // Timeout memberikan waktu untuk animasi loading muncul
    setTimeout(() => {
      router.push(path);
    }, 500);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header handleNavigate={handleNavigate} />
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <DonationSection handleNavigate={handleNavigate} />
      <Footer />
    </main>
  );
}