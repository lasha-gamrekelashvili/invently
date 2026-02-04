import React from 'react';
import { UpdateStoreSettingsData } from '../types';
import { ChevronRightIcon, MagnifyingGlassIcon, ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

interface StorefrontPreviewProps {
  colors: UpdateStoreSettingsData;
  onReset?: () => void;
}

const StorefrontPreview: React.FC<StorefrontPreviewProps> = ({ colors, onReset }) => {
  // Get colors with defaults
  const backgroundColor = colors.backgroundColor || '#fafafa';
  const sidebarBackgroundColor = colors.sidebarBackgroundColor || '#f5f5f5';
  const sidebarSelectedColor = colors.sidebarSelectedColor || '#e5e5e5';
  const sidebarTextColor = colors.sidebarTextColor || '#525252';
  const sidebarSelectedTextColor = colors.sidebarSelectedTextColor || '#171717';
  const sidebarHeadingColor = colors.sidebarHeadingColor || '#737373';
  const sidebarDividerColor = colors.sidebarDividerColor || '#e5e5e5';
  const sidebarBorderColor = colors.sidebarBorderColor || '#e5e5e5';
  const headerBackgroundColor = colors.headerBackgroundColor || '#ffffff';
  const headerTextColor = colors.headerTextColor || '#171717';
  const headerBorderColor = colors.headerBorderColor || '#e5e5e5';
  const searchBarBackgroundColor = colors.searchBarBackgroundColor || '#ffffff';
  const searchBarBorderColor = colors.searchBarBorderColor || '#d4d4d4';
  const searchBarPlaceholderColor = colors.searchBarPlaceholderColor || '#a3a3a3';
  const searchBarIconColor = colors.searchBarIconColor || '#a3a3a3';
  const productCardBorderColor = colors.productCardBorderColor || '#e5e5e5';
  const productCardTextColor = colors.productCardTextColor || '#171717';
  const productCardCategoryTextColor = colors.productCardCategoryTextColor || '#737373';
  const productCardPriceTextColor = colors.productCardPriceTextColor || '#171717';
  const cardInfoBackgroundColor = colors.cardInfoBackgroundColor || '#fafafa';
  const categorySectionTitleColor = colors.categorySectionTitleColor || '#171717';
  const categorySectionAccentColor = colors.categorySectionAccentColor || '#171717';
  const categorySectionLinkColor = colors.categorySectionLinkColor || '#525252';
  const categorySectionBorderColor = colors.categorySectionBorderColor || '#e5e5e5';
  const footerBackgroundColor = colors.footerBackgroundColor || '#ffffff';
  const footerTextColor = colors.footerTextColor || '#171717';
  const footerHeadingColor = colors.footerHeadingColor || '#171717';
  const footerLinkColor = colors.footerLinkColor || '#525252';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden">
      <div className="text-xs font-medium text-gray-700 mb-2">Live Preview</div>
      
      {/* Preview Container - Matches actual storefront proportions */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden shadow-sm flex flex-col" style={{ backgroundColor, height: '500px' }}>
        {/* Header Preview - Matches StorefrontHeader exactly */}
        <div className="h-12 border-b flex items-center px-4 gap-3" style={{ backgroundColor: headerBackgroundColor, borderColor: headerBorderColor }}>
          {/* Search Bar - Centered with icon */}
          <div className="flex-1 flex justify-center max-w-lg">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4" style={{ color: searchBarIconColor }} />
              </div>
              <div 
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs"
                style={{ 
                  backgroundColor: searchBarBackgroundColor, 
                  borderColor: searchBarBorderColor,
                }}
              >
                <span style={{ color: searchBarPlaceholderColor }}>Search...</span>
              </div>
            </div>
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xs font-medium" style={{ color: headerTextColor }}>EN</div>
            <div className="w-px h-4" style={{ backgroundColor: headerBorderColor }}></div>
            <div className="text-xs opacity-60" style={{ color: headerTextColor }}>GE</div>
            <div className="w-6 h-6 flex items-center justify-center rounded-lg transition-all" style={{ color: headerTextColor }}>
              <ShoppingBagIcon className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar Preview - Matches actual sidebar (320px scaled proportionally) */}
          <div className="w-40 border-r p-4 space-y-4 overflow-y-auto" style={{ backgroundColor: sidebarBackgroundColor, borderColor: sidebarBorderColor }}>
            {/* All Products Button */}
            <button 
              className="w-full px-3 py-2 rounded-lg text-[9px] font-medium transition-all"
              style={{ backgroundColor: sidebarSelectedColor, color: sidebarSelectedTextColor }}
            >
              All Products
            </button>
            
            {/* Categories */}
            <div>
              <div className="text-[8px] font-medium px-1 uppercase tracking-wider mb-3" style={{ color: sidebarHeadingColor }}>
                Categories
              </div>
              <div className="space-y-0.5">
                <div
                  className="group flex items-center py-2 px-2 rounded-lg text-[9px] transition-colors"
                  style={{ color: sidebarTextColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.sidebarHoverColor || '#e5e5e580';
                    e.currentTarget.style.color = sidebarSelectedTextColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = sidebarTextColor;
                  }}
                >
                  <ChevronRightIcon className="w-3 h-3 mr-2 flex-shrink-0" style={{ color: sidebarTextColor, opacity: 0.4 }} />
                  <span className="font-medium">Beauty & Health</span>
                </div>
                <div className="ml-4 mt-1 border-l pl-2" style={{ borderColor: sidebarDividerColor }}>
                  <div className="flex items-center py-2 px-2 rounded-lg text-[9px] font-medium" style={{ backgroundColor: sidebarSelectedColor, color: sidebarSelectedTextColor }}>
                    <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: sidebarSelectedTextColor, opacity: 0.5 }}></div>
                    Supplements
                  </div>
                </div>
                <div
                  className="group flex items-center py-2 px-2 rounded-lg text-[9px] transition-colors"
                  style={{ color: sidebarTextColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.sidebarHoverColor || '#e5e5e580';
                    e.currentTarget.style.color = sidebarSelectedTextColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = sidebarTextColor;
                  }}
                >
                  <ChevronRightIcon className="w-3 h-3 mr-2 flex-shrink-0" style={{ color: sidebarTextColor, opacity: 0.4 }} />
                  <span>Books & Media</span>
                </div>
                <div
                  className="group flex items-center py-2 px-2 rounded-lg text-[9px] transition-colors"
                  style={{ color: sidebarTextColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.sidebarHoverColor || '#e5e5e580';
                    e.currentTarget.style.color = sidebarSelectedTextColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = sidebarTextColor;
                  }}
                >
                  <ChevronRightIcon className="w-3 h-3 mr-2 flex-shrink-0" style={{ color: sidebarTextColor, opacity: 0.4 }} />
                  <span>Electronics</span>
                </div>
                <div
                  className="group flex items-center py-2 px-2 rounded-lg text-[9px] transition-colors"
                  style={{ color: sidebarTextColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.sidebarHoverColor || '#e5e5e580';
                    e.currentTarget.style.color = sidebarSelectedTextColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = sidebarTextColor;
                  }}
                >
                  <ChevronRightIcon className="w-3 h-3 mr-2 flex-shrink-0" style={{ color: sidebarTextColor, opacity: 0.4 }} />
                  <span>Fashion</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Main Content Preview - Matches actual layout with proper padding */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '16px 32px' }}>
            {/* Category Section - Matches CategorySection exactly */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: categorySectionBorderColor }}>
              <div className="py-4">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: categorySectionAccentColor }}></div>
                    <h2 className="text-base font-light tracking-tight" style={{ color: categorySectionTitleColor }}>
                      Beauty & Health
                    </h2>
                  </div>
                  <button className="flex items-center gap-1 text-[10px] font-medium transition-colors group" style={{ color: categorySectionLinkColor }}>
                    <span>სრულად</span>
                    <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
                
                {/* Product Cards Grid - Matches actual grid with 6 items in one row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-md border overflow-hidden shadow-sm flex flex-col h-full transition-all duration-300 cursor-pointer"
                      style={{ borderColor: productCardBorderColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.productCardHoverBorderColor || '#d4d4d4';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = productCardBorderColor;
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      {/* Product Image Placeholder */}
                      <div className="aspect-square bg-neutral-100 rounded-t-md"></div>
                      {/* Product Info - Matches ProductCard exactly */}
                      <div className="p-2.5 flex flex-col flex-1" style={{ backgroundColor: cardInfoBackgroundColor }}>
                        <div className="text-[9px] uppercase mb-1 font-medium tracking-wider" style={{ color: productCardCategoryTextColor }}>
                          SUPPLEMENTS
                        </div>
                        <h3 className="text-[10px] font-medium mb-1.5 line-clamp-2 leading-snug" style={{ color: productCardTextColor }}>
                          Product Name {i}
                        </h3>
                        <div className="mt-auto pt-1">
                          <p className="text-xs font-light tracking-tight" style={{ color: productCardPriceTextColor }}>
                            $29.99
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Preview */}
        <div className="border-t" style={{ backgroundColor: footerBackgroundColor, borderColor: categorySectionBorderColor }}>
          <div className="p-3">
            <div className="grid grid-cols-3 gap-3 text-[9px]">
              <div className="text-center">
                <div className="font-medium mb-1.5 uppercase" style={{ color: footerHeadingColor }}>Quick Links</div>
                <div className="space-y-1">
                  <div style={{ color: footerLinkColor }}>About Us</div>
                  <div style={{ color: footerLinkColor }}>Privacy Policy</div>
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium mb-1.5 uppercase" style={{ color: footerHeadingColor }}>Customer Service</div>
                <div className="space-y-1">
                  <div style={{ color: footerLinkColor }}>Shipping Info</div>
                  <div style={{ color: footerLinkColor }}>Returns</div>
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium mb-1.5 uppercase" style={{ color: footerHeadingColor }}>Follow Us</div>
                <div className="flex gap-1 mt-1.5 justify-center">
                  <div className="w-3 h-3 rounded-full border" style={{ borderColor: footerLinkColor }}></div>
                  <div className="w-3 h-3 rounded-full border" style={{ borderColor: footerLinkColor }}></div>
                  <div className="w-3 h-3 rounded-full border" style={{ borderColor: footerLinkColor }}></div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t text-center" style={{ borderColor: categorySectionBorderColor }}>
              <div className="text-[8px]" style={{ color: footerTextColor }}>© 2026 Powered by Shopu.ge</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
        <p className="text-xs text-gray-500">Preview updates in real-time as you change colors</p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted underline-offset-2 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default StorefrontPreview;

export const StorefrontProductPreview: React.FC<StorefrontPreviewProps> = ({ colors, onReset }) => {
  const backgroundColor = colors.backgroundColor || '#fafafa';
  const headerBackgroundColor = colors.headerBackgroundColor || '#ffffff';
  const headerTextColor = colors.headerTextColor || '#171717';
  const headerBorderColor = colors.headerBorderColor || '#e5e5e5';
  const searchBarBackgroundColor = colors.searchBarBackgroundColor || '#ffffff';
  const searchBarBorderColor = colors.searchBarBorderColor || '#d4d4d4';
  const searchBarPlaceholderColor = colors.searchBarPlaceholderColor || '#a3a3a3';
  const searchBarIconColor = colors.searchBarIconColor || '#a3a3a3';
  const productCardBorderColor = colors.productCardBorderColor || '#e5e5e5';
  const productCardTextColor = colors.productCardTextColor || '#171717';
  const productCardPriceTextColor = colors.productCardPriceTextColor || '#171717';
  const buttonPrimaryBackgroundColor = colors.buttonPrimaryBackgroundColor || '#171717';
  const buttonPrimaryTextColor = colors.buttonPrimaryTextColor || '#ffffff';
  const buttonSecondaryBackgroundColor = colors.buttonSecondaryBackgroundColor || '#ffffff';
  const buttonSecondaryTextColor = colors.buttonSecondaryTextColor || '#171717';
  const buttonSecondaryBorderColor = colors.buttonSecondaryBorderColor || '#171717';
  const breadcrumbTextColor = colors.breadcrumbTextColor || '#525252';
  const breadcrumbActiveTextColor = colors.breadcrumbActiveTextColor || '#171717';
  const breadcrumbIconColor = colors.breadcrumbIconColor || '#a3a3a3';
  const productDetailCardBackgroundColor = colors.productDetailCardBackgroundColor || '#ffffff';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden">
      <div className="text-xs font-medium text-gray-700 mb-2">Product Preview</div>

      <div className="relative border border-gray-300 rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor, height: '440px' }}>
        {/* Header */}
        <div className="h-12 border-b flex items-center px-4 gap-3" style={{ backgroundColor: headerBackgroundColor, borderColor: headerBorderColor }}>
          <div className="flex-1 flex justify-center max-w-lg">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4" style={{ color: searchBarIconColor }} />
              </div>
              <div
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs"
                style={{
                  backgroundColor: searchBarBackgroundColor,
                  borderColor: searchBarBorderColor,
                }}
              >
                <span style={{ color: searchBarPlaceholderColor }}>Search...</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-xs font-medium" style={{ color: headerTextColor }}>EN</div>
            <div className="w-px h-4" style={{ backgroundColor: headerBorderColor }}></div>
            <div className="text-xs opacity-60" style={{ color: headerTextColor }}>GE</div>
            <div className="w-6 h-6 flex items-center justify-center rounded-lg" style={{ color: headerTextColor }}>
              <ShoppingBagIcon className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Product Content */}
        <div className="p-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-[10px] mb-3" style={{ color: breadcrumbTextColor }}>
            <span>Home</span>
            <ChevronRightIcon className="w-3 h-3 mx-1" style={{ color: breadcrumbIconColor }} />
            <span>Beauty &amp; Health</span>
            <ChevronRightIcon className="w-3 h-3 mx-1" style={{ color: breadcrumbIconColor }} />
            <span>Supplements</span>
            <ChevronRightIcon className="w-3 h-3 mx-1" style={{ color: breadcrumbIconColor }} />
            <span style={{ color: breadcrumbActiveTextColor }}>Multivitamin</span>
          </div>

          {/* Product Card */}
          <div className="rounded-lg border p-3" style={{ borderColor: productCardBorderColor, backgroundColor: productDetailCardBackgroundColor }}>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <div className="aspect-square bg-neutral-100 rounded-md border" style={{ borderColor: productCardBorderColor }}></div>
              </div>
              <div className="col-span-3 space-y-2">
                <div className="text-xs font-medium" style={{ color: productCardTextColor }}>Multivitamin Gummies</div>
                <div className="text-sm font-light" style={{ color: productCardPriceTextColor }}>$24.99</div>

                <div className="text-[10px] text-neutral-500">Quantity</div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-md" style={{ borderColor: productCardBorderColor }}>
                    <div className="px-2 py-1 text-xs text-neutral-600">-</div>
                    <div className="px-2 py-1 text-xs border-x" style={{ borderColor: productCardBorderColor }}>1</div>
                    <div className="px-2 py-1 text-xs text-neutral-600">+</div>
                  </div>
                  <div className="text-[10px] text-neutral-500">Max: 248</div>
                </div>

                <div className="text-[10px] text-neutral-500 pt-1">
                  Daily multivitamin for adults.
                </div>

                <div className="pt-1">
                  <button
                    className="w-full flex items-center justify-center gap-1 rounded-full text-[10px] py-1.5"
                    style={{ backgroundColor: buttonPrimaryBackgroundColor, color: buttonPrimaryTextColor }}
                  >
                    <ShoppingCartIcon className="w-3 h-3" />
                    Add to Cart
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="rounded-full text-[10px] py-1.5 border"
                    style={{
                      backgroundColor: buttonSecondaryBackgroundColor,
                      color: buttonSecondaryTextColor,
                      borderColor: buttonSecondaryBorderColor,
                    }}
                  >
                    Buy Now
                  </button>
                  <button className="rounded-full text-[10px] py-1.5 bg-neutral-100 text-neutral-700">
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
        <p className="text-xs text-gray-500">Preview updates in real-time as you change colors</p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted underline-offset-2 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
