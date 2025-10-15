'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, removeToken } from '@/utils/auth'
import OverviewSkeleton from "@/components/skeletons/OverviewSkeleton";

interface RouteGuardProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

const RouteGuard: React.FC<RouteGuardProps> = ({
                                                   children,
                                                   fallback = <OverviewSkeleton></OverviewSkeleton>
                                               }) => {
    const router = useRouter()
    const pathname = usePathname()
    const [authorized, setAuthorized] = useState(false)

    // Public routes that don't require authentication
    const publicPaths = ['/login', '/register', '/forgot-password', '/create-account']

    useEffect(() => {
        // Hide page content to stop flash while redirecting
        setAuthorized(false)

        const authCheck = () => {
            // Check if current path is public
            if (publicPaths.includes(pathname)) {
                setAuthorized(true)
                return
            }

            // Check if user is authenticated
            if (isAuthenticated()) {
                setAuthorized(true)
            } else {
                // Remove invalid/expired token
                removeToken()

                // Redirect to login with return url
                const returnUrl = encodeURIComponent(pathname)
                router.push(`/login?returnUrl=${returnUrl}`)
            }
        }

        authCheck()
    }, [pathname, router])

    return authorized ? <>{children}</> : fallback
}

export default RouteGuard
