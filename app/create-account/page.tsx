"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bird, Eye, EyeOff, Loader2, ShieldCheck, KeyRound, AlertCircle, CheckCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

import { BACKEND_URL } from "@/lib/api-config"

interface SignUpForm {
  companyName: string
  contactName: string
  email: string
  password: string
  confirmPassword: string
  accessCode: string
}

const initialForm: SignUpForm = {
  companyName: "",
  contactName: "",
  email: "",
  password: "",
  confirmPassword: "",
  accessCode: "",
}

export default function CreateAccountPage() {
  const router = useRouter()
  const [form, setForm] = useState<SignUpForm>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const isSubmitDisabled = useMemo(() => {
    return (
      !form.companyName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword ||
      !form.accessCode.trim() ||
      form.password.length < 8 ||
      form.password !== form.confirmPassword
    )
  }, [form])

  useEffect(() => {
    if (!success) return

    const timeout = setTimeout(() => {
      router.push("/login")
    }, 1800)

    return () => clearTimeout(timeout)
  }, [success, router])

  const handleChange = (field: keyof SignUpForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setForm((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError("Wachtwoorden komen niet overeen")
      return
    }

    if (form.password.length < 8) {
      setError("Kies een wachtwoord van minimaal 8 tekens")
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim() || undefined,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        accessCode: form.accessCode.trim(),
      }

      const response = await fetch(`${BACKEND_URL}/company/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          throw new Error("De toegangscode is ongeldig of verlopen")
        }

        let message = "Registratie is niet gelukt"
        try {
          const data = await response.json()
          if (typeof data?.message === "string" && data.message.trim()) {
            message = data.message
          }
        } catch (err) {
          // ignore JSON parse failures
        }
        throw new Error(message)
      }

      setSuccess("Account aangemaakt! We leiden je zo door naar de login.")
      setForm(initialForm)
    } catch (err: any) {
      setSuccess(null)
      setError(err?.message || "Registratie is niet gelukt")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bird className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CallingBird</h1>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">Maak een testaccount aan</h2>
            <p className="text-gray-600">
              Gebruik de persoonlijke toegangscode die je van ons hebt ontvangen om een account te activeren.
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center">Nieuwe organisatie</CardTitle>
            <CardDescription className="text-center">
              We vragen alleen de basisgegevens die nodig zijn voor deze testfase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Bedrijfsnaam</Label>
                  <Input
                    id="companyName"
                    placeholder="Naam van je organisatie"
                    value={form.companyName}
                    onChange={handleChange("companyName")}
                    required
                    autoComplete="organization"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Contactpersoon (optioneel)</Label>
                  <Input
                    id="contactName"
                    placeholder="Bijv. Jan Jansen"
                    value={form.contactName}
                    onChange={handleChange("contactName")}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Zakelijk e-mailadres</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="naam@bedrijf.nl"
                  value={form.email}
                  onChange={handleChange("email")}
                  required
                  autoComplete="email"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimaal 8 tekens"
                      value={form.password}
                      onChange={handleChange("password")}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                    Kies een uniek wachtwoord voor deze testomgeving.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Herhaal je wachtwoord"
                      value={form.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      required
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessCode">Toegangscode</Label>
                <div className="relative">
                  <Input
                    id="accessCode"
                    placeholder="Bijv. TEST-2024-ALPHA"
                    value={form.accessCode}
                    onChange={handleChange("accessCode")}
                    required
                    autoComplete="one-time-code"
                    className="pr-10 uppercase"
                  />
                  <KeyRound className="h-4 w-4 text-blue-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-500">
                  Alleen testers met een geldige code kunnen een account aanmaken tijdens deze fase.
                </p>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-11" disabled={isSubmitting || isSubmitDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Account aanmaken...
                  </>
                ) : (
                  "Account aanmaken"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Heb je al toegang?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Log hier in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
