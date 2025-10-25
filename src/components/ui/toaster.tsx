"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, component, ...props }) {
        // We explicitly pick only the props that <Toast> can accept.
        // This prevents the spread of unwanted props like `searchParams` from the page.
        const toastProps = {
          variant: props.variant,
          className: props.className,
          duration: props.duration,
          onOpenChange: props.onOpenChange,
        };

        return (
          <Toast key={id} {...toastProps}>
            {component || (
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            )}
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
