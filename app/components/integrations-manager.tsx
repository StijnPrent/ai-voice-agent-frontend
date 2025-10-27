// src/components/IntegrationsManager.tsx
"use client"

import React, {useState, useEffect} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Input} from "@/components/ui/input"
import Image from 'next/image'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Plus, Settings, CheckCircle, AlertCircle, Search} from "lucide-react"
import {BACKEND_URL} from "@/lib/api-config"
import {Integration} from "@/lib/types/types";
import {toast} from "@/hooks/use-toast"

export function IntegrationsManager() {
    const [integrations, setIntegrations] = useState<Integration[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [connectingId, setConnectingId] = useState<string | number | null>(null);

    useEffect(() => {
        async function fetchIntegrations() {
            try {
                const res = await fetch(`${BACKEND_URL}/integrations/get`, {
                    headers: {"Authorization": `Bearer ${localStorage.getItem('jwt')}`}
                })
                if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
                const data: Integration[] = await res.json()
                setIntegrations(data)
            } catch (err: any) {
                setError(err.message || "Error fetching integrations")
            } finally {
                setLoading(false)
            }
        }

        fetchIntegrations()
    }, [])

    const filtered = integrations.filter(i => {
        const matchesSearch =
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory =
            selectedCategory === "all" || i.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    function getCompanyIdFromJWT(): string | null {
        const token = localStorage.getItem("jwt");
        if (!token) return null;
        try {
            const [, payload] = token.split(".");
            const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
            // adjust claim name if yours is different (cid, company_id, etc.)
            return json.companyId ?? json.cid ?? json.company_id ?? null;
        } catch {
            return null;
        }
    }

    const handleConnect = async (integration: Integration) => {
        const token = localStorage.getItem("jwt");
        const companyId =
            (integration as any).companyId ?? getCompanyIdFromJWT();

        if (!companyId) {
            toast({
                variant: "destructive",
                title: "Company information missing",
                description: "We couldn't find your company ID. Please sign in again and retry.",
            })
            return;
        }

        try {
            setConnectingId(integration.id);
            // 1) Call your backend to GET the OAuth URL
            const res = await fetch(
                `${BACKEND_URL}/google/oauth2/url?companyId=${encodeURIComponent(String(companyId))}`,
                {
                    method: "GET",
                    headers: { Authorization: `Bearer ${token ?? ""}` },
                }
            );

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Backend responded ${res.status}`);
            }

            // 2) Try to read JSON { url: "https://accounts.google.com/…" }
            let authUrl: string | undefined;
            try {
                const data = await res.json();
                authUrl =
                    data.url ||
                    data.authUrl ||
                    data.redirectUrl ||
                    data.location;
            } catch {
                // If backend returns plain text (URL only)
                const text = await res.text();
                if (/^https?:\/\//i.test(text)) authUrl = text.trim();
            }

            if (!authUrl || !/^https?:\/\//i.test(authUrl)) {
                throw new Error("No OAuth URL returned by backend.");
            }

            // 3) Navigate to the returned URL
            window.location.assign(authUrl);
        } catch (err: any) {
            console.error("Connect error:", err);
            const message = err?.message || "Failed to start Google OAuth.";
            toast({
                variant: "destructive",
                title: "Unable to start connection",
                description: message,
            })
        } finally {
            setConnectingId(null);
        }
    };

    const handleDisconnect = async () => {
        // Retrieve the authentication token from storage (e.g., localStorage)
        const token = localStorage.getItem('jwt');

        try {
            const response = await fetch(`${BACKEND_URL}/google/disconnect`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                try {
                    const res = await fetch(`${BACKEND_URL}/integrations/get`, {
                        headers: {"Authorization": `Bearer ${localStorage.getItem('jwt')}`}
                    })
                    if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
                    const data: Integration[] = await res.json()
                    setIntegrations(data)
                    toast({
                        title: "Disconnected",
                        description: "The integration has been disconnected successfully.",
                    })
                } catch (err: any) {
                    setError(err.message || "Error fetching integrations")
                } finally {
                    setLoading(false)
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to disconnect.');
            }
        } catch (error: any) {
            console.error('Disconnect error:', error);
            const message = error?.message || "Failed to disconnect the integration.";
            toast({
                variant: "destructive",
                title: "Unable to disconnect",
                description: message,
            })
        }
    };


    const getStatusIcon = (status: string) => {
        switch (status) {
            case "connected":
                return <CheckCircle className="h-4 w-4 text-green-500"/>
            case "error":
                return <AlertCircle className="h-4 w-4 text-red-500"/>
            default:
                return <div className="h-4 w-4 rounded-full bg-gray-300"/>
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "connected":
                return <Badge className="bg-green-100 text-green-800 border-green-200">Connected</Badge>
            case "error":
                return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
            default:
                return <Badge variant="outline">Not Connected</Badge>
        }
    }

    if (loading) return <div>Loading integrations…</div>
    if (error) return <div className="text-red-600">{error}</div>

    const categories = Array.from(
        new Set(["all", ...integrations.map(i => i.category)])
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#081245]">Integraties</h2>
                    <p className="text-gray-600">Verbind je favoriete tools en services</p>
                </div>
                {/*<Button>*/}
                {/*    <Plus className="h-4 w-4 mr-2"/> Browse All Integrations*/}
                {/*</Button>*/}
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
                            <Input
                                placeholder="Integraties zoeken..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {/*<div className="flex gap-2">*/}
                        {/*    {categories.map(cat => (*/}
                        {/*        <Button*/}
                        {/*            key={cat}*/}
                        {/*            variant={selectedCategory === cat ? "default" : "outline"}*/}
                        {/*            size="sm"*/}
                        {/*            onClick={() => setSelectedCategory(cat)}*/}
                        {/*        >*/}
                        {/*            {cat === "all" ? "All" : cat}*/}
                        {/*        </Button>*/}
                        {/*    ))}*/}
                        {/*</div>*/}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(integration => (
                    <Card key={integration.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <Image
                                        src={integration.logo}
                                        width={40}
                                        height={40}
                                        alt={`${integration.name} logo`}
                                    />
                                    <div>
                                        <CardTitle className="text-lg flex items-center space-x-2">
                                            <span>{integration.name}</span>
                                        </CardTitle>
                                        <div className="flex items-center space-x-2 mt-1">
                                            {getStatusIcon(integration.status)}
                                            {getStatusBadge(integration.status)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">
                                {integration.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    {integration.lastSync &&
                                        <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>}
                                </div>
                                <div className="flex space-x-2">
                                    {integration.status === "connected" ? (
                                        <Button variant="outline" size="sm" onClick={handleDisconnect}>
                                            Disconnect
                                        </Button>
                                    ) : (
                                        <Button size="sm" onClick={() => handleConnect(integration)}>
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
