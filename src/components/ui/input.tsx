import React from 'react'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({className='', ...props}, ref) => (
  <input ref={ref} className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 ${className}`} {...props} />
))
Input.displayName = 'Input'
export default Input
