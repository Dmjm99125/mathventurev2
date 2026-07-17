import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'jungle' | 'danger' | 'secondary', size?: 'sm' | 'md' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none hover-elevate active-elevate-2",
          {
            'bg-primary text-primary-foreground shadow-md hover:bg-primary/90': variant === 'default',
            'bg-jungle-orange text-white shadow-md hover:bg-jungle-orange/90': variant === 'jungle',
            'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90 border border-secondary-border': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90': variant === 'danger',
            'h-9 px-4 text-sm': size === 'sm',
            'h-11 px-6 text-base': size === 'md',
            'h-14 px-8 text-lg rounded-2xl': size === 'lg',
            'h-11 w-11 p-2': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-base font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground", className)}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-2xl border-2 border-card-border bg-card text-card-foreground shadow-sm", className)} {...props} />
  )
);
Card.displayName = 'Card';

export const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'outline' | 'jungle' }>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div ref={ref} className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
      'border-transparent bg-primary text-primary-foreground': variant === 'default',
      'border-transparent bg-secondary text-secondary-foreground': variant === 'secondary',
      'border-transparent bg-jungle-yellow text-jungle-green': variant === 'jungle',
      'text-foreground': variant === 'outline',
    }, className)} {...props} />
  )
);
Badge.displayName = 'Badge';
