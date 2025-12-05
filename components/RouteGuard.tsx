'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, removeToken } from '@/utils/auth'
import OverviewSkeleton from "@/components/skeletons/OverviewSkeleton"
import { fetchCompanySetupStatus } from "@/lib/company-setup"

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
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/create-account']
    const onboardingPaths = ['/onboarding', '/onboarding/company-setup']

    useEffect(() => {
        let cancelled = false

        // Hide page content to stop flash while redirecting
        setAuthorized(false)

        const authCheck = async () => {
            // Check if current path is public
            if (publicPaths.includes(pathname)) {
                if (!cancelled) {
                    setAuthorized(true)
                }
                return
            }

            // Check if user is authenticated
            if (!isAuthenticated()) {
                // Remove invalid/expired token
                removeToken()

                // Redirect to login with return url
                const returnUrl = encodeURIComponent(pathname)
                router.push(`/login?returnUrl=${returnUrl}`)
                return
            }

            try {
                const setupStatus = await fetchCompanySetupStatus({ bypassCache: true })
                if (cancelled) {
                    return
                }

                const needsSetup = setupStatus.needsSetup

                if (onboardingPaths.includes(pathname)) {
                    if (needsSetup) {
                        setAuthorized(true)
                    } else {
                        router.replace('/')
                    }
                    return
                }

                if (needsSetup) {
                    router.replace('/onboarding/company-setup')
                    return
                }

                setAuthorized(true)
            } catch (error) {
                console.error('Route guard onboarding check failed', error)
                router.replace('/onboarding/company-setup')
            }
        }

        void authCheck()

        return () => {
            cancelled = true
        }
    }, [pathname, router])

    return authorized ? <>{children}</> : fallback
}

export default RouteGuard
