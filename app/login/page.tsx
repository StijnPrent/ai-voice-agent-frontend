"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Bird} from "lucide-react"
import Link from "next/link"
import {BACKEND_URL} from "@/lib/api";
import Image from "next/image";

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [needsVerification, setNeedsVerification] = useState(false)
    const [resendMessage, setResendMessage] = useState("")
    const [resendLoading, setResendLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setResendMessage("");
        setNeedsVerification(false);
        try {
            const res = await fetch(`${BACKEND_URL}/company/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (!res.ok) {
                let message = "Unexpected error";
                try {
                    const data = await res.json();
                    if (typeof data?.message === "string" && data.message.trim()) {
                        message = data.message;
                    } else if (typeof data?.error === "string" && data.error.trim()) {
                        message = data.error;
                    }
                } catch (err) {
                    // ignore parse errors
                }

                const requiresVerification =
                    res.status === 403 || /verify|verifieer|not verified|unverified/i.test(message);

                if (requiresVerification) {
                    setNeedsVerification(true);
                    throw new Error(message || "Je e-mailadres is nog niet bevestigd.");
                }

                if (res.status === 401) {
                    throw new Error("Invalid email or password");
                }

                throw new Error(message || "Unexpected error");
            }

            const { token } = await res.json();
            localStorage.setItem("jwt", token);         // or cookie
            setSuccess("Login successful!");
            // navigate to dashboard; with Next you could:
            window.location.assign("/");
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!formData.email.trim()) {
            setError("Vul je e-mailadres in om de verificatiemail opnieuw te sturen.");
            return;
        }

        try {
            setResendLoading(true);
            setError("");
            setResendMessage("");
            const response = await fetch(`${BACKEND_URL}/email/verification/resend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
            });

            if (!response.ok) {
                let message = "Kon de verificatiemail niet versturen.";
                try {
                    const data = await response.json();
                    if (typeof data?.message === "string" && data.message.trim()) {
                        message = data.message;
                    }
                } catch (err) {
                    // ignore JSON parse errors
                }
                throw new Error(message);
            }

            setResendMessage("Als dit e-mailadres bestaat, is er een nieuwe verificatiemail verstuurd.");
        } catch (err: any) {
            setError(err?.message || "Versturen mislukt.");
        } finally {
            setResendLoading(false);
        }
    };


    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (error) setError("")
    }

    const handleDemoLogin = () => {
        setFormData({
            email: "demo@example.com",
            password: "password",
            rememberMe: false,
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                        <Image src="/logocallingbird.svg" alt='logo' width={200} height={50}></Image>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-[#081245]">Welkom terug</h2>
                        <p className="text-gray-600">Log in om verder te gaan</p>
                    </div>
                </div>

                {/* Login Form */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-4 text-[#081245]">
                        <CardTitle className="text-center">Log in</CardTitle>
                        <CardDescription className="text-center">Voer hier je gegevens in om verder te gaan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Vul je e-mailadres in"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Wachtwoord</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Vul je wachtwoord in"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        required
                                        className="h-11 pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                                    Wachtwoord vergeten?
                                </Link>
                            </div>

                            {/* Error Alert */}
                            {error && !needsVerification && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-700">{error}</AlertDescription>
                                </Alert>
                            )}

                            {needsVerification && (
                                <div className="space-y-2">
                                    <Alert className="border-yellow-200 bg-yellow-50">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-800">
                                            Je e-mailadres is nog niet bevestigd. Stuur de verificatiemail opnieuw.
                                        </AlertDescription>
                                    </Alert>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full h-11"
                                        onClick={handleResendVerification}
                                        disabled={resendLoading}
                                    >
                                        {resendLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Mail opnieuw sturen...
                                            </>
                                        ) : (
                                            "Verificatiemail opnieuw sturen"
                                        )}
                                    </Button>
                                    {resendMessage && (
                                        <Alert className="border-green-200 bg-green-50">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <AlertDescription className="text-green-700">{resendMessage}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}

                            {/* Success Alert */}
                            {success && (
                                <Alert className="border-green-200 bg-green-50">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                                </Alert>
                            )}

                            {/* Sign In Button */}
                            <Button type="submit" className="w-full h-11 bg-[#0ea5e9] text-white hover:text-white hover:bg-[#0ca5e9]/70" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Inloggen...
                                    </>
                                ) : (
                                    "Log in"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Sign Up Link */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        {"Nog geen account? "}
                        <Link href="/create-account" className="text-blue-600 hover:text-blue-500 font-medium">
                            Vraag toegang aan
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 space-y-2">
                    <p>© 2025 CallingBird. Alle rechten gereserveerd.</p>
                </div>
            </div>
        </div>
    )
}
