import * as React from "react";
import { cva } from "class-variance-authority";
import { X, CheckCircle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = React.forwardRef(({ ...props }, ref) => (
  <div
    ref={ref}
    className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    {...props}
  />
));
ToastProvider.displayName = "ToastProvider";

const ToastViewport = React.forwardRef(({ ...props }, ref) => (
  <div
    ref={ref}
    className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full flex-col items-center justify-center space-y-3 overflow-hidden rounded-2xl bg-white border-0 p-6 shadow-xl transition-all max-w-sm mx-auto text-center data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "bg-white",
        success: "bg-white",
        info: "bg-white",
        warning: "bg-white",
        error: "bg-white",
        destructive: "bg-white"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef(({ className, variant, onOpenChange, open, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      data-state={open ? "open" : "closed"}
      data-open={open}
      {...props}
    />
  );
});
Toast.displayName = "Toast";

const ToastIcon = React.forwardRef(({ variant, className, ...props }, ref) => {
  const icons = {
    success: CheckCircle,
    info: Info,
    warning: AlertCircle,
    error: AlertCircle,
    destructive: AlertCircle,
  };

  const colors = {
    success: 'bg-blue-100 text-blue-600',
    info: 'bg-blue-100 text-blue-600',
    warning: 'bg-red-100 text-red-600',
    error: 'bg-red-100 text-red-600',
    destructive: 'bg-red-100 text-red-600',
  };

  const Icon = icons[variant] || Info;
  const colorClass = colors[variant] || colors.info;

  return (
    <div
      ref={ref}
      className={cn(
        "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2",
        colorClass,
        className
      )}
      {...props}
    >
      <Icon className="w-8 h-8" />
    </div>
  );
});
ToastIcon.displayName = "ToastIcon";

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-10 w-full shrink-0 items-center justify-center rounded-full bg-[#2987CD] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2987CD]/90 focus:outline-none focus:ring-2 focus:ring-[#2987CD] focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute left-2 top-2 z-10 rounded-md p-1 text-gray-400 opacity-70 transition-opacity hover:text-gray-600 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 cursor-pointer",
      className
    )}
    toast-close=""
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick?.(e);
    }}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));
ToastClose.displayName = "ToastClose";

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-bold text-gray-900", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

const ToastSecondaryAction = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2",
      className
    )}
    {...props}
  />
));
ToastSecondaryAction.displayName = "ToastSecondaryAction";

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastIcon,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastSecondaryAction,
}; 