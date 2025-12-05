// src/components/IntegrationsManager.tsx
"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import Image from "next/image"
import { CheckCircle, AlertCircle, Search, ShoppingBag, UploadCloud, Store, Loader2 } from "lucide-react"
import { Outfit } from "next/font/google"
import { BACKEND_URL } from "@/lib/api"
import { Integration } from "@/lib/types/types"
import { toast } from "@/hooks/use-toast"

type ShopifyForm = { shopDomain: string }
type WooForm = { storeUrl: string; consumerKey: string; consumerSecret: string; apiVersion?: string }
type ProductStatus = "draft" | "published" | string
type Product = {
    id: string
    name: string
    sku?: string
    summary?: string
    status?: ProductStatus
    synonyms?: string[]
    content?: {
        description?: string
        summary?: string
        faq?: { question: string; answer: string }[]
        troubleshooting?: string[]
        policies?: { title?: string; content?: string }[]
        restrictedTopics?: string[]
        metadata?: Record<string, unknown>
    }
    version?: number
    source?: string
    createdAt?: string
    updatedAt?: string
}

type ProductFormState = {
    name: string
    sku: string
    summary: string
    status: "draft" | "published"
    synonyms: string
    contentSummary: string
    contentDescription: string
    source: string
    metadataJson: string
}

type Mode = "both" | "integrations" | "ecommerce"
const outfit = Outfit({ subsets: ["latin"], weight: ["600", "700"] })

export function IntegrationsManager({ mode = "both" }: { mode?: Mode }) {
    const [integrations, setIntegrations] = useState<Integration[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [connectingId, setConnectingId] = useState<string | number | null>(null)
    const [shopifyForms, setShopifyForms] = useState<Record<string, ShopifyForm>>({})
    const [wooForms, setWooForms] = useState<Record<string, WooForm>>({})
    const [modalIntegration, setModalIntegration] = useState<Integration | null>(null)
    const [modalError, setModalError] = useState<string | null>(null)

    const [products, setProducts] = useState<Product[]>([])
    const [productStatusFilter, setProductStatusFilter] = useState<"all" | "draft" | "published">("all")
    const [productsLoading, setProductsLoading] = useState(false)
    const [productsLoaded, setProductsLoaded] = useState(false)
    const [productsError, setProductsError] = useState<string | null>(null)
    const [productForm, setProductForm] = useState<ProductFormState>({
        name: "",
        sku: "",
        summary: "",
        status: "draft",
        synonyms: "",
        contentSummary: "",
        contentDescription: "",
        source: "",
        metadataJson: "",
    })
    const [productSaving, setProductSaving] = useState(false)
    const [bulkContent, setBulkContent] = useState("")
    const [bulkFilename, setBulkFilename] = useState("")
    const [bulkPublish, setBulkPublish] = useState(false)
    const [bulkSaving, setBulkSaving] = useState(false)

    const authHeaders = useCallback(() => ({ Authorization: `Bearer ${localStorage.getItem("jwt") ?? ""}` }), [])
    const [activeSection, setActiveSection] = useState<"integrations" | "ecommerce">(mode === "ecommerce" ? "ecommerce" : "integrations")
    const currentSection: "integrations" | "ecommerce" = mode === "both" ? activeSection : mode === "ecommerce" ? "ecommerce" : "integrations"

    const fetchIntegrations = useCallback(async (options?: { showLoader?: boolean }) => {
        if (options?.showLoader) setLoading(true)
        try {
            const res = await fetch(`${BACKEND_URL}/integrations/get`, {
                headers: authHeaders(),
            })
            if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
            const data: Integration[] = await res.json()
            setIntegrations(data)
            setError(null)
        } catch (err: any) {
            setError(err.message || "Error fetching integrations")
        } finally {
            if (options?.showLoader) setLoading(false)
        }
    }, [authHeaders])

    const fetchProducts = useCallback(
        async (status: "all" | "draft" | "published" = productStatusFilter) => {
            if (currentSection !== "ecommerce") return
            try {
                setProductsLoading(true)
                setProductsError(null)
                const params = new URLSearchParams()
                if (status !== "all") params.set("status", status)
                const res = await fetch(`${BACKEND_URL}/products${params.toString() ? `?${params}` : ""}`, {
                    headers: authHeaders(),
                })
                if (!res.ok) {
                    const text = await res.text().catch(() => "")
                    throw new Error(text || `Product load failed (${res.status})`)
                }
                const data = await res.json().catch(() => [])
                const list = Array.isArray(data) ? data : data.products ?? []
                setProducts(list)
                setProductsLoaded(true)
            } catch (err: any) {
                console.error("Product load error:", err)
                setProductsError(err?.message || "Kon producten niet laden")
            } finally {
                setProductsLoading(false)
            }
        },
        [activeSection, authHeaders, productStatusFilter],
    )

    useEffect(() => {
        fetchIntegrations({ showLoader: true })
    }, [fetchIntegrations])

    useEffect(() => {
        if (currentSection === "ecommerce" && !productsLoaded) {
            fetchProducts(productStatusFilter)
        }
    }, [currentSection, fetchProducts, productStatusFilter, productsLoaded])

    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase()
        return integrations.filter((integration) => {
            return (
                integration.name.toLowerCase().includes(term) ||
                integration.description.toLowerCase().includes(term)
            )
        })
    }, [integrations, searchTerm])

    const ecommerceIntegrations = useMemo(
        () =>
            integrations.filter((integration) => {
                const name = integration.name.toLowerCase()
                const category = (integration.category ?? "").toLowerCase()
                return category.includes("ecom") || category.includes("shop") || /shopify|woo|commerce/.test(name)
            }),
        [integrations],
    )

    function getCompanyIdFromJWT(): string | null {
        const token = localStorage.getItem("jwt")
        if (!token) return null
        try {
            const [, payload] = token.split(".")
            const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
            return json.companyId ?? json.cid ?? json.company_id ?? null
        } catch {
            return null
        }
    }

    const resetProductForm = () => {
        setProductForm({
            name: "",
            sku: "",
            summary: "",
            status: "draft",
            synonyms: "",
            contentSummary: "",
            contentDescription: "",
            source: "",
            metadataJson: "",
        })
    }

    const handleCreateProduct = async () => {
        if (!productForm.name.trim()) {
            toast({
                variant: "destructive",
                title: "Naam is verplicht",
                description: "Geef het product een naam voordat je opslaat.",
            })
            return
        }

        let metadata: Record<string, unknown> | undefined
        if (productForm.metadataJson.trim()) {
            try {
                metadata = JSON.parse(productForm.metadataJson)
            } catch {
                toast({
                    variant: "destructive",
                    title: "Metadata is geen geldige JSON",
                    description: "Controleer de JSON structuur en probeer opnieuw.",
                })
                return
            }
        }

        const synonyms = productForm.synonyms
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)

        const content: Record<string, unknown> = {}
        if (productForm.contentSummary.trim()) content.summary = productForm.contentSummary.trim()
        if (productForm.contentDescription.trim()) content.description = productForm.contentDescription.trim()
        if (metadata) content.metadata = metadata

        const payload: Record<string, unknown> = {
            name: productForm.name.trim(),
            status: productForm.status,
        }
        if (productForm.sku.trim()) payload.sku = productForm.sku.trim()
        if (productForm.summary.trim()) payload.summary = productForm.summary.trim()
        if (synonyms.length) payload.synonyms = synonyms
        if (productForm.source.trim()) payload.source = productForm.source.trim()
        if (Object.keys(content).length) payload.content = content

        try {
            setProductSaving(true)
            const res = await fetch(`${BACKEND_URL}/products`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const text = await res.text().catch(() => "")
                throw new Error(text || `Opslaan mislukt (${res.status})`)
            }
            await fetchProducts(productStatusFilter)
            toast({
                title: "Product opgeslagen",
                description: `${productForm.name} is toegevoegd.`,
            })
            resetProductForm()
        } catch (err: any) {
            console.error("Product save error:", err)
            toast({
                variant: "destructive",
                title: "Product opslaan mislukt",
                description: err?.message || "Kon het product niet opslaan.",
            })
        } finally {
            setProductSaving(false)
        }
    }

    const handleBulkIngest = async () => {
        if (!bulkContent.trim()) {
            toast({
                variant: "destructive",
                title: "Geen content aangeleverd",
                description: "Voeg tekst of JSON toe om in te lezen.",
            })
            return
        }

        const payload: Record<string, unknown> = {
            content: bulkContent,
            publish: bulkPublish,
        }
        if (bulkFilename.trim()) payload.filename = bulkFilename.trim()

        try {
            setBulkSaving(true)
            const res = await fetch(`${BACKEND_URL}/products/ingest`, {
                method: "POST",
                headers: { ...authHeaders(), "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const text = await res.text().catch(() => "")
                throw new Error(text || `Bulk import mislukt (${res.status})`)
            }
            await fetchProducts(productStatusFilter)
            setBulkContent("")
            setBulkFilename("")
            setBulkPublish(false)
            const data = await res.json().catch(() => ({}))
            toast({
                title: "Bulk ingest verwerkt",
                description: data?.message || "Producten zijn toegevoegd of bijgewerkt.",
            })
        } catch (err: any) {
            console.error("Bulk ingest error:", err)
            toast({
                variant: "destructive",
                title: "Bulk ingest mislukt",
                description: err?.message || "Controleer de input en probeer opnieuw.",
            })
        } finally {
            setBulkSaving(false)
        }
    }

    const handleConnect = async (integration: Integration, options?: { viaModal?: boolean }) => {
        const token = localStorage.getItem("jwt")
        const companyId = (integration as any).companyId ?? getCompanyIdFromJWT()

        if (!companyId) {
            toast({
                variant: "destructive",
                title: "Company information missing",
                description: "We couldn't find your company ID. Please sign in again and retry.",
            })
            return
        }

        // For POST connectors that need payload, open modal unless this call came from the modal
        const lower = integration.name.toLowerCase()
        const needsShopify = integration.connectMethod === "POST" && lower.includes("shopify")
        const needsWoo = integration.connectMethod === "POST" && lower.includes("woo")
        if (!options?.viaModal && (needsShopify || needsWoo)) {
            setModalIntegration(integration)
            setModalError(null)
            return
        }

        try {
            setConnectingId(integration.id)
            const headers: Record<string, string> = { Authorization: `Bearer ${token ?? ""}` }

            if (integration.connectMethod === "GET") {
                const res = await fetch(integration.connectUrl, { method: "GET", headers })
                if (!res.ok) {
                    const text = await res.text().catch(() => "")
                    throw new Error(text || `Backend responded ${res.status}`)
                }
                let authUrl: string | undefined
                try {
                    const data = await res.json()
                    authUrl = data.url || data.authUrl || data.redirectUrl || data.location
                } catch {
                    const text = await res.text()
                    if (/^https?:\/\//i.test(text)) authUrl = text.trim()
                }
                if (!authUrl || !/^https?:\/\//i.test(authUrl)) {
                    throw new Error("No OAuth URL returned by backend.")
                }
                window.location.assign(authUrl)
                return
            }

            headers["Content-Type"] = "application/json"
            if (lower.includes("shopify")) {
                const form = shopifyForms[integration.id] ?? { shopDomain: "" }
                const shopDomain = (form.shopDomain ?? "").trim()
                if (!shopDomain) {
                    throw new Error("Vul een shop domein in (bijv. myshop.myshopify.com).")
                }
                const res = await fetch(integration.connectUrl || `${BACKEND_URL}/shopify/start`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ shopDomain }),
                })
                if (!res.ok) {
                    const text = await res.text().catch(() => "")
                    throw new Error(text || `Shopify connect failed (${res.status})`)
                }
                const data = await res.json().catch(() => ({}))
                const redirectUrl = data.authUrl || data.url
                if (redirectUrl && /^https?:\/\//i.test(redirectUrl)) {
                    window.location.assign(redirectUrl)
                } else {
                    toast({
                        title: "Shopify koppeling gestart",
                        description: "Volg de stappen in Shopify om te verbinden.",
                    })
                }
                return
            }

            if (lower.includes("woo")) {
                const form = wooForms[integration.id] ?? {
                    storeUrl: "",
                    consumerKey: "",
                    consumerSecret: "",
                    apiVersion: "",
                }
                const payload = {
                    storeUrl: form.storeUrl.trim(),
                    consumerKey: form.consumerKey.trim(),
                    consumerSecret: form.consumerSecret.trim(),
                    apiVersion: form.apiVersion?.trim() || undefined,
                }
                if (!payload.storeUrl || !payload.consumerKey || !payload.consumerSecret) {
                    throw new Error("Vul store URL, consumer key en consumer secret in.")
                }
                const res = await fetch(integration.connectUrl || `${BACKEND_URL}/woocommerce/connect`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(payload),
                })
                if (!res.ok) {
                    const text = await res.text().catch(() => "")
                    throw new Error(text || `WooCommerce connect failed (${res.status})`)
                }
                await fetchIntegrations()
                setModalIntegration(null)
                setModalError(null)
                toast({
                    title: "WooCommerce gekoppeld",
                    description: "We hebben de WooCommerce API-gegevens opgeslagen.",
                })
                return
            }

            // Generic POST with no body
            const res = await fetch(integration.connectUrl, { method: "POST", headers })
            if (!res.ok) {
                const text = await res.text().catch(() => "")
                throw new Error(text || `Backend responded ${res.status}`)
            }
            await fetchIntegrations()
        } catch (err: any) {
            console.error("Connect error:", err)
            const message = err?.message || "Connectie starten mislukt."
            if (options?.viaModal) {
                setModalError(message)
            }
            toast({
                variant: "destructive",
                title: "Unable to start connection",
                description: message,
            })
        } finally {
            setConnectingId(null)
        }
    }

    const handleDisconnect = async (integration: Integration) => {
        const token = localStorage.getItem("jwt")
        const lower = integration.name.toLowerCase()
        const headers = { Authorization: `Bearer ${token ?? ""}` }
        let url = `${BACKEND_URL}/google/disconnect`
        if (lower.includes("shopify")) url = `${BACKEND_URL}/shopify/disconnect`
        if (lower.includes("woo")) url = `${BACKEND_URL}/woocommerce/disconnect`

        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers,
            })

            if (!response.ok) {
                const text = await response.text().catch(() => "")
                throw new Error(text || "Failed to disconnect.")
            }

            await fetchIntegrations()
            toast({
                title: "Disconnected",
                description: "The integration has been disconnected successfully.",
            })
        } catch (err: any) {
            console.error("Disconnect error:", err)
            const message = err?.message || "Failed to disconnect the integration."
            toast({
                variant: "destructive",
                title: "Unable to disconnect",
                description: message,
            })
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "connected":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "error":
                return <AlertCircle className="h-4 w-4 text-red-500" />
            default:
                return <div className="h-4 w-4 rounded-full bg-gray-300" />
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

    const renderIntegrationCard = (integration: Integration) => {
        const isConnecting = connectingId === integration.id

        return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 text-[#081245]">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <Image src={integration.logo} width={40} height={40} alt={`${integration.name} logo`} />
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
                    <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                    <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-500">
                            {integration.lastSync && (
                                <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            {integration.status === "connected" ? (
                                <Button variant="outline" size="sm" onClick={() => handleDisconnect(integration)}>
                                    Disconnect
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={() => handleConnect(integration)}
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? "Connecting..." : "Connect"}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const renderProductStatus = (status?: ProductStatus) => {
        const normalized = (status ?? "draft").toLowerCase()
        if (normalized === "published") {
            return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Published</Badge>
        }
        return <Badge variant="outline">Draft</Badge>
    }

    const integrationsContent = (
        <div className="space-y-6">
            <Card className="border-blue-100 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Integraties zoeken..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((integration) => renderIntegrationCard(integration))}
            </div>
        </div>
    )

    const productList = (
        <div className="space-y-3">
            {products.map((product) => (
                <div key={product.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-[#081245]">{product.name}</p>
                                {renderProductStatus(product.status)}
                            </div>
                            {product.summary && <p className="text-sm text-gray-600 mt-1">{product.summary}</p>}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                                {product.sku && <span>SKU: {product.sku}</span>}
                                {product.source && <span>Bron: {product.source}</span>}
                                {product.updatedAt && (
                                    <span>Laatst bijgewerkt: {new Date(product.updatedAt).toLocaleString()}</span>
                                )}
                            </div>
                            {product.synonyms?.length ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {product.synonyms.map((syn) => (
                                        <Badge key={syn} variant="secondary">
                                            {syn}
                                        </Badge>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        {product.content?.summary || product.content?.description ? (
                            <div className="md:max-w-sm text-sm text-gray-600 bg-slate-50 border border-slate-100 rounded-md p-3">
                                {product.content?.summary && <p className="font-medium text-[#081245]">{product.content.summary}</p>}
                                {product.content?.description && <p className="mt-1 overflow-hidden text-ellipsis">{product.content.description}</p>}
                            </div>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    )

    const ecommerceContent = (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="text-[#081245]">
                        <CardTitle className={`flex items-center gap-2 ${outfit.className}`}>
                            <ShoppingBag className="h-5 w-5" />
                            Product handmatig toevoegen
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Voeg producten toe zonder een shop te koppelen. Velden komen overeen met de /products endpoint.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Naam *</Label>
                                <Input
                                    value={productForm.name}
                                    onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Productnaam"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>SKU</Label>
                                <Input
                                    value={productForm.sku}
                                    onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
                                    placeholder="Unieke SKU"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Korte samenvatting</Label>
                                <Textarea
                                    value={productForm.summary}
                                    onChange={(e) => setProductForm((prev) => ({ ...prev, summary: e.target.value }))}
                                    placeholder="1-2 regels"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={productForm.status}
                                    onValueChange={(value) => setProductForm((prev) => ({ ...prev, status: value as "draft" | "published" }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kies status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Synoniemen (komma gescheiden)</Label>
                                <Input
                                    value={productForm.synonyms}
                                    onChange={(e) => setProductForm((prev) => ({ ...prev, synonyms: e.target.value }))}
                                    placeholder="bijv. hoodie, sweater"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bron</Label>
                                <Input
                                    value={productForm.source}
                                    onChange={(e) => setProductForm((prev) => ({ ...prev, source: e.target.value }))}
                                    placeholder="Bijv. handmatig, import"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Content samenvatting</Label>
                            <Input
                                value={productForm.contentSummary}
                                onChange={(e) => setProductForm((prev) => ({ ...prev, contentSummary: e.target.value }))}
                                placeholder="Korte beschrijving voor content.summary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Beschrijving</Label>
                            <Textarea
                                value={productForm.contentDescription}
                                onChange={(e) => setProductForm((prev) => ({ ...prev, contentDescription: e.target.value }))}
                                rows={5}
                                placeholder="Details voor content.description"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Metadata (optioneel JSON)</Label>
                            <Textarea
                                value={productForm.metadataJson}
                                onChange={(e) => setProductForm((prev) => ({ ...prev, metadataJson: e.target.value }))}
                                rows={4}
                                placeholder='{"kleur":"blauw","maat":"M"}'
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={resetProductForm} disabled={productSaving}>
                                Reset
                            </Button>
                            <Button onClick={handleCreateProduct} disabled={productSaving}>
                                {productSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Product opslaan
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-blue-100 shadow-sm">
                    <CardHeader className="text-[#081245]">
                        <CardTitle className={`flex items-center gap-2 ${outfit.className}`}>
                            <UploadCloud className="h-5 w-5" />
                            Bulk ingest
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                            Plak ruwe tekst of een JSON array met producten. De backend haalt er producten uit en slaat ze op.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tekst of JSON</Label>
                            <Textarea
                                value={bulkContent}
                                onChange={(e) => setBulkContent(e.target.value)}
                                rows={10}
                                placeholder="Plak productinformatie of een JSON array met producten..."
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 items-center">
                            <div className="space-y-2">
                                <Label>Bestandsnaam (optioneel)</Label>
                                <Input
                                    value={bulkFilename}
                                    onChange={(e) => setBulkFilename(e.target.value)}
                                    placeholder="products.txt of products.json"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch checked={bulkPublish} onCheckedChange={setBulkPublish} id="bulk-publish" />
                                <Label htmlFor="bulk-publish" className="text-sm text-gray-700">
                                    Direct publiceren
                                </Label>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleBulkIngest} disabled={bulkSaving}>
                                {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verzenden
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-blue-100 shadow-sm">
                <CardHeader className="text-[#081245]">
                    <CardTitle className={outfit.className}>Huidige productcatalogus</CardTitle>
                    <p className="text-sm text-gray-600">Data geladen via GET /products.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                            <Label className="text-sm text-gray-700">Status</Label>
                            <Select
                                value={productStatusFilter}
                                onValueChange={(value) => {
                                    const next = value as "all" | "draft" | "published"
                                    setProductStatusFilter(next)
                                    fetchProducts(next)
                                }}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Alle</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => fetchProducts(productStatusFilter)} disabled={productsLoading}>
                            {productsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Vernieuwen
                        </Button>
                    </div>

                    {productsError && <p className="text-sm text-red-600">{productsError}</p>}

                    {productsLoading && !products.length ? (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Producten laden...
                        </div>
                    ) : products.length ? (
                        productList
                    ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-gray-600">
                            Nog geen producten gevonden. Voeg handmatig toe of gebruik bulk ingest.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm">
                <CardHeader className="text-[#081245]">
                    <CardTitle className={`flex items-center gap-2 ${outfit.className}`}>
                        <Store className="h-5 w-5" />
                        Of koppel je shop
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                        Gebruik je bestaande shopkoppeling voor automatische sync, of vul handmatig hierboven.
                    </p>
                </CardHeader>
                <CardContent>
                    {ecommerceIntegrations.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ecommerceIntegrations.map((integration) => renderIntegrationCard(integration))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-gray-600">
                            Geen e-commerce integraties gevonden.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )

    const isLoadingState = loading && !integrations.length
    const heading =
        mode === "integrations" ? "Integraties" : mode === "ecommerce" ? "E-commerce" : "Integraties & E-commerce"

    if (isLoadingState) return <div>Loading integrations...</div>
    if (error) return <div className="text-red-600">{error}</div>

    return (
        <>
            <div className="min-h-screen bg-gray-50 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className={`text-2xl font-bold text-[#081245] ${outfit.className}`}>{heading}</h2>
                        <p className="text-gray-600">Verbind je tools of beheer je producten handmatig.</p>
                    </div>
                </div>

                {mode === "both" ? (
                    <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as "integrations" | "ecommerce")} className="space-y-6">
                        <TabsList className="grid grid-cols-2 w-full md:w-[360px]">
                            <TabsTrigger value="integrations">Integraties</TabsTrigger>
                            <TabsTrigger value="ecommerce" className="flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" />
                                E-commerce
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="integrations" className="space-y-6">
                            {integrationsContent}
                        </TabsContent>

                        <TabsContent value="ecommerce" className="space-y-6">
                            {ecommerceContent}
                        </TabsContent>
                    </Tabs>
                ) : mode === "integrations" ? (
                    integrationsContent
                ) : (
                    ecommerceContent
                )}
            </div>

            <Dialog open={Boolean(modalIntegration)} onOpenChange={(open) => !open && setModalIntegration(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect {modalIntegration?.name}</DialogTitle>
                        <DialogDescription>
                            Vul de benodigde gegevens in om {modalIntegration?.name} te koppelen.
                        </DialogDescription>
                    </DialogHeader>

                    {modalIntegration && (
                        <>
                            {modalIntegration.connectMethod === "POST" && modalIntegration.name.toLowerCase().includes("shopify") && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Shopify shop domain</label>
                                    <Input
                                        placeholder="myshop.myshopify.com"
                                        value={shopifyForms[modalIntegration.id]?.shopDomain ?? ""}
                                        onChange={(e) =>
                                            setShopifyForms((prev) => ({
                                                ...prev,
                                                [modalIntegration.id]: { shopDomain: e.target.value },
                                            }))
                                        }
                                    />
                                </div>
                            )}

                            {modalIntegration.connectMethod === "POST" && modalIntegration.name.toLowerCase().includes("woo") && (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">WooCommerce store URL</label>
                                        <Input
                                            placeholder="https://store.example.com"
                                            value={wooForms[modalIntegration.id]?.storeUrl ?? ""}
                                            onChange={(e) =>
                                                setWooForms((prev) => ({
                                                    ...prev,
                                                    [modalIntegration.id]: { ...(prev[modalIntegration.id] ?? {}), storeUrl: e.target.value },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Consumer key</label>
                                        <Input
                                            value={wooForms[modalIntegration.id]?.consumerKey ?? ""}
                                            onChange={(e) =>
                                                setWooForms((prev) => ({
                                                    ...prev,
                                                    [modalIntegration.id]: { ...(prev[modalIntegration.id] ?? {}), consumerKey: e.target.value },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Consumer secret</label>
                                        <Input
                                            type="password"
                                            value={wooForms[modalIntegration.id]?.consumerSecret ?? ""}
                                            onChange={(e) =>
                                                setWooForms((prev) => ({
                                                    ...prev,
                                                    [modalIntegration.id]: { ...(prev[modalIntegration.id] ?? {}), consumerSecret: e.target.value },
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">API version (optioneel)</label>
                                        <Input
                                            placeholder="bijv. wc/v3"
                                            value={wooForms[modalIntegration.id]?.apiVersion ?? ""}
                                            onChange={(e) =>
                                                setWooForms((prev) => ({
                                                    ...prev,
                                                    [modalIntegration.id]: { ...(prev[modalIntegration.id] ?? {}), apiVersion: e.target.value },
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            )}

                            {modalError && <p className="text-sm text-red-600">{modalError}</p>}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setModalIntegration(null)}>
                                    Annuleer
                                </Button>
                                <Button
                                    onClick={() => {
                                        setModalError(null)
                                        if (modalIntegration) {
                                            handleConnect(modalIntegration, { viaModal: true })
                                        }
                                    }}
                                >
                                    Verbinden
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
