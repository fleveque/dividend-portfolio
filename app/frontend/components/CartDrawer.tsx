import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Trash2, Loader2, Briefcase } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBuyPlanContext } from '../contexts/BuyPlanContext'
import { useImportFromCart } from '../hooks/useHoldingsQueries'
import { StockLogo } from './StockLogo'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { t } = useTranslation()
  const {
    items,
    totalItems,
    formattedTotal,
    isDirty,
    isSaving,
    updateQuantity,
    removeFromCart,
    saveCart,
    resetCart,
    exitBuyPlanMode,
  } = useBuyPlanContext()

  const importFromCart = useImportFromCart()

  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDoneDialog, setShowDoneDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)

  const handleSave = async () => {
    await saveCart()
  }

  const handleReset = async () => {
    await resetCart()
    setShowResetDialog(false)
  }

  const handleDone = () => {
    if (isDirty) {
      setShowDoneDialog(true)
    } else {
      exitBuyPlanMode()
      onClose()
    }
  }

  const handleDoneSave = async () => {
    await saveCart()
    exitBuyPlanMode()
    onClose()
    setShowDoneDialog(false)
  }

  const handleDoneDiscard = () => {
    exitBuyPlanMode()
    onClose()
    setShowDoneDialog(false)
  }

  const handleIncrement = (stockId: number, currentQty: number) => {
    updateQuantity(stockId, currentQty + 1)
  }

  const handleDecrement = (stockId: number, currentQty: number) => {
    if (currentQty > 1) {
      updateQuantity(stockId, currentQty - 1)
    }
  }

  const handleMoveToPortfolio = async () => {
    const cartItems = items.map((item) => ({
      stock_id: item.stockId,
      quantity: item.quantity,
    }))
    await importFromCart.mutateAsync(cartItems)
    await resetCart()
    exitBuyPlanMode()
    onClose()
    setShowMoveDialog(false)
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent side="bottom" className="max-h-[85vh] flex flex-col rounded-t-2xl safe-area-bottom" showCloseButton={true}>
          <SheetHeader>
            <SheetTitle>{t('cart.title')}</SheetTitle>
            <SheetDescription className="sr-only">{t('cart.description')}</SheetDescription>
          </SheetHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="size-12 mx-auto mb-3" />
                <p>{t('cart.emptyTitle')}</p>
                <p className="text-sm mt-1">{t('cart.emptyDescription')}</p>
              </div>
            ) : (
              items.map((item) => (
                <Card key={item.stockId}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="shrink-0">
                        <StockLogo symbol={item.symbol} name={item.name} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm">{item.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate" title={item.name}>{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.formattedPrice} × {item.quantity} = {item.formattedSubtotal}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => handleDecrement(item.stockId, item.quantity)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => handleIncrement(item.stockId, item.quantity)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeFromCart(item.stockId)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-1"
                          title={t('common.remove')}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <SheetFooter className="flex-col gap-3">
            {items.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('cart.totalShares', { count: totalItems })}
                  </span>
                  <span className="font-bold text-foreground text-lg">{formattedTotal}</span>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!isDirty || isSaving} className="flex-1">
                {isSaving ? (
                  <><Loader2 className="size-4 animate-spin" /> {t('common.saving')}</>
                ) : isDirty ? t('cart.saveCart') : t('common.saved')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                disabled={items.length === 0 || isSaving}
                className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                {t('cart.reset')}
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowMoveDialog(true)}
              disabled={items.length === 0 || isSaving || importFromCart.isPending}
              className="w-full"
            >
              {importFromCart.isPending ? (
                <><Loader2 className="size-4 animate-spin" /> {t('cart.moving')}</>
              ) : (
                <><Briefcase className="size-4" /> {t('cart.moveToPortfolio')}</>
              )}
            </Button>

            <Button variant="outline" onClick={handleDone} className="w-full">
              {t('cart.donePlanning')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cart.resetTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cart.resetDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive text-white hover:bg-destructive/90">
              {t('cart.reset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Done with unsaved changes Dialog */}
      <AlertDialog open={showDoneDialog} onOpenChange={setShowDoneDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cart.unsavedTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cart.unsavedDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDoneDiscard}>{t('cart.discard')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDoneSave}>{t('cart.saveAndExit')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move to Portfolio Confirmation Dialog */}
      <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cart.moveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cart.moveDescription', { count: totalItems })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveToPortfolio}>
              {t('cart.moveToPortfolio')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
