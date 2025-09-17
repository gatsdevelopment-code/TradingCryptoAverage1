import React from 'react'
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (
  <div className={`rounded-2xl border border-gray-300 dark:border-neutral-700 ${className}`} {...props} />
)
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (
  <div className={className} {...props} />
)
export default Card
