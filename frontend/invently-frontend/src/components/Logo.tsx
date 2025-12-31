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
    sm: { icon: 24, text: 'text-lg', gap: 'gap-1.5' },
    md: { icon: 32, text: 'text-2xl', gap: 'gap-2' },
    lg: { icon: 40, text: 'text-3xl', gap: 'gap-2.5' },
    xl: { icon: 48, text: 'text-4xl', gap: 'gap-3' }
  };

  const currentSize = sizes[size];
  const textColor = theme === 'dark' ? 'text-gray-900' : 'text-white';
  const subtleColor = theme === 'dark' ? 'text-gray-400' : 'text-white/60';

  // Shopping bag outline mark - minimal like >_ but shopping themed
  const IconMark = () => (
    <svg 
      width={currentSize.icon} 
      height={currentSize.icon} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shopping bag shape */}
      <path
        d="M4 7h16l-1.5 12H5.5L4 7z"
        stroke="url(#bagGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Handle */}
      <path
        d="M9 7V5a3 3 0 0 1 6 0v2"
        stroke="url(#bagGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient id="bagGradient" x1="4" y1="2" x2="20" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );

  const Wordmark = () => (
    <span className={`font-bold ${currentSize.text} tracking-tight`}>
      <span className={textColor}>Shopu</span>
      <span className={subtleColor}>.ge</span>
    </span>
  );

  if (variant === 'icon') {
    return (
      <div className={className}>
        <IconMark />
      </div>
    );
  }

  if (variant === 'wordmark') {
    return (
      <div className={className}>
        <Wordmark />
      </div>
    );
  }

  // Full logo: icon + wordmark
  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      <IconMark />
      <Wordmark />
    </div>
  );
};

export default Logo;
