import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CompactStockRow } from '../../../components/CompactStockRow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Stock } from '../../../types'

interface Props {
  title: string
  data: Stock[] | undefined
  isLoading: boolean
  error: unknown
  limit?: number
}

// DRY wrapper for the trio of community stock lists on the home page
// (most-added, most-held, last-added). Was duplicated three times in the
// old monolithic HomePage; centralising loading / error / empty states
// keeps the trio in lockstep.
export function StockListCard({ title, data, isLoading, error, limit = 5 }: Props) {
  const { t } = useTranslation()
  const items = data?.slice(0, limit)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-1 h-5 bg-foreground rounded-full"></span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground text-sm">{t('common.loading')}</span>
          </div>
        )}

        {error != null && (
          <Alert variant="destructive">
            <AlertDescription>
              {error instanceof Error ? error.message : t('common.failedToLoad')}
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && (!items || items.length === 0) && (
          <p className="text-muted-foreground text-center py-6 text-sm">
            {t('common.noStocksFound')}
          </p>
        )}

        {!isLoading && !error && items && items.length > 0 && (
          <div className="divide-y">
            {items.map((stock) => (
              <CompactStockRow key={stock.id} stock={stock} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StockListCard
