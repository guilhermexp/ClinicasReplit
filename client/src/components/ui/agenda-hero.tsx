import * as React from "react"
import { cn } from "@/lib/utils"
import { Mockup, MockupFrame } from "@/components/ui/mockup"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, ArrowRight } from "lucide-react"

interface AgendaHeroProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode
  subtitle?: string
  eyebrow?: string
  ctaText?: string
  ctaAction?: () => void
  children?: React.ReactNode
}

const AgendaHero = React.forwardRef<HTMLDivElement, AgendaHeroProps>(
  ({ className, title, subtitle, eyebrow, ctaText, ctaAction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center glass-card backdrop-blur-md", className)}
        {...props}
      >
        <div className="w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {eyebrow && (
            <p 
              className="font-medium uppercase tracking-wide text-center text-base mb-3 text-primary/80 animate-appear opacity-0"
            >
              {eyebrow}
            </p>
          )}

          <h1 
            className="text-4xl md:text-5xl leading-tight text-center px-4 gradient-text font-bold animate-appear opacity-0 delay-100 mb-4"
          >
            {title}
          </h1>

          {subtitle && (
            <p 
              className="text-lg md:text-xl text-center font-light px-4 md:px-16 lg:px-24 mt-2 mb-8 text-muted-foreground animate-appear opacity-0 delay-300"
            >
              {subtitle}
            </p>
          )}

          {ctaText && ctaAction && (
            <div className="flex justify-center mb-8">
              <Button 
                onClick={ctaAction}
                className="bg-gradient-to-r from-[hsl(var(--primary-start))] to-[hsl(var(--primary-end))] shadow-md hover:shadow-lg transition-all animate-appear opacity-0 delay-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>{ctaText}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {children && (
            <div className="mt-10 w-full animate-appear opacity-0 delay-700">
              <MockupFrame>
                <Mockup type="responsive">
                  {children}
                </Mockup>
              </MockupFrame>
              <div
                className="absolute bottom-0 left-0 right-0 w-full h-12"
                style={{
                  background: "linear-gradient(to top, hsla(var(--background), 0.9) 0%, hsla(var(--background), 0) 100%)",
                  zIndex: 10,
                }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }
)
AgendaHero.displayName = "AgendaHero"

export { AgendaHero }