import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface LoadingScreenProps {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [showLoadingText, setShowLoadingText] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLoadingText(prev => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fallback image URL in case local image fails to load
  const fallbackImageUrl = "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop";

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Image container with blur and fade effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900/90">
            <Image
              src={imageError ? fallbackImageUrl : "/market-splash.jpg"}
              alt="Market background"
              fill
              className="object-cover opacity-40 mix-blend-overlay"
              onError={() => setImageError(true)}
              style={{
                filter: 'blur(4px)',
                transform: 'scale(1.1)'
              }}
              priority
            />
          </div>
          
          {/* Radial gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
          
          {/* Content with enhanced visibility */}
          <div className="relative z-10 text-center text-white px-4 backdrop-blur-sm bg-black/10 rounded-xl p-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
                Barcelona Market Explorer
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 drop-shadow">
                Discovering the best prices across local markets
              </p>
            </motion.div>

            <motion.div
              animate={{ opacity: showLoadingText ? 1 : 0.5 }}
              transition={{ duration: 0.5 }}
              className="text-lg font-medium text-gray-100 drop-shadow"
            >
              Loading products...
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 