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
import {BACKEND_URL} from "@/lib/api-config";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
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
                // if you return 401 on bad creds:
                if (res.status === 401) {
                    throw new Error("Invalid email or password");
                }
                throw new Error("Unexpected error");
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
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Bird className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">CallingBird</h1>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Welkom terug</h2>
                        <p className="text-gray-600">Log in om verder te gaan</p>
                    </div>
                </div>

                {/* Login Form */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-4">
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

                            {/* Sign In Button */}
                            <Button type="submit" className="w-full h-11" disabled={isLoading}>
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

                {/* Demo Credentials */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-medium text-blue-900">Demo Credentials</h3>
                            <div className="text-xs text-blue-700 space-y-1">
                                <p>
                                    <strong>Email:</strong> demo@voorbeeld.com
                                </p>
                                <p>
                                    <strong>Wachtwoord:</strong> wachtwoord
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 space-y-2">
                    <p>© 2025 CallingBird. Alle rechten gereserveerd.</p>
                </div>
            </div>
        </div>
    )
}
