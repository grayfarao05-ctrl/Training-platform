import React from 'react';

export const ITREAL_LOGO_PATH = '/assets/itreal-logo.png';
export const ITREAL_ICON_PATH = '/assets/itreal-icon.png';

interface ITrealLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ITrealMark: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 40 
}) => {
  return (
    <img
      src={ITREAL_ICON_PATH}
      alt="ITreal"
      style={{ maxHeight: size ? `${size}px` : undefined, maxWidth: size ? `${size}px` : undefined }}
      className={`w-auto h-auto object-contain select-none drop-shadow-[0_0_20px_rgba(99,102,241,0.4)] ${className}`}
      loading="eager"
    />
  );
};

export const ITrealLogo: React.FC<ITrealLogoProps> = ({ 
  className = '', 
  size = 'md' 
}) => {
  const sizeClasses = {
    xs: 'h-6 max-w-[130px]',
    sm: 'h-8 md:h-9 max-w-[170px]',
    md: 'h-11 md:h-12 max-w-[230px]',
    lg: 'h-14 md:h-16 max-w-[300px]',
    xl: 'h-20 md:h-24 max-w-[420px]'
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={ITREAL_LOGO_PATH}
        alt="ITreal - Real knowledge. Real steps. Real opportunities."
        className={`${sizeClasses[size]} w-auto object-contain drop-shadow-[0_0_24px_rgba(99,102,241,0.32)] transition-all`}
        loading="eager"
      />
    </div>
  );
};

export default ITrealLogo;
