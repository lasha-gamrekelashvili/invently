import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface StorefrontHeroProps {
  storeInfo?: {
    name: string;
    description?: string;
  };
  onShopNowClick?: () => void;
}

const StorefrontHero: React.FC<StorefrontHeroProps> = ({ storeInfo, onShopNowClick }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-2xl shadow-xl mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative px-6 py-16 sm:px-12 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Welcome to {storeInfo?.name || 'Our Store'}
          </h2>

          {storeInfo?.description && (
            <p className="text-lg sm:text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
              {storeInfo.description}
            </p>
          )}

          {!storeInfo?.description && (
            <p className="text-lg sm:text-xl text-blue-50 mb-8 max-w-2xl mx-auto">
              Discover amazing products at unbeatable prices. Shop now and enjoy a seamless shopping experience.
            </p>
          )}

          {/* CTA Button */}
          <button
            onClick={onShopNowClick}
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
          >
            <span>Shop Now</span>
            <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorefrontHero;