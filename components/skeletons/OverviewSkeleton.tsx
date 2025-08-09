import React from 'react'
import Skeleton from './Skeleton'

const OverviewSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Skeleton variant="circular" width={32} height={32} />
                        <Skeleton width={120} height={24} />
                        <Skeleton width={60} height={20} className="bg-gray-100" />
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Skeleton variant="circular" width={8} height={8} />
                            <Skeleton width={80} height={16} />
                        </div>
                        <Skeleton width={60} height={32} />
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex space-x-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-2 py-4">
                            <Skeleton variant="circular" width={16} height={16} />
                            <Skeleton width={80} height={16} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <Skeleton width={80} height={14} />
                                <Skeleton variant="circular" width={20} height={20} />
                            </div>
                            <Skeleton width={60} height={32} className="mb-2" />
                            <Skeleton width={40} height={12} />
                        </div>
                    ))}
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="mb-4">
                            <Skeleton width={120} height={20} className="mb-2" />
                            <Skeleton width={200} height={14} />
                        </div>
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-start space-x-3">
                                    <Skeleton variant="circular" width={32} height={32} />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton width="85%" height={14} />
                                        <Skeleton width="45%" height={12} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="mb-4">
                            <Skeleton width={100} height={20} className="mb-2" />
                            <Skeleton width={150} height={14} />
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                    <Skeleton variant="circular" width={20} height={20} />
                                    <Skeleton width="75%" height={14} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OverviewSkeleton