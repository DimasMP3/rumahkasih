'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Define the type for our context
interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// Create the context with a default value
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Create a provider component
interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gradient-to-br from-white to-orange-50 z-50 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur-lg opacity-50"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div className="flex items-center justify-center bg-white p-4 rounded-full shadow-lg relative z-10">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Heart className="h-12 w-12 text-gradient-to-r from-orange-500 to-amber-500 text-orange-500" />
                  </motion.div>
                </motion.div>
              </div>
              <motion.div 
                className="mt-6 space-y-1 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <p className="text-xl font-bold text-slate-800">Rumah Kasih</p>
                <div className="flex space-x-2 justify-center mt-2">
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-5, 0, -5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    className="h-2 w-2 bg-orange-500 rounded-full"
                  />
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-5, 0, -5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="h-2 w-2 bg-amber-500 rounded-full"
                  />
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-5, 0, -5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="h-2 w-2 bg-orange-500 rounded-full"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook to use the loading context
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}; 