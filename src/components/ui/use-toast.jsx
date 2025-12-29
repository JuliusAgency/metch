import { toast as sonnerToast } from "sonner"

function toast({ title, description, variant, action, ...props }) {
  const customStyle = {
    background: '#FFFFFF',
    border: 'none',
    borderRadius: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    padding: '24px',
    textAlign: 'center',
    maxWidth: '400px',
  };

  const iconStyle = {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    margin: '0 auto 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (variant === "destructive" || variant === "error" || variant === "warning") {
    return sonnerToast.error(title, {
      description,
      style: customStyle,
      icon: '⚠️',
      ...props,
    })
  }

  if (variant === "success") {
    return sonnerToast.success(title, {
      description,
      style: customStyle,
      icon: '✓',
      ...props,
    })
  }

  if (variant === "info") {
    return sonnerToast.info(title, {
      description,
      style: customStyle,
      icon: 'ℹ',
      ...props,
    })
  }

  return sonnerToast(title, {
    description,
    style: customStyle,
    ...props,
  })
}

function useToast() {
  return {
    toast,
    dismiss: (toastId) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }