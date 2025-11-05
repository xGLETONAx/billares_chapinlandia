import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

function getButtonClasses(variant = "default", size = "default") {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"

  const variantClasses = {
    default: "bg-green-700 text-white shadow-xs hover:bg-green-800",
    destructive:
      "bg-red-600 text-white shadow-xs hover:bg-red-700 focus-visible:ring-red-600/20 dark:focus-visible:ring-red-600/40",
    outline:
      "border bg-white shadow-xs hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700",
    secondary: "bg-gray-100 text-gray-900 shadow-xs hover:bg-gray-200",
    ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800",
    link: "text-green-700 underline-offset-4 hover:underline",
  }

  const sizeClasses = {
    default: "h-9 px-4 py-2 has-[>svg]:px-3",
    sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
    lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
    icon: "size-9",
  }

  return `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default} ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.default}`
}

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

function Button({ className, variant = "default", size = "default", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(getButtonClasses(variant, size), className)} {...props} />
}

export const buttonVariants = getButtonClasses

export { Button }
