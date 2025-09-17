import React from 'react'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline'|'secondary' }
export const Button: React.FC<Props> = ({ variant, className='', ...props }) => (
  <button
    className={`px-3 py-2 rounded-xl border text-sm shadow-sm transition ${variant==='outline'?'bg-transparent border-gray-400 dark:border-neutral-700':'bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-700'} ${className}`}
    {...props}
  />
)
export default Button
