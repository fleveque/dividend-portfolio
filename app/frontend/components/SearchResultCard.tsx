import { StockLogo } from './StockLogo'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { StockSearchResult } from '../types'

interface SearchResultCardProps {
  result: StockSearchResult
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  return (
    <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <StockLogo symbol={result.symbol} name={result.name} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">{result.symbol}</h3>
            <p className="text-sm text-muted-foreground truncate" title={result.name}>
              {result.name}
            </p>
            {(result.exchange || result.type) && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {result.exchange && (
                  <Badge variant="secondary" className="text-xs">
                    {result.exchange}
                  </Badge>
                )}
                {result.type && (
                  <Badge variant="outline" className="text-xs uppercase">
                    {result.type}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SearchResultCard
