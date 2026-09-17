'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-800 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl font-sans text-sm',
          description: 'group-[.toast]:text-slate-400 text-xs',
          actionButton:
            'group-[.toast]:bg-emerald-500 group-[.toast]:text-slate-950 font-semibold',
          cancelButton:
            'group-[.toast]:bg-slate-800 group-[.toast]:text-slate-300',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
