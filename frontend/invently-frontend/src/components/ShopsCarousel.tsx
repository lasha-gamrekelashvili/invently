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
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-full">
        {/* Scrolling text carousel */}
        <div className="relative">
          {/* Subtle gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-48 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling container */}
          <div className="overflow-hidden py-6">
            <div 
              className="flex items-center animate-scroll" 
              style={{ animationDuration: `${animationDuration}s` }}
            >
              {displayShops.map((shop, index) => (
                <a
                  key={`${shop.id}-${index}`}
                  href={`http://${shop.subdomain}.${window.location.hostname.includes('localhost') ? 'localhost:3000' : 'shopu.ge'}/store`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 px-12 group"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight transition-all duration-300 whitespace-nowrap bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text group-hover:text-transparent">
                      {shop.name}
                    </span>
                    <span className="text-base md:text-lg font-medium italic mt-2 transition-colors duration-300">
                      <span className="text-gray-400 group-hover:text-gray-600">{shop.subdomain}</span>
                      <span className="text-gray-600 group-hover:text-gray-700">.shopu</span>
                      <span className="text-primary-500 group-hover:text-primary-600">.ge</span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mt-12">
          <p className="text-sm md:text-base text-gray-500 font-medium tracking-wide">
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

