import * as React from 'react';

export const Button = React.forwardRef(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 ${className}`}
      {...props}
    />
  )
);
Button.displayName = 'Button';
