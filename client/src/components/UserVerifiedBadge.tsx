import React from 'react';
import { cn } from '@/lib/utils';

interface UserVerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4', 
  lg: 'w-5 h-5'
};

/**
 * User verification badge component using the store verified shopping SVG
 * Specifically designed for user profile verification indicators
 */
export function UserVerifiedBadge({ 
  className = '', 
  size = 'sm'
}: UserVerifiedBadgeProps) {
  return (
    <svg 
      className={cn(sizeClasses[size], 'text-secondary', className)}
      viewBox="0 0 24 24" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Store Verified Shopping Icon - SVG content from SVG Repo */}
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#3B82F6"/>
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Store building base */}
      <rect x="8" y="14" width="8" height="6" fill="#3B82F6" rx="1"/>
      <rect x="10" y="16" width="4" height="4" fill="white" rx="0.5"/>
    </svg>
  );
}

export default UserVerifiedBadge;