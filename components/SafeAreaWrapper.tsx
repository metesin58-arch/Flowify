import React from 'react';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * SafeAreaWrapper ensures that the content is not obscured by hardware features 
 * like notches, home indicators, or status bars on modern mobile devices.
 * Updated to use native CSS env() variables directly.
 */
export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ children, className = "" }) => {
  return (
    <div 
      className={`flex-1 flex flex-col overflow-hidden w-full h-full relative ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {children}
    </div>
  );
};