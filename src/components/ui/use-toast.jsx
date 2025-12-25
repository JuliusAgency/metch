import { toast as sonnerToast } from "sonner"

function toast({ title, description, variant, ...props }) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      ...props,
    })
  }
  if (variant === "success") {
    return sonnerToast.success(title, {
      description,
      ...props,
    })
  }
  return sonnerToast(title, {
    description,
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