import { useState, useMemo } from 'react'
import { Loader2, Plus, Upload, Trash2, Pencil, Coins } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useHoldings } from '../hooks/useHoldingsQueries'
import { useDividends, useDeleteDividend, useDividendChartData } from '../hooks/useDividendsQueries'
import { DividendFormDialog } from '../components/DividendFormDialog'
import { DividendImportDialog } from '../components/DividendImportDialog'
import { DividendChart } from '../components/DividendChart'
import { DividendLineChart } from '../components/DividendLineChart'
import { UpcomingExDividends } from '../components/UpcomingExDividends'
import { StockLogo } from '../components/StockLogo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatCurrency } from '../lib/currency'
import type { Dividend } from '../lib/api'

export function DividendsPage() {
  const { t, i18n } = useTranslation()
  const { data: dividends, isLoading, error } = useDividends()
  const { data: chartData } = useDividendChartData()
  const { data: chartDataFull } = useDividendChartData('full')
  const { data: holdingsData } = useHoldings()
  const deleteMutation = useDeleteDividend()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Dividend | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Dividend | null>(null)

  const totalsByCurrency = useMemo(() => {
    if (!dividends) return {}
    const totals: Record<string, { gross: number; tax: number; net: number; count: number }> = {}
    for (const d of dividends) {
      const t = totals[d.currency] ?? { gross: 0, tax: 0, net: 0, count: 0 }
      t.gross += d.amount
      t.tax += d.withholdingTax
      t.net += d.netAmount
      t.count += 1
      totals[d.currency] = t
    }
    return totals
  }, [dividends])

  const handleEdit = (d: Dividend) => {
    setEditing(d)
    setFormOpen(true)
  }

  const handleAddNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
              <Coins className="size-7 text-amber-600 dark:text-amber-400" />
              {t('dividends.title')}
              <Badge variant="outline" className="text-[10px] uppercase border-amber-500/40 text-amber-700 dark:text-amber-400 ml-1">
                Beta
              </Badge>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAddNew} size="sm">
                <Plus className="size-4" /> {t('dividends.add')}
              </Button>
              <Button onClick={() => setImportOpen(true)} variant="outline" size="sm">
                <Upload className="size-4" /> {t('dividends.import')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dividends && dividends.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
              {Object.keys(totalsByCurrency).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {Object.entries(totalsByCurrency).map(([currency, totals]) => (
                    <Card key={currency} className="bg-muted/30">
                      <CardContent className="p-4">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{currency}</span>
                          <span className="text-xs text-muted-foreground">{totals.count}</span>
                        </div>
                        <div className="text-xl font-bold tabular-nums">{formatCurrency(totals.net, currency)}</div>
                        <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {formatCurrency(totals.gross, currency)} − {formatCurrency(totals.tax, currency)} {t('dividends.tax').toLowerCase()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {(chartData || chartDataFull) && (
                <div className="lg:col-span-2 space-y-3">
                  {chartDataFull && chartDataFull.months.length > (chartData?.months.length ?? 0) && (
                    <DividendLineChart
                      data={chartDataFull}
                      title={t('dividends.chartTitleFull')}
                    />
                  )}
                  {chartData && (
                    <DividendChart data={chartData} title={t('dividends.chartTitle')} />
                  )}
                </div>
              )}
            </div>
          )}

          {holdingsData?.holdings && holdingsData.holdings.length > 0 && (
            <div className="mb-6">
              <UpcomingExDividends holdings={holdingsData.holdings} />
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          )}

          {dividends && dividends.length === 0 && (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <Coins className="size-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-foreground font-medium">{t('dividends.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('dividends.emptyDescription')}</p>
            </div>
          )}

          {dividends && dividends.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dividends.date')}</TableHead>
                    <TableHead>{t('dividends.stock')}</TableHead>
                    <TableHead className="text-right">{t('dividends.perShare')}</TableHead>
                    <TableHead className="text-right">{t('dividends.quantity')}</TableHead>
                    <TableHead className="text-right">{t('dividends.gross')}</TableHead>
                    <TableHead className="text-right">{t('dividends.tax')}</TableHead>
                    <TableHead className="text-right">{t('dividends.net')}</TableHead>
                    <TableHead>{t('dividends.source')}</TableHead>
                    <TableHead className="text-right">{t('dividends.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dividends.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {new Date(d.date).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockLogo symbol={d.symbol} name={d.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{d.symbol}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{d.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {d.perShareAmount != null ? formatCurrency(d.perShareAmount, d.currency) : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{d.quantity ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {formatCurrency(d.amount, d.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {d.withholdingTax > 0 ? `−${formatCurrency(d.withholdingTax, d.currency)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-semibold">
                        {formatCurrency(d.netAmount, d.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.source === 'manual' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
                          {t(`dividends.sources.${d.source}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEdit(d)}
                            title={t('common.clickToEdit')}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          {d.source === 'manual' && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setPendingDelete(d)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title={t('common.delete')}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DividendFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(null) }}
        dividend={editing}
      />

      <DividendImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dividends.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && t('dividends.deleteConfirm', {
                symbol: pendingDelete.symbol,
                date: new Date(pendingDelete.date).toLocaleDateString(i18n.language),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id)
                setPendingDelete(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DividendsPage
