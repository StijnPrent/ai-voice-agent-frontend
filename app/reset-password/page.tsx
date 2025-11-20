"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, CheckCircle, KeyRound, Loader2, Lock } from "lucide-react"

import { BACKEND_URL } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = useMemo(() => searchParams.get("token") || "", [searchParams])

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    useEffect(() => {
        if (!token) {
            setError("De herstel-link is ongeldig of verlopen. Vraag een nieuwe link aan.")
        }
    }, [token])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError("")
        setSuccess("")

        if (!token) {
            setError("De herstel-link is ongeldig of verlopen. Vraag een nieuwe link aan.")
            return
        }

        if (password !== confirmPassword) {
            setError("Wachtwoorden komen niet overeen.")
            return
        }

        if (password.length < 8) {
            setError("Gebruik minimaal 8 tekens voor je nieuwe wachtwoord.")
            return
        }

        try {
            setIsSubmitting(true)
            const response = await fetch(`${BACKEND_URL}/email/password/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            })

            if (!response.ok) {
                let message = "Je wachtwoord kon niet worden gewijzigd. Probeer het opnieuw."
                try {
                    const data = await response.json()
                    if (typeof data?.message === "string" && data.message.trim()) {
                        message = data.message
                    }
                } catch (err) {
                    // ignore body parse errors
                }
                throw new Error(message)
            }

            setSuccess("Je wachtwoord is aangepast. Je kunt nu inloggen.")
            setPassword("")
            setConfirmPassword("")
            setTimeout(() => router.push("/login"), 1600)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Er ging iets mis. Probeer het opnieuw.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                        <Image src="/logocallingbird.svg" alt='logo' width={200} height={50}></Image>
                    </div>
                </div>

                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-4 text-[#081245]">
                        <CardTitle className="text-center flex items-center justify-center space-x-2">
                            <Lock className="h-5 w-5" />
                            <span>Reset wachtwoord</span>
                        </CardTitle>
                        <CardDescription className="text-center">
                            Gebruik de link uit je e-mail en kies daarna een nieuw wachtwoord.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="password">Nieuw wachtwoord</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Minimaal 8 tekens"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        if (error) setError("")
                                    }}
                                    required
                                    className="h-11"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Herhaal je nieuwe wachtwoord"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
                                        if (error) setError("")
                                    }}
                                    required
                                    className="h-11"
                                    autoComplete="new-password"
                                />
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

                            <Button
                                type="submit"
                                className="w-full h-11 bg-[#0ea5e9] text-white hover:text-white hover:bg-[#0ca5e9]/70"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Wachtwoord opslaan...
                                    </>
                                ) : (
                                    "Wachtwoord opslaan"
                                )}
                            </Button>

                            <Button type="button" variant="outline" className="w-full h-11 bg-transparent" asChild>
                                <Link href="/login" className="flex items-center justify-center space-x-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Terug naar inloggen</span>
                                </Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
