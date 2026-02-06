import React, { useEffect, useState } from 'react';
import api from '../utils/api';

interface Shop {
  id: number;
  name: string;
  subdomain: string;
}

const ShopsCarousel: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch shops from public API
    const fetchShops = async () => {
      try {
        const response = await api.get('/public/stores');
        setShops(response.data || []);
      } catch (error) {
        console.error('Failed to fetch shops:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, []);

  if (isLoading || shops.length === 0) {
    return null;
  }

  // Create multiple duplicates for seamless infinite scroll
  const displayShops = [...shops, ...shops, ...shops, ...shops];

  // Calculate animation duration based on number of items
  // More items = longer duration for consistent speed
  // Base: 3 seconds per shop
  const animationDuration = Math.max(12, shops.length * 3);

  return (
    <section className="pt-12 pb-8 sm:pt-16 sm:pb-10 lg:pt-20 lg:pb-12 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-full">
        {/* Scrolling text carousel */}
        <div className="relative">
          {/* Subtle gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 lg:w-48 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 lg:w-48 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling container */}
          <div className="overflow-hidden py-4 sm:py-5 lg:py-6">
            <div 
              className="flex items-center animate-scroll" 
              style={{ animationDuration: `${animationDuration}s` }}
            >
              {displayShops.map((shop, index) => {
                const shopUrl = (shop as any).customDomain
                  ? `https://${(shop as any).customDomain}/store`
                  : `http://${shop.subdomain}.${window.location.hostname.includes('localhost') ? 'localhost:3000' : 'shopu.ge'}/store`;
                const displayDomain = (shop as any).customDomain || `${shop.subdomain}.shopu.ge`;
                
                return (
                  <a
                    key={`${shop.id}-${index}`}
                    href={shopUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 px-6 sm:px-8 lg:px-12 group"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 tracking-tight transition-all duration-300 whitespace-nowrap bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text group-hover:text-transparent">
                        {shop.name}
                      </span>
                      <span className="text-xs sm:text-sm md:text-base lg:text-lg font-medium italic mt-1 sm:mt-1.5 lg:mt-2 transition-colors duration-300">
                        <span className="text-gray-400 group-hover:text-gray-600">{displayDomain}</span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mt-6 sm:mt-8 lg:mt-10 px-4">
          <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium tracking-wide">
            JOIN {shops.length}+ BUSINESSES SELLING WITH SHOPU
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-25%);
          }
        }

        .animate-scroll {
          animation: scroll linear infinite;
          width: max-content;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default ShopsCarousel;

