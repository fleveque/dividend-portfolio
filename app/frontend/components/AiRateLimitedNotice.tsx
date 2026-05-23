import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Soft inline notice rendered by AI insight cards when the user has used their
// daily LLM quota. Honest about the *why* (it costs money) without making it
// feel punitive.
export function AiRateLimitedNotice({ limit }: { limit?: number }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
      <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-1">
        <Sparkles className="size-4 text-amber-500 shrink-0" />
        {t('ai.rateLimited.title')}
      </p>
      <p className="text-sm text-muted-foreground">
        {t('ai.rateLimited.body', { limit: limit ?? 3 })}
      </p>
    </div>
  )
}
