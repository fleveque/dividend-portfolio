import { useState } from 'react'
import { Check, Copy, ExternalLink, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfileQueries'
import { Button } from '@/components/ui/button'

export function PulseShareButton() {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useProfile()
  const [copied, setCopied] = useState(false)

  if (isLoading) return null

  const slug = profile?.portfolioSlug
  if (!slug) {
    return (
      <Link
        to="/settings#portfolio-sharing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:underline"
      >
        <Activity className="size-4 text-purple-600 dark:text-purple-400" />
        {t('portfolio.shareOnPulseHint')}
      </Link>
    )
  }

  const url = `https://pulse.quantic.es/p/${slug}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can fail outside HTTPS / when permission denied — silently
      // fall back to the "View on Pulse" link.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
      >
        {copied ? (
          <>
            <Check className="size-3.5" /> {t('portfolio.shareLinkCopied')}
          </>
        ) : (
          <>
            <Copy className="size-3.5" /> {t('portfolio.copyShareLink')}
          </>
        )}
      </Button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:underline"
      >
        {t('portfolio.viewOnPulse')} <ExternalLink className="size-3" />
      </a>
    </div>
  )
}

export default PulseShareButton
