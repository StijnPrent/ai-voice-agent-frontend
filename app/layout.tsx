import type {Metadata} from 'next'
import './globals.css'
import RouteGuard from "@/components/RouteGuard";
import {Toaster} from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: 'aivoiceagent',
    description: 'Created with v0',
    generator: 'v0.dev',
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body>
        <RouteGuard>
            {children}
        </RouteGuard>
        <Toaster/>
        </body>
        </html>
    )
}
