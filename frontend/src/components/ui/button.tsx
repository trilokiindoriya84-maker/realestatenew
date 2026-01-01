
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Note: standard cva setup usually requires installing class-variance-authority
// For now I'll make a simple one or I should install cva. 
// I'll stick to simple props for now to avoid extra deps if not installed yet,
// but for "Modern Premium" usually shadcn/ui approach is best.
// I'll install class-variance-authority quickly or just write plain TS.
// Let's write plain TS with Tailwind for now to be safe, or just install cva in background.
// I'll stick to a simple clean button.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {

        const variants = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
            secondary: 'bg-slate-800 text-white hover:bg-slate-900',
            outline: 'border border-slate-200 bg-white hover:bg-slate-100 text-slate-900',
            ghost: 'hover:bg-slate-100 text-slate-700',
        };

        const sizes = {
            sm: 'h-9 px-3 text-sm',
            md: 'h-10 px-4 py-2',
            lg: 'h-11 px-8 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50',
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';

export { Button };
