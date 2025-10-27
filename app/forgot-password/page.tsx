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

        // Simulate API call
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            setSuccess("Password reset instructions have been sent to your email address.")
        } catch (err) {
            setError("Something went wrong. Please try again.")
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
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Phone className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#081245]">VoiceAgent Pro</h1>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-[#081245]">Reset your password</h2>
                        <p className="text-gray-600">Enter your email to receive reset instructions</p>
                    </div>
                </div>

                {/* Forgot Password Form */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-center flex items-center justify-center space-x-2">
                            <Mail className="h-5 w-5" />
                            <span>Forgot Password</span>
                        </CardTitle>
                        <CardDescription className="text-center">We'll send you a link to reset your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email address"
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
                            <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending instructions...
                                    </>
                                ) : (
                                    "Send Reset Instructions"
                                )}
                            </Button>

                            {/* Back to Login */}
                            <Button type="button" variant="outline" className="w-full h-11 bg-transparent" asChild>
                                <Link href="/login" className="flex items-center justify-center space-x-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back to Sign In</span>
                                </Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Help Text */}
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-medium text-[#081245]">Need help?</h3>
                            <p className="text-xs text-gray-600">
                                If you don't receive an email within a few minutes, check your spam folder or{" "}
                                <Link href="/support" className="text-blue-600 hover:text-blue-500">
                                    contact support
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500 space-y-2">
                    <p>© 2024 VoiceAgent Pro. All rights reserved.</p>
                    <div className="space-x-4">
                        <Link href="/privacy" className="hover:text-gray-700">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="hover:text-gray-700">
                            Terms of Service
                        </Link>
                        <Link href="/support" className="hover:text-gray-700">
                            Support
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
