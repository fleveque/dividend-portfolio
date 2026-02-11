import { LayoutGrid, List } from 'lucide-react'
import { useViewPreference } from '../contexts/ViewPreferenceContext'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ViewToggle() {
  const { viewMode, setViewMode } = useViewPreference()

  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      onValueChange={(value) => {
        if (value) setViewMode(value as 'card' | 'compact')
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="card" aria-label="Switch to card view">
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="compact" aria-label="Switch to compact view">
        <List className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export default ViewToggle
