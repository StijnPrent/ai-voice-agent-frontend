"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Circle, Loader2, ShieldAlert, Sparkles } from "lucide-react"

import { CompanyProfile } from "@/app/components/company-profile"
import {
  CompanySetupStatus,
  RequiredSetupField,
  SetupStatusIssue,
  fetchCompanySetupStatus,
} from "@/lib/company-setup"

interface TaskDescriptor {
  field: RequiredSetupField
  title: string
  description: string
}

const TASKS: TaskDescriptor[] = [
  {
    field: "companyName",
    title: "Vul je bedrijfsnaam in",
    description: "Deze naam verschijnt in rapportages en gesprekken met klanten.",
  },
  {
    field: "contactEmail",
    title: "Bevestig je contact e-mailadres",
    description: "We sturen belangrijke updates naar dit adres.",
  },
  {
    field: "phoneNumber",
    title: "Voeg een hoofdtelefoonnummer toe",
    description: "Hiermee kan de voice agent klanten doorverbinden indien nodig.",
  },
  {
    field: "address",
    title: "Zorg voor een volledig adres",
    description: "Adresgegevens helpen bij het beantwoorden van klantvragen.",
  },
  {
    field: "businessHours",
    title: "Stel je openingstijden in",
    description: "De AI gebruikt openingstijden om beschikbaarheid te communiceren.",
  },
]

function buildTaskState(status: CompanySetupStatus | null) {
  const missing = status?.missingFields?.filter((field): field is RequiredSetupField =>
    ["companyName", "contactEmail", "phoneNumber", "address", "businessHours"].includes(field as RequiredSetupField)
  ) || TASKS.map((task) => task.field)

  return TASKS.map((task) => ({
    ...task,
    completed: !missing.includes(task.field),
  }))
}

const ISSUE_MESSAGES: Record<Exclude<SetupStatusIssue, RequiredSetupField>, string> = {
  auth: "Je sessie is verlopen. Log opnieuw in om verder te gaan.",
  network: "We konden je bedrijfsstatus niet ophalen. Controleer je verbinding en probeer opnieuw.",
  unknown: "Niet alle vereiste gegevens konden worden gecontroleerd. Werk je bedrijfsprofiel bij en probeer opnieuw.",
}

export default function CompanySetupOnboardingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<CompanySetupStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingProgress, setIsCheckingProgress] = useState(false)
  const [profileDirty, setProfileDirty] = useState(false)

  const nonTaskIssues = useMemo(() => {
    if (!status?.missingFields) return []
    return status.missingFields.filter(
      (field): field is Exclude<SetupStatusIssue, RequiredSetupField> =>
        field === "auth" || field === "network" || field === "unknown"
    )
  }, [status?.missingFields])

  const taskStates = useMemo(() => buildTaskState(status), [status])
  const allTasksCompleted = taskStates.every((task) => task.completed)

  const refreshStatus = useCallback(
    async (bypassCache = false) => {
      const next = await fetchCompanySetupStatus({ bypassCache })
      setStatus(next)
      return next
    },
    []
  )

  useEffect(() => {
    let cancelled = false

    const initialise = async () => {
      const next = await refreshStatus(true)
      if (cancelled) return

      setIsLoading(false)

      if (!next.needsSetup) {
        router.replace("/")
      }
    }

    void initialise()

    return () => {
      cancelled = true
    }
  }, [refreshStatus, router])

  const handleCheckProgress = useCallback(async () => {
    setIsCheckingProgress(true)
    const next = await refreshStatus(true)
    setIsCheckingProgress(false)

    if (!next.needsSetup) {
      router.replace("/")
    }
  }, [refreshStatus, router])

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 lg:flex-row">
        <div className="flex w-full max-w-xl flex-col gap-6">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <Sparkles className="h-4 w-4" />
              Bedrijf onboarding
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Laten we je account klaarzetten</h1>
              <p className="text-slate-600">
                Voordat je de CallingBird tools gebruikt, hebben we een paar bedrijfsgegevens nodig. Vul de taken in en sla je wijzigingen op.
              </p>
            </div>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
              <CardDescription>
                Voltooi alle stappen hieronder en sla de wijzigingen op in het bedrijfsprofiel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-4">
                {taskStates.map((task) => (
                  <li key={task.field} className="flex items-start gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="mt-1 h-5 w-5 text-slate-300" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-sm text-slate-600">{task.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {nonTaskIssues.length > 0 && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-5 w-5" />
                  <AlertDescription className="space-y-1">
                    {nonTaskIssues.map((issue) => (
                      <p key={issue}>{ISSUE_MESSAGES[issue]}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Status</p>
                  <Badge
                    variant={allTasksCompleted ? "default" : "secondary"}
                    className={allTasksCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}
                  >
                    {allTasksCompleted ? "Klaar om te starten" : "Nog niet afgerond"}
                  </Badge>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckProgress}
                  disabled={profileDirty || isCheckingProgress || isLoading}
                >
                  {isCheckingProgress ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Voortgang controleren...
                    </>
                  ) : profileDirty ? (
                    "Sla je wijzigingen eerst op"
                  ) : allTasksCompleted ? (
                    "Start met CallingBird"
                  ) : (
                    "Voortgang controleren"
                  )}
                </Button>
                {profileDirty && (
                  <p className="text-xs text-slate-500">
                    Er staan nog niet-opgeslagen wijzigingen open in het profiel. Klik in het formulier op "Opslaan" en probeer opnieuw.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full flex-1">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Bedrijfsprofiel</CardTitle>
              <CardDescription>
                Vul de velden in en klik op "Opslaan" binnen het profiel zodra je klaar bent. We controleren automatisch of alles is ingevuld.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <CompanyProfile onDirtyChange={setProfileDirty} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
