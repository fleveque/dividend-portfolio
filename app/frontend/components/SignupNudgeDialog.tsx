import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDemoMode } from '../contexts/DemoModeContext'

// Layout-level modal shown when a write action is attempted in demo mode.
// Body copy is keyed by the action so the message reads naturally.
export function SignupNudgeDialog() {
  const { t } = useTranslation()
  const { nudgeAction, dismissNudge } = useDemoMode()

  const open = nudgeAction !== null
  const bodyKey = nudgeAction ? `demo.nudge.bodies.${nudgeAction}` : ''

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) dismissNudge() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-500" />
            {t('demo.nudge.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {nudgeAction ? t(bodyKey) : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('demo.nudge.keepExploring')}</AlertDialogCancel>
          <AlertDialogAction asChild onClick={dismissNudge}>
            <Link to="/signup">{t('demo.nudge.signUp')}</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
