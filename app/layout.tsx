import type {Metadata} from 'next'
import './globals.css'
import RouteGuard from "@/components/RouteGuard";
import {Toaster} from "@/components/ui/toaster";
import { Outfit } from "next/font/google";

const outfit = Outfit({
    subsets: ["latin"],
    weight: ["600", "700"],
    variable: "--font-outfit",
})

export const metadata: Metadata = {
    title: 'Callingbird - Dashboard',
    description: 'Callingbird is jouw AI telefoon assistent die je oproepen en berichten afhandelt.',
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={outfit.variable}>
        <body>
        <RouteGuard>
            {children}
        </RouteGuard>
        <Toaster/>
        </body>
        </html>
    )
}
