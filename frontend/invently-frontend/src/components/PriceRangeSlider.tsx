import React, { useState, useEffect } from 'react';

interface PriceRangeSliderProps {
  minPrice?: number;
  maxPrice?: number;
  value: { min: string; max: string };
  onChange: (min: string, max: string) => void;
  className?: string;
}

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  minPrice = 0,
  maxPrice = 1000,
  value,
  onChange,
  className = ''
}) => {
  const [sliderValues, setSliderValues] = useState([minPrice, maxPrice]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  // Convert string values to numbers for slider
  const minValue = parseFloat(value.min) || minPrice;
  const maxValue = parseFloat(value.max) || maxPrice;

  // Update slider values when external value changes or maxPrice changes
  useEffect(() => {
    if (!isDragging) {
      // If no values are set, use the full range
      if (!value.min && !value.max) {
        setSliderValues([minPrice, maxPrice]);
      } else {
        setSliderValues([minValue, maxValue]);
      }
    }
  }, [minValue, maxValue, isDragging, minPrice, maxPrice, value.min, value.max]);

  // Reset slider values when maxPrice changes significantly
  useEffect(() => {
    console.log('PriceRangeSlider maxPrice changed:', maxPrice, 'current slider max:', sliderValues[1]);
    if (maxPrice !== sliderValues[1] && !isDragging) {
      // If current max value exceeds new maxPrice, reset to new range
      if (sliderValues[1] > maxPrice) {
        console.log('Resetting slider to new range:', minPrice, '-', maxPrice);
        setSliderValues([minPrice, maxPrice]);
        onChange(minPrice.toString(), maxPrice.toString());
      }
    }
  }, [maxPrice, minPrice, isDragging]);

  const handleSliderChange = (newValues: number[]) => {
    setSliderValues(newValues);
    onChange(newValues[0].toString(), newValues[1].toString());
  };

  const handleSliderCommit = () => {
    setIsDragging(false);
    setDragIndex(null);
  };

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return minPrice;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return minPrice + percentage * (maxPrice - minPrice);
  };

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragIndex(index);
  };

  const handleTouchStart = (index: number) => (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragIndex(index);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || dragIndex === null) return;

    const newValue = getValueFromPosition(clientX);
    const newValues = [...sliderValues];
    newValues[dragIndex] = Math.round(newValue);
    
    // Ensure min doesn't exceed max and vice versa
    if (dragIndex === 0) {
      newValues[0] = Math.min(newValues[0], newValues[1] - 1);
    } else {
      newValues[1] = Math.max(newValues[1], newValues[0] + 1);
    }
    
    handleSliderChange(newValues);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseUp = () => {
    handleSliderCommit();
  };

  const handleTouchEnd = () => {
    handleSliderCommit();
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Don't handle track clicks while dragging
    
    const newValue = getValueFromPosition(e.clientX);
    const newValues = [...sliderValues];
    
    // Determine which thumb to move based on which is closer
    const distanceToMin = Math.abs(newValue - newValues[0]);
    const distanceToMax = Math.abs(newValue - newValues[1]);
    
    if (distanceToMin < distanceToMax) {
      newValues[0] = Math.round(newValue);
      if (newValues[0] >= newValues[1]) {
        newValues[0] = newValues[1] - 1;
      }
    } else {
      newValues[1] = Math.round(newValue);
      if (newValues[1] <= newValues[0]) {
        newValues[1] = newValues[0] + 1;
      }
    }
    
    handleSliderChange(newValues);
  };

  // Add global mouse and touch events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragIndex, sliderValues]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getSliderPercentage = (val: number) => {
    return ((val - minPrice) / (maxPrice - minPrice)) * 100;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
          Price Range
        </h3>
      </div>

      {/* Slider */}
      <div className="space-y-3">
          {/* Price Display */}
          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>{formatPrice(sliderValues[0])}</span>
            <span>{formatPrice(sliderValues[1])}</span>
          </div>

          {/* Custom Slider */}
          <div ref={sliderRef} className="relative h-6 cursor-pointer">
            {/* Track */}
            <div 
              className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full transform -translate-y-1/2 cursor-pointer"
              onClick={handleTrackClick}
            />
            
            {/* Active Range */}
            <div
              className="absolute top-1/2 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transform -translate-y-1/2"
              style={{
                left: `${getSliderPercentage(sliderValues[0])}%`,
                width: `${getSliderPercentage(sliderValues[1]) - getSliderPercentage(sliderValues[0])}%`,
              }}
            />

            {/* Thumbs */}
            <div
              className={`absolute top-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 transition-transform ${
                isDragging && dragIndex === 0 ? 'scale-110 shadow-xl' : 'hover:scale-110'
              }`}
              style={{ left: `calc(${getSliderPercentage(sliderValues[0])}% - 10px)` }}
              onMouseDown={handleMouseDown(0)}
              onTouchStart={handleTouchStart(0)}
            />
            <div
              className={`absolute top-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-pointer transform -translate-y-1/2 transition-transform ${
                isDragging && dragIndex === 1 ? 'scale-110 shadow-xl' : 'hover:scale-110'
              }`}
              style={{ left: `calc(${getSliderPercentage(sliderValues[1])}% - 10px)` }}
              onMouseDown={handleMouseDown(1)}
              onTouchStart={handleTouchStart(1)}
            />
          </div>
        </div>
    </div>
  );
};

export default PriceRangeSlider;
