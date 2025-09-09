import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Handle browser extension modifications that cause hydration issues
  React.useEffect(() => {
    if (inputRef.current) {
      // Remove any attributes added by browser extensions that cause hydration mismatches
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            const target = mutation.target as HTMLInputElement
            // Remove common browser extension attributes that cause hydration issues
            if (target.hasAttribute('fdprocessedid')) {
              target.removeAttribute('fdprocessedid')
            }
          }
        })
      })

      observer.observe(inputRef.current, {
        attributes: true,
        attributeFilter: ['fdprocessedid', 'data-lastpass-icon-root', 'data-1password-ignore']
      })

      return () => observer.disconnect()
    }
  }, [])

  return (
    <input
      ref={inputRef}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
