import * as React from "react"
import { cn } from "@/lib/utils"

interface MockupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "responsive" | "tablet" | "phone" | "window"
  children: React.ReactNode
}

const Mockup = React.forwardRef<HTMLDivElement, MockupProps>(
  ({ className, type = "responsive", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-lg shadow-xl",
          {
            "aspect-video": type === "responsive",
            "aspect-[3/4] max-w-md": type === "tablet",
            "aspect-[9/16] max-w-[16rem]": type === "phone",
            "rounded-xl": type === "window",
          },
          className
        )}
        {...props}
      >
        {type === "window" && (
          <div className="absolute top-0 left-0 right-0 flex items-center p-2 space-x-1 bg-gray-800 z-10">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
        )}
        <div 
          className={cn(
            "absolute inset-0 w-full h-full overflow-auto glass-card backdrop-blur-sm",
            {
              "pt-8": type === "window"
            }
          )}
        >
          {children}
        </div>
      </div>
    )
  }
)
Mockup.displayName = "Mockup"

const MockupFrame = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      <div className="relative overflow-hidden w-full">
        {children}
      </div>
    </div>
  )
})
MockupFrame.displayName = "MockupFrame"

export { Mockup, MockupFrame }