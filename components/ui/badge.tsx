import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

function getBadgeClasses(variant = "default") {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden"

  const variantClasses = {
    default: "border-transparent bg-green-700 text-white [a&]:hover:bg-green-800",
    secondary: "border-transparent bg-gray-100 text-gray-900 [a&]:hover:bg-gray-200",
    destructive:
      "border-transparent bg-red-600 text-white [a&]:hover:bg-red-700 focus-visible:ring-red-600/20 dark:focus-visible:ring-red-600/40",
    outline: "text-gray-900 [a&]:hover:bg-gray-100 [a&]:hover:text-gray-900",
  }

  return `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.default}`
}

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "secondary" | "destructive" | "outline"
  asChild?: boolean
}

function Badge({ className, variant = "default", asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  return <Comp data-slot="badge" className={cn(getBadgeClasses(variant), className)} {...props} />
}

export { Badge }
