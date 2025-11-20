"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, ArrowLeft, Loader2, AlertCircle, CheckCircle, Mail } from "lucide-react"
import Link from "next/link"
import { BACKEND_URL } from "@/lib/api"
import Image from "next/image";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        try {
            const response = await fetch(`${BACKEND_URL}/email/password/request-reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            })

            if (!response.ok) {
                throw new Error("We konden je verzoek nu niet verwerken. Probeer het later opnieuw.")
            }

            setSuccess("Als het wachtwoord bestaat, zullen we je een e-mail sturen met instructies om het te resetten.")
            setEmail("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Er is een fout opgetreden. Probeer het later opnieuw.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="flex items-center justify-center space-x-2">
                            <Image src="/logocallingbird.svg" alt='logo' width={200} height={50}></Image>
                        </div>
                    </div>
                </div>

                {/* Forgot Password Form */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-4 text-[#081245]">
                        <CardTitle className="text-center flex items-center justify-center space-x-2">
                            <Mail className="h-5 w-5" />
                            <span>Wachtwoord vergeten</span>
                        </CardTitle>
                        <CardDescription className="text-center">we versturen je een link om je wachtwoord te veranderen</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Vul je e-mailadres in"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (error) setError("")
                                    }}
                                    required
                                    className="h-11"
                                />
                            </div>

                            {/* Error Alert */}
                            {error && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit Button */}
                            <Button type="submit" className="w-full h-11 bg-[#0ea5e9] text-white hover:text-white hover:bg-[#0ca5e9]/70" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending instructions...
                                    </>
                                ) : (
                                    "Verzend reset instructies"
                                )}
                            </Button>

                            {/* Back to Login */}
                            <Button type="button" variant="outline" className="w-full h-11 bg-transparent" asChild>
                                <Link href="/login" className="flex items-center justify-center space-x-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Terug naar inloggen</span>
                                </Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Help Text */}
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-medium text-[#081245]">Hulp nodig?</h3>
                            <p className="text-xs text-gray-600">
                                Als je binnen enkelen minuten geen email hebt ontvangen, controleer je spam of{" "}
                                <Link href="/support" className="text-blue-600 hover:text-blue-500">
                                    neem contant op
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 space-y-2">
                    <p>© 2025 Callingbird. Alle rechten gereserveerd.</p>
                </div>
            </div>
        </div>
    )
}
