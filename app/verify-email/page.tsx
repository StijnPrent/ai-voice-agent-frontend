"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail, MailCheck, RefreshCw } from "lucide-react"
import Image from "next/image"

import { BACKEND_URL } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type VerifyStatus = "idle" | "success" | "error"

export default function VerifyEmailPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const statusParam = useMemo(() => searchParams.get("status") ?? "", [searchParams])
    const reasonParam = useMemo(() => searchParams.get("reason") ?? "", [searchParams])
    const status: VerifyStatus = statusParam === "success" ? "success" : statusParam === "error" ? "error" : "idle"
    const friendlyReason =
        status === "error"
            ? reasonParam?.trim() || "We konden je e-mailadres niet bevestigen. Vraag een nieuwe link aan."
            : ""

    const [resendEmail, setResendEmail] = useState("")
    const [resendMessage, setResendMessage] = useState("")
    const [resendError, setResendError] = useState("")
    const [resendLoading, setResendLoading] = useState(false)

    useEffect(() => {
        if (status === "success") {
            const timeout = setTimeout(() => router.push("/login"), 1600)
            return () => clearTimeout(timeout)
        }
    }, [status, router])

    const handleResend = async (event: React.FormEvent) => {
        event.preventDefault()
        setResendError("")
        setResendMessage("")

        if (!resendEmail.trim()) {
            setResendError("Vul een e-mailadres in.")
            return
        }

        try {
            setResendLoading(true)
            const response = await fetch(`${BACKEND_URL}/email/verification/resend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resendEmail.trim().toLowerCase() }),
            })

            if (!response.ok) {
                let message = "We konden de verificatiemail niet verzenden. Probeer het opnieuw."
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

            setResendMessage("Als dit e-mailadres bekend is, sturen we direct een nieuwe verificatielink.")
            setResendEmail("")
        } catch (err) {
            setResendError(err instanceof Error ? err.message : "Verzenden mislukt. Probeer het opnieuw.")
        } finally {
            setResendLoading(false)
        }
    }

    const showResendForm = status === "error" || status === "idle"

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                        <Image src="/logocallingbird.svg" alt="logo" width={200} height={50} />
                    </div>
                </div>

                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-4 text-[#081245]">
                        <CardTitle className="text-center flex items-center justify-center space-x-2">
                            <MailCheck className="h-5 w-5" />
                            <span>Verificatie</span>
                        </CardTitle>
                        <CardDescription className="text-center">
                            We hebben je link gecontroleerd. Zie hieronder de status en vraag zo nodig een nieuwe link aan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status === "success" && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">
                                    Je e-mailadres is bevestigd. Je wordt automatisch doorgestuurd naar de login.
                                </AlertDescription>
                            </Alert>
                        )}

                        {status === "error" && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700">{friendlyReason}</AlertDescription>
                            </Alert>
                        )}

                        {status === "idle" && (
                            <div className="flex flex-col items-center space-y-2 text-[#081245]">
                                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                <p className="text-sm">
                                    Geen status gevonden. Open deze pagina via de link in je e-mail of vraag een nieuwe aan.
                                </p>
                            </div>
                        )}

                        {showResendForm && (
                            <div className="space-y-3">
                                <form className="space-y-3" onSubmit={handleResend}>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">E-mailadres</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="naam@bedrijf.nl"
                                            value={resendEmail}
                                            onChange={(e) => {
                                                setResendEmail(e.target.value)
                                                if (resendError) setResendError("")
                                            }}
                                            required
                                            className="h-11"
                                        />
                                    </div>

                                    {resendError && (
                                        <Alert className="border-red-200 bg-red-50">
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                            <AlertDescription className="text-red-700">{resendError}</AlertDescription>
                                        </Alert>
                                    )}

                                    {resendMessage && (
                                        <Alert className="border-green-200 bg-green-50">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <AlertDescription className="text-green-700">{resendMessage}</AlertDescription>
                                        </Alert>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-[#0ea5e9] text-white hover:text-white hover:bg-[#0ca5e9]/70"
                                        disabled={resendLoading}
                                    >
                                        {resendLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Nieuwe link versturen...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Stuur nieuwe verificatielink
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}

                        <Button type="button" variant="outline" className="w-full h-11 bg-transparent" asChild>
                            <Link href="/login" className="flex items-center justify-center space-x-2">
                                <ArrowLeft className="h-4 w-4" />
                                <span>Terug naar inloggen</span>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
