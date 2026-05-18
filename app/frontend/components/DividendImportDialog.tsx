import { useState } from 'react'
import { Loader2, Upload, AlertCircle, CheckCircle2, Info, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { StockSearchInput } from './StockSearchInput'
import { useDividendImportPreview, useDividendImportApply } from '../hooks/useDividendsQueries'
import type { DividendImportPreview, DividendImportRow, DividendImportResult } from '../lib/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Stage = 'pick' | 'review' | 'done'

export function DividendImportDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const previewMutation = useDividendImportPreview()
  const applyMutation = useDividendImportApply()

  const [stage, setStage] = useState<Stage>('pick')
  const [preview, setPreview] = useState<DividendImportPreview | null>(null)
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [result, setResult] = useState<DividendImportResult | null>(null)

  const reset = () => {
    setStage('pick')
    setPreview(null)
    setMapping({})
    setResult(null)
  }

  const handleClose = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const handleFile = (file: File) => {
    previewMutation.mutate(file, {
      onSuccess: (p) => {
        setPreview(p)
        setStage('review')
      },
    })
  }

  const handleApply = () => {
    if (!preview) return
    // Bring along the still-unmatched rows when the user mapped them.
    const mappedUnmatched: DividendImportRow[] = preview.unmatched
      .filter((r) => mapping[r.ticker])
      .map((r) => ({ ...r, stock_id: mapping[r.ticker] }))

    applyMutation.mutate(
      { rows: [ ...preview.resolved, ...mappedUnmatched ], mapping },
      {
        onSuccess: (r) => {
          setResult(r)
          setStage('done')
        },
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>{t('dividends.importTitle')}</SheetTitle>
          <SheetDescription>{t('dividends.importDescription')}</SheetDescription>
        </SheetHeader>

        {stage === 'pick' && (
          <div className="p-6 space-y-4">
            <div className="rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-medium">{t('dividends.importIbkrPathLabel')}</p>
                  <p className="font-mono text-muted-foreground">{t('dividends.importIbkrPathEn')}</p>
                  <p className="font-mono text-muted-foreground">{t('dividends.importIbkrPathEs')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t border-blue-200/50 dark:border-blue-900/50">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{t('dividends.importPrivacyHint')}</p>
              </div>
            </div>

            <label className="block border-2 border-dashed border-input rounded-lg p-8 text-center cursor-pointer hover:border-foreground/40">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
              <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">{t('dividends.importPickFile')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dividends.importHint')}</p>
            </label>

            {previewMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t('dividends.importParsing')}
              </div>
            )}

            {previewMutation.error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{(previewMutation.error as Error).message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {stage === 'review' && preview && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{preview.resolved.length}</p>
                <p className="text-xs text-muted-foreground">{t('dividends.importMatched')}</p>
              </div>
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{preview.unmatched.length}</p>
                <p className="text-xs text-muted-foreground">{t('dividends.importUnmatched')}</p>
              </div>
              <div className="p-3 rounded-md bg-muted/40">
                <p className="text-2xl font-bold">{preview.skipped.length}</p>
                <p className="text-xs text-muted-foreground">{t('dividends.importSkipped')}</p>
              </div>
            </div>

            {preview.resolved.length > 0 && (
              <details className="border rounded-md">
                <summary className="px-3 py-2 cursor-pointer text-sm font-medium">
                  {t('dividends.importReviewMatched', { count: preview.resolved.length })}
                </summary>
                <ul className="px-3 py-2 max-h-64 overflow-y-auto text-xs space-y-1">
                  {preview.resolved.map((r, i) => (
                    <li key={i} className="flex justify-between gap-2 font-mono">
                      <span>{r.date} {r.ticker} {r.stock_symbol && r.stock_symbol !== r.ticker && `→ ${r.stock_symbol}`}</span>
                      <span>{r.amount} {r.currency}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {preview.unmatched.length > 0 && (
              <div className="border rounded-md">
                <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 text-sm font-medium">
                  {t('dividends.importMapPrompt')}
                </div>
                <div className="divide-y">
                  {preview.unmatched.map((row, i) => (
                    <div key={i} className="p-3 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-sm font-semibold">{row.ticker}</span>
                        <span className="text-xs text-muted-foreground">ISIN: {row.isin}</span>
                        <span className="text-xs">{row.amount} {row.currency}</span>
                      </div>
                      {mapping[row.ticker] ? (
                        <div className="flex items-center justify-between gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded">
                          <Badge variant="success">{t('dividends.importMapped')}</Badge>
                          <Button variant="ghost" size="xs" onClick={() => setMapping(({ [row.ticker]: _drop, ...rest }) => rest)}>
                            {t('common.clear')}
                          </Button>
                        </div>
                      ) : (
                        <StockSearchInput
                          value={null}
                          onSelect={(s) => setMapping((m) => ({ ...m, [row.ticker]: s.id }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {applyMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>{(applyMutation.error as Error).message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {stage === 'done' && result && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <CheckCircle2 className="size-12 text-emerald-600" />
              <p className="font-semibold text-lg">{t('dividends.importDoneTitle')}</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{t('dividends.importDoneCreated', { count: result.created })}</p>
                <p>{t('dividends.importDoneUpdated', { count: result.updated })}</p>
                {result.skipped > 0 && <p>{t('dividends.importDoneSkipped', { count: result.skipped })}</p>}
              </div>
            </div>
          </div>
        )}

        <SheetFooter className="p-6 border-t">
          {stage === 'review' && (
            <Button onClick={handleApply} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : t('dividends.importConfirm')}
            </Button>
          )}
          {stage === 'done' && (
            <Button onClick={() => handleClose(false)}>{t('common.close', 'Close')}</Button>
          )}
          {stage !== 'done' && (
            <Button variant="outline" onClick={() => handleClose(false)}>{t('common.cancel')}</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
