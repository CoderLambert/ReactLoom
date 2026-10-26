import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva,type VariantProps} from 'class-variance-authority';
import {clsx,type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

function cn(...args:ClassValue[]){return twMerge(clsx(args));}
const buttonVariants=cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {variants:{
    variant:{
      default:'bg-emerald-800 text-white hover:bg-emerald-700',
      secondary:'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
      outline:'border border-emerald-500 bg-white text-emerald-900 hover:bg-emerald-50',
      destructive:'bg-red-700 text-white hover:bg-red-800',
    },
    size:{default:'h-10 px-4 py-2',sm:'h-8 px-3',lg:'h-12 px-6'},
  },defaultVariants:{variant:'default',size:'default'}}
);
type ButtonProps=React.ComponentPropsWithRef<'button'> &
  VariantProps<typeof buttonVariants> & {asChild?:boolean};
function Button({className,variant,size,asChild=false,ref,...props}:ButtonProps){
  const Component=asChild?Slot:'button';
  return <Component data-slot="button" className={cn(buttonVariants({variant,size}),className)} ref={ref} {...props}/>;
}
export {Button,buttonVariants,cn};
