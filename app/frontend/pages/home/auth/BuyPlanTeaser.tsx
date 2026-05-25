import { ShoppingCart, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useBuyPlan } from '../../../hooks/useBuyPlanQueries'
import { StockLogo } from '../../../components/StockLogo'
import { Card, CardContent } from '@/components/ui/card'

// Top 3 next-picks from the user's buy plan. Hidden when the cart is
// empty so the dashboard doesn't show a permanent dead block.
export function BuyPlanTeaser() {
  const { t } = useTranslation()
  const { data, isLoading } = useBuyPlan()

  if (isLoading) return null
  const items = data?.items ?? []
  if (items.length === 0) return null

  const top = items.slice(0, 3)

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-gradient-violet-fuchsia text-white">
              <ShoppingCart className="size-4" />
            </span>
            <h3 className="text-sm font-semibold">
              {t('home.dashboard.buyPlanTeaser.title')}
            </h3>
          </div>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {t('home.dashboard.buyPlanTeaser.viewAll')} <ArrowRight className="size-3" />
          </Link>
        </div>

        <ul className="divide-y">
          {top.map((item) => (
            <li key={item.stockId} className="flex items-center gap-3 py-2">
              <StockLogo symbol={item.symbol} name={item.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold">{item.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{item.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {item.quantity} × {item.formattedPrice}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {item.formattedSubtotal}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default BuyPlanTeaser
