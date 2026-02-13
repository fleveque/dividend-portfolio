import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Check } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTopScoredStocks } from '../hooks/useStockQueries'
import { useAuth } from '../contexts/AuthContext'
import { useAddStock } from '../hooks/useRadarQueries'
import { useQuery } from '@tanstack/react-query'
import { radarApi } from '../lib/api'
import StockCard from './StockCard'

const AUTO_ADVANCE_MS = 5000

function AddToRadarButton({ stockId }: { stockId: number }) {
  const { isAuthenticated } = useAuth()
  const addStock = useAddStock()

  const { data: radar } = useQuery({
    queryKey: ['radar'],
    queryFn: radarApi.get,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  })

  if (!isAuthenticated) return null

  const inRadar = radar?.stocks.some((s) => s.id === stockId) ?? false

  return (
    <Button
      variant={inRadar ? 'secondary' : 'default'}
      size="sm"
      disabled={inRadar || addStock.isPending}
      onClick={() => addStock.mutate(stockId)}
      className="w-full mt-3 cursor-pointer"
    >
      {addStock.isPending ? (
        <Loader2 className="size-4 animate-spin mr-2" />
      ) : inRadar ? (
        <Check className="size-4 mr-2" />
      ) : (
        <Plus className="size-4 mr-2" />
      )}
      {inRadar ? 'In Radar' : 'Add to Radar'}
    </Button>
  )
}

export function TopScoredShowcase() {
  const { data: stocks, isLoading } = useTopScoredStocks()
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!stocks || stocks.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-6 text-sm">
        No top scored stocks available.
      </p>
    )
  }

  return (
    <div
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
    >
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <span className="w-1 h-5 bg-foreground rounded-full"></span>
        Top Dividend Scores
      </h3>

      <Carousel opts={{ loop: true }} setApi={setApi}>
        <CarouselContent>
          {stocks.map((stock) => (
            <CarouselItem key={stock.id}>
              <StockCard stock={stock} />
              <AddToRadarButton stockId={stock.id} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot navigation */}
      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            aria-label={`Go to stock ${i + 1}`}
            onClick={() => scrollTo(i)}
            className={cn(
              'h-2 rounded-full transition-all duration-300 cursor-pointer',
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

export default TopScoredShowcase
