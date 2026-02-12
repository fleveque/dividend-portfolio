import { useCallback, useEffect, useRef, useState } from 'react'
import { Radar, CalendarDays, ShoppingCart, Smartphone } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

import radarCardsImg from '@/assets/screenshots/radar-cards.png'
import dividendCalendarImg from '@/assets/screenshots/dividend-calendar.png'
import buyPlanModeImg from '@/assets/screenshots/buy-plan-mode.png'
import mobileRadarImg from '@/assets/screenshots/mobile-radar.png'

const slides = [
  {
    icon: Radar,
    title: 'Stock Radar',
    description:
      'Track stocks with target prices, financial metrics, and status indicators.',
    image: radarCardsImg,
    mobile: false,
  },
  {
    icon: CalendarDays,
    title: 'Dividend Calendar',
    description:
      'See which stocks pay dividends each month and spot income gaps.',
    image: dividendCalendarImg,
    mobile: false,
  },
  {
    icon: ShoppingCart,
    title: 'Buy Plan Mode',
    description:
      'Plan purchases with a shopping cart — set quantities and see estimated costs.',
    image: buyPlanModeImg,
    mobile: false,
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    description:
      'Full functionality on any device with responsive design.',
    image: mobileRadarImg,
    mobile: true,
  },
] as const

const AUTO_ADVANCE_MS = 6000

export function FeatureShowcase() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const hovering = useRef(false)

  useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap())
    api.on('select', () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  // Auto-advance
  useEffect(() => {
    if (!api) return
    const id = setInterval(() => {
      if (!hovering.current) api.scrollNext()
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [api])

  const scrollTo = useCallback(
    (index: number) => api?.scrollTo(index),
    [api],
  )

  return (
    <div
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
    >
      <Carousel
        opts={{ loop: true }}
        setApi={setApi}
        className="mx-auto"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.title}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-2">
                {/* Text */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <slide.icon className="size-5" />
                    <h3 className="text-lg font-semibold">{slide.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {slide.description}
                  </p>
                </div>

                {/* Screenshot */}
                <div
                  className={cn(
                    'flex justify-center',
                    slide.mobile && 'md:justify-center',
                  )}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    loading="lazy"
                    className={cn(
                      'rounded-lg border shadow-sm',
                      slide.mobile
                        ? 'max-h-72 w-auto object-contain'
                        : 'w-full max-h-80 object-cover object-top',
                    )}
                  />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="hidden md:inline-flex" />
        <CarouselNext className="hidden md:inline-flex" />
      </Carousel>

      {/* Dot navigation */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              i === current
                ? 'w-6 bg-foreground'
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
            )}
          />
        ))}
      </div>
    </div>
  )
}

export default FeatureShowcase
