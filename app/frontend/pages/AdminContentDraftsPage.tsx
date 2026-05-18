import { useState } from 'react'
import { Loader2, Copy, Check, AlertCircle, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useAdminContentDrafts,
  useGenerateContentDraft,
  useMarkContentDraftCopied,
  useDiscardContentDraft,
} from '../hooks/useAdminContentDrafts'
import type { ContentDraft, GenerateContentDraftParams } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

const CATEGORIES = [
  'stock_of_the_day',
  'dividend_calendar',
  'pulse_aggregates',
  'feature_announcement',
] as const

export function AdminContentDraftsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useAdminContentDrafts()
  const generate = useGenerateContentDraft()

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">{t('admin.contentDrafts.title')}</h1>

      <GeneratePanel
        onGenerate={(params) => generate.mutate(params)}
        isGenerating={generate.isPending}
        error={generate.error}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {data?.drafts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('admin.contentDrafts.empty')}
              </CardContent>
            </Card>
          )}
          {data?.drafts.map((draft) => <DraftCard key={draft.id} draft={draft} />)}
        </div>
      )}
    </div>
  )
}

interface GeneratePanelProps {
  onGenerate: (params: GenerateContentDraftParams) => void
  isGenerating: boolean
  error: unknown
}

function GeneratePanel({ onGenerate, isGenerating, error }: GeneratePanelProps) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<string>('')
  const [featureName, setFeatureName] = useState('')
  const [description, setDescription] = useState('')

  const isFeature = category === 'feature_announcement'

  const handleClick = () => {
    const params: GenerateContentDraftParams = {}
    if (category) {
      params.category = category as GenerateContentDraftParams['category']
    }
    if (isFeature) {
      params.featureName = featureName.trim()
      params.description = description.trim()
    }
    onGenerate(params)
  }

  const canSubmit = !isGenerating && (!isFeature || (featureName.trim() && description.trim()))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.contentDrafts.generateNew')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="category">{t('admin.contentDrafts.category')}</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            disabled={isGenerating}
          >
            <option value="">{t('admin.contentDrafts.autoPick')}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`admin.contentDrafts.categories.${c}`)}</option>
            ))}
          </select>
        </div>

        {isFeature && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="feature-name">{t('admin.contentDrafts.featureName')}</Label>
              <Input
                id="feature-name"
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder="Multi Currency"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-description">{t('admin.contentDrafts.featureDescription')}</Label>
              <Input
                id="feature-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Convert any portfolio into your home currency."
              />
            </div>
          </div>
        )}

        <div>
          <Button onClick={handleClick} disabled={!canSubmit}>
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('admin.contentDrafts.generating')}</>
            ) : (
              t('admin.contentDrafts.generate')
            )}
          </Button>
        </div>

        {error instanceof Error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function DraftCard({ draft }: { draft: ContentDraft }) {
  const { t, i18n } = useTranslation()
  const markCopied = useMarkContentDraftCopied()
  const discard = useDiscardContentDraft()
  const [showInputs, setShowInputs] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const generatedAt = new Date(draft.generatedAt).toLocaleString(i18n.language, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{draft.headline || t('admin.contentDrafts.untitled')}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{generatedAt}</span>
              <span>·</span>
              <Badge variant="secondary">{t(`admin.contentDrafts.categories.${draft.topicType}`)}</Badge>
              <span className="font-mono text-xs">{draft.topicKey}</span>
              {draft.copiedAt && (
                <Badge variant="default" className="bg-emerald-600">
                  <Check className="size-3 mr-1" /> {t('admin.contentDrafts.posted')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={draft.copiedAt ? 'outline' : 'default'}
              size="sm"
              onClick={() => markCopied.mutate({ id: draft.id, copied: !draft.copiedAt })}
              disabled={markCopied.isPending}
            >
              {draft.copiedAt ? t('admin.contentDrafts.unmark') : t('admin.contentDrafts.markAsPosted')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiscardConfirm(true)}
              disabled={discard.isPending}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label={t('admin.contentDrafts.discard')}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.contentDrafts.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.contentDrafts.discardConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                discard.mutate(draft.id)
                setShowDiscardConfirm(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('admin.contentDrafts.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlatformPanel
            label={t('admin.contentDrafts.xVersion')}
            charHint={`${draft.x.length} / 280`}
            text={draft.x.text}
            truncated={draft.x.truncated}
          />
          <PlatformPanel
            label={t('admin.contentDrafts.linkedinVersion')}
            charHint={`${draft.linkedin.length}`}
            text={draft.linkedin.text}
            truncated={draft.linkedin.truncated}
          />
        </div>

        {draft.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {draft.hashtags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-mono text-xs">#{tag}</Badge>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowInputs((v) => !v)}
          className="text-xs text-muted-foreground inline-flex items-center hover:text-foreground"
        >
          {showInputs ? <ChevronDown className="size-3 mr-1" /> : <ChevronRight className="size-3 mr-1" />}
          {t('admin.contentDrafts.rawInputs')}
        </button>
        {showInputs && (
          <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(draft.inputs, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

function PlatformPanel({ label, charHint, text, truncated }: { label: string; charHint: string; text: string; truncated: boolean }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API can fail in non-secure contexts; silently no-op.
    }
  }

  return (
    <div className="border rounded-md flex flex-col">
      <div className="px-3 py-2 flex items-center justify-between border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {truncated && <Badge variant="destructive" className="text-[10px] px-1 py-0">{t('admin.contentDrafts.truncated')}</Badge>}
        </div>
        <span className="text-xs text-muted-foreground font-mono">{charHint}</span>
      </div>
      <pre className="text-sm p-3 whitespace-pre-wrap font-mono break-words flex-1">{text}</pre>
      <div className="px-3 py-2 border-t bg-muted/20 text-right">
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? (
            <><Check className="size-4 mr-1" /> {t('admin.contentDrafts.copied')}</>
          ) : (
            <><Copy className="size-4 mr-1" /> {t('admin.contentDrafts.copy')}</>
          )}
        </Button>
      </div>
    </div>
  )
}

export default AdminContentDraftsPage
