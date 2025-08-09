import React from 'react'
import Skeleton from './Skeleton'

const IntegrationsSkeleton: React.FC = () => {
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
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Skeleton width={150} height={28} className="mb-2" />
                        <Skeleton width={250} height={16} />
                    </div>
                    <Skeleton width={180} height={40} className="bg-gray-800" />
                </div>

                {/* Search and Filter */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex-1 max-w-md">
                        <Skeleton width="100%" height={40} />
                    </div>
                    <div className="flex space-x-2 ml-4">
                        <Skeleton width={60} height={40} className="bg-gray-800" />
                        <Skeleton width={90} height={40} />
                    </div>
                </div>

                {/* Integration Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <Skeleton variant="rectangular" width={48} height={48} />
                                    <div>
                                        <Skeleton width={120} height={20} className="mb-2" />
                                        <div className="flex items-center space-x-2">
                                            <Skeleton variant="circular" width={8} height={8} />
                                            <Skeleton width={80} height={14} />
                                        </div>
                                    </div>
                                </div>
                                <Skeleton variant="circular" width={24} height={24} />
                            </div>

                            <Skeleton width="100%" height={14} className="mb-4" />

                            <div className="flex items-center justify-between">
                                <Skeleton width={140} height={12} />
                                <Skeleton width={80} height={36} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom notification */}
            <div className="fixed bottom-4 left-4">
                <div className="bg-red-500 rounded-full p-2">
                    <Skeleton variant="circular" width={20} height={20} className="bg-red-400" />
                </div>
            </div>
        </div>
    )
}

export default IntegrationsSkeleton