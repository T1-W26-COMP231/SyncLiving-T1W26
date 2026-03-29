import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'published' | 'draft' | 'paused' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const baseStyle = "px-3 py-1 text-xs font-semibold rounded-full";

  const variants = {
    published: "bg-[#e5fcf9] text-[#00a396]",
    draft:     "bg-gray-200 text-gray-700",
    paused:    "bg-amber-100 text-amber-700",
    default:   "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
