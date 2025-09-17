import React from 'react'
export const TooltipProvider: React.FC<{children: React.ReactNode}> = ({children}) => <>{children}</>
export const Tooltip: React.FC<{children: React.ReactNode}> = ({children}) => <>{children}</>
export const TooltipTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({children, ...props}) => <div {...props}>{children}</div>
export const TooltipContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({children}) => <>{children}</>
