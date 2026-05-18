import { useState } from 'react'
import { Loader2, Check, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStockSearch, useResolveStock } from '../hooks/useStockQueries'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Stock, StockSearchResult } from '../types'

interface Props {
  value: { id: number; symbol: string; name: string } | null
  onSelect: (stock: Stock) => void
}

// Tiny search-and-pick combobox used by the dividend form. Reuses the same
// search + resolve hooks the Portfolio "add stock" flow uses.
export function StockSearchInput({ value, onSelect }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [resolving, setResolving] = useState<string | null>(null)
  const { data: results, isLoading } = useStockSearch(submitted)
  const resolveStock = useResolveStock()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  const handlePick = async (result: StockSearchResult) => {
    setResolving(result.symbol)
    try {
      const stock = await resolveStock.mutateAsync(result.symbol)
      onSelect(stock)
      setQuery('')
      setSubmitted('')
    } finally {
      setResolving(null)
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between p-3 rounded-md bg-muted/40">
        <div>
          <p className="font-semibold">{value.symbol}</p>
          <p className="text-xs text-muted-foreground">{value.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onSelect({ ...value, id: 0, currency: '' } as unknown as Stock)}>
          {t('common.clear')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.searchPlaceholder')}
        />
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        </Button>
      </form>
      {results && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
          {results.map((r) => (
            <button
              key={r.symbol}
              type="button"
              onClick={() => handlePick(r)}
              disabled={resolving === r.symbol}
              className="w-full text-left px-3 py-2 hover:bg-muted/40 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm">{r.symbol}</p>
                <p className="text-xs text-muted-foreground truncate">{r.name}</p>
              </div>
              {resolving === r.symbol ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4 opacity-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
