// components/CompanyProfileSkeleton.tsx
import React from 'react'
import Skeleton from './Skeleton'

export const CompanyProfileSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton variant="text" width={200} height={32} className="mb-2" />
                        <Skeleton variant="text" width={300} height={16} />
                    </div>
                    <Skeleton
                        variant="rectangular"
                        width={120}
                        height={32}
                        className="rounded-full"
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Company Overview Card */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg border">
                        <div className="flex items-center space-x-2 mb-6">
                            <Skeleton width={20} height={20} />
                            <Skeleton variant="text" width={180} height={24} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i}>
                                    <Skeleton variant="text" width={100} height={16} className="mb-2" />
                                    <Skeleton width="100%" height={40} />
                                </div>
                            ))}
                        </div>

                        <div>
                            <Skeleton variant="text" width={120} height={16} className="mb-2" />
                            <Skeleton width="100%" height={80} />
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-white p-6 rounded-lg border">
                        <Skeleton variant="text" width={150} height={24} className="mb-4" />
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center space-x-3">
                                    <Skeleton width={16} height={16} />
                                    <div className="flex-1">
                                        <Skeleton variant="text" width={80} height={16} className="mb-2" />
                                        <Skeleton width="100%" height={40} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Business Settings Card */}
                <div className="bg-white p-6 rounded-lg border">
                    <Skeleton variant="text" width={140} height={24} className="mb-2" />
                    <Skeleton variant="text" width={250} height={16} className="mb-6" />

                    <div className="space-y-4">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
                                <Skeleton variant="text" width={60} height={16} />
                                <Skeleton width={60} height={32} />
                                <Skeleton width={100} height={32} />
                                <Skeleton width={100} height={32} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Info Card */}
                <div className="bg-white p-6 rounded-lg border">
                    <Skeleton variant="text" width={220} height={24} className="mb-2" />
                    <Skeleton variant="text" width={400} height={16} className="mb-4" />

                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-2">
                                <Skeleton width="100%" height={40} />
                                <Skeleton variant="circular" width={32} height={32} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
