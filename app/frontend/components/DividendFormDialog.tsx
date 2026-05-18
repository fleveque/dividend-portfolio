import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StockSearchInput } from './StockSearchInput'
import { useCreateDividend, useUpdateDividend } from '../hooks/useDividendsQueries'
import { CURRENCY_OPTIONS } from '@/lib/currency'
import type { Dividend } from '../lib/api'
import type { Stock } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  dividend: Dividend | null
}

export function DividendFormDialog({ open, onOpenChange, dividend }: Props) {
  const { t } = useTranslation()
  const isEdit = !!dividend
  const create = useCreateDividend()
  const update = useUpdateDividend()

  const [stock, setStock] = useState<{ id: number; symbol: string; name: string } | null>(null)
  const [date, setDate] = useState('')
  const [perShare, setPerShare] = useState('')
  const [quantity, setQuantity] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [withholding, setWithholding] = useState('')

  useEffect(() => {
    if (!open) return
    if (dividend) {
      setStock({ id: dividend.stockId, symbol: dividend.symbol, name: dividend.name })
      setDate(dividend.date)
      setPerShare(dividend.perShareAmount?.toString() ?? '')
      setQuantity(dividend.quantity?.toString() ?? '')
      setAmount(dividend.amount.toString())
      setCurrency(dividend.currency)
      setWithholding(dividend.withholdingTax.toString())
    } else {
      setStock(null)
      setDate(new Date().toISOString().slice(0, 10))
      setPerShare('')
      setQuantity('')
      setAmount('')
      setCurrency('USD')
      setWithholding('0')
    }
  }, [open, dividend])

  // Convenience: if user enters per_share AND quantity, auto-fill amount.
  useEffect(() => {
    const ps = parseFloat(perShare)
    const q = parseFloat(quantity)
    if (!isNaN(ps) && !isNaN(q) && !amount) {
      setAmount((ps * q).toFixed(4))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perShare, quantity])

  const handleSubmit = () => {
    const amt = parseFloat(amount)
    if (!stock || !date || isNaN(amt) || amt <= 0) return

    const payload = {
      date,
      perShareAmount: perShare ? parseFloat(perShare) : null,
      quantity: quantity ? parseInt(quantity, 10) : null,
      amount: amt,
      currency,
      withholdingTax: withholding ? parseFloat(withholding) : 0,
    }

    if (isEdit && dividend) {
      update.mutate({ id: dividend.id, payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      create.mutate({ ...payload, stockId: stock.id }, { onSuccess: () => onOpenChange(false) })
    }
  }

  const isPending = create.isPending || update.isPending
  const error = (create.error || update.error) as Error | undefined
  const canSubmit = !!stock && !!date && parseFloat(amount) > 0 && !isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{isEdit ? t('dividends.editTitle') : t('dividends.addTitle')}</SheetTitle>
          <SheetDescription>
            {isEdit ? t('dividends.editDescription') : t('dividends.addDescription')}
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>{t('dividends.stock')}</Label>
              <StockSearchInput
                value={stock}
                onSelect={(s: Stock) => {
                  setStock({ id: s.id, symbol: s.symbol, name: s.name })
                  // default currency to stock's listing currency
                  if (s.currency) setCurrency(s.currency)
                }}
              />
            </div>
          )}

          {isEdit && stock && (
            <div className="space-y-1 p-3 rounded-md bg-muted/40">
              <p className="text-xs text-muted-foreground">{t('dividends.stock')}</p>
              <p className="font-semibold">{stock.symbol} <span className="text-muted-foreground font-normal">— {stock.name}</span></p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">{t('dividends.date')}</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="per_share">{t('dividends.perShare')}</Label>
              <Input id="per_share" type="number" step="0.0001" min="0" value={perShare} onChange={(e) => setPerShare(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">{t('dividends.quantity')}</Label>
              <Input id="qty" type="number" step="1" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="amount">{t('dividends.gross')} *</Label>
              <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('dividends.currency')}</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax">{t('dividends.tax')}</Label>
            <Input id="tax" type="number" step="0.01" min="0" value={withholding} onChange={(e) => setWithholding(e.target.value)} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <SheetFooter className="p-6 border-t">
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : t('common.save')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
