import { useState } from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import type { RadarStock } from '../types'
import { useBuyPlanContext } from '../contexts/BuyPlanContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddToCartButtonProps {
  stock: RadarStock
}

export function AddToCartButton({ stock }: AddToCartButtonProps) {
  const { items, addToCart, updateQuantity, removeFromCart } = useBuyPlanContext()
  const [localQuantity, setLocalQuantity] = useState(1)

  const cartItem = items.find((item) => item.stockId === stock.id)
  const isInCart = !!cartItem

  const handleAdd = () => {
    addToCart(stock, localQuantity)
    setLocalQuantity(1)
  }

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(stock.id, cartItem.quantity + 1)
    }
  }

  const handleDecrement = () => {
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(stock.id, cartItem.quantity - 1)
    }
  }

  const handleRemove = () => {
    removeFromCart(stock.id)
  }

  if (isInCart) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDecrement}
            disabled={cartItem.quantity <= 1}
            className="rounded-none"
          >
            <Minus className="size-3" />
          </Button>
          <span className="w-10 text-center text-sm font-medium text-foreground">
            {cartItem.quantity}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleIncrement}
            className="rounded-none"
          >
            <Plus className="size-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleRemove}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Remove from cart"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="1"
        value={localQuantity}
        onChange={(e) => setLocalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-16 text-center text-sm h-8"
      />
      <Button size="sm" onClick={handleAdd}>
        <Plus className="size-4" />
        <span className="hidden sm:inline">Add</span>
      </Button>
    </div>
  )
}
