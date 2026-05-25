import { ExternalLink, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useProfile } from '../hooks/useProfileQueries'
import { pulsePortfolioUrl, pulseRadarUrl } from '../lib/pulse'

type Kind = 'portfolio' | 'radar'

interface Props {
  kind?: Kind
}

export function PulseShareButton({ kind = 'portfolio' }: Props) {
  const { t } = useTranslation()
  const { data: profile, isLoading } = useProfile()

  if (isLoading) return null

  const slug = profile?.portfolioSlug
  const enabled = kind === 'portfolio' ? profile?.sharePortfolio : profile?.shareRadar
  const url = kind === 'portfolio' ? pulsePortfolioUrl : pulseRadarUrl
  const labelKey = kind === 'portfolio' ? 'portfolio.shareOnPulse' : 'radar.shareOnPulse'
  const hintKey = kind === 'portfolio' ? 'portfolio.shareOnPulseHint' : 'radar.shareOnPulseHint'

  if (!slug || !enabled) {
    return (
      <Link
        to="/settings#portfolio-sharing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:underline"
      >
        <Activity className="size-4 text-purple-600 dark:text-purple-400" />
        {t(hintKey)}
      </Link>
    )
  }

  return (
    <a
      href={url(slug)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-purple-700 dark:text-purple-300 hover:underline"
    >
      <Activity className="size-4" />
      {t(labelKey)}
      <ExternalLink className="size-3" />
    </a>
  )
}

export default PulseShareButton
