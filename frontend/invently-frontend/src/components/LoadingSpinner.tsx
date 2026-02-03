import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const dotClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5'
  };

  const gapClasses = {
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2.5'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className={`inline-flex items-center ${gapClasses[size]}`}>
        <span className={`rounded-full bg-neutral-900/70 ${dotClasses[size]} animate-[pulse_1.1s_ease-in-out_infinite]`} />
        <span className={`rounded-full bg-neutral-900/70 ${dotClasses[size]} animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:200ms]`} />
        <span className={`rounded-full bg-neutral-900/70 ${dotClasses[size]} animate-[pulse_1.1s_ease-in-out_infinite] [animation-delay:400ms]`} />
      </div>
    </div>
  );
};

export default LoadingSpinner;