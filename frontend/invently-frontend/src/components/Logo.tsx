import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  theme = 'dark',
  className = '' 
}) => {
  const sizes = {
    sm: { height: 32 },
    md: { height: 50 },
    lg: { height: 60 },
    xl: { height: 70 }
  };

  const currentSize = sizes[size];

  if (variant === 'icon') {
    return (
      <div className={className}>
        <img 
          src="/favicon.svg" 
          alt="Shopu Logo"
          height={currentSize.height}
          className="h-auto"
          style={{ height: `${currentSize.height}px` }}
        />
      </div>
    );
  }

  if (variant === 'wordmark') {
    // For wordmark, just use text
    const textColor = theme === 'dark' ? 'text-gray-900' : 'text-white';
    const subtleColor = theme === 'dark' ? 'text-gray-400' : 'text-white/60';
    const textSize = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-4xl';
    
    return (
      <div className={className}>
        <span className={`font-bold ${textSize} tracking-tight`}>
          <span className={textColor}>Shopu</span>
          <span className={subtleColor}>.ge</span>
        </span>
      </div>
    );
  }

  // Full logo: use the SVG with icon + text
  return (
    <div className={className}>
      <img 
        src="/shopu-logo.svg" 
        alt="Shopu.ge"
        height={currentSize.height}
        className="h-auto"
        style={{ height: `${currentSize.height}px` }}
      />
    </div>
  );
};

export default Logo;
