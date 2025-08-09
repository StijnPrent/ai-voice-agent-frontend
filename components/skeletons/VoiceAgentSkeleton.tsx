import React from 'react'
import Skeleton from './Skeleton'

const VoiceAgentSkeleton: React.FC = () => {
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
        <Skeleton width={200} height={28} className="mb-2" />
    <Skeleton width={300} height={16} />
    </div>
    <Skeleton width={140} height={40} className="bg-gray-800" />
        </div>

    {/* Tab Navigation */}
    <div className="flex space-x-8 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
            <Skeleton variant="circular" width={16} height={16} />
    <Skeleton width={70} height={16} />
    </div>
))}
    </div>

    {/* Settings Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Voice Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="mb-6">
    <div className="flex items-center space-x-2 mb-2">
    <Skeleton variant="circular" width={20} height={20} />
    <Skeleton width={120} height={20} />
    </div>
    <Skeleton width={200} height={14} />
    </div>

    <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <Skeleton width={80} height={16} />
    <Skeleton variant="circular" width={24} height={24} />
    </div>
))}
    </div>
    </div>

    {/* Voice Parameters */}
    <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="mb-6">
    <Skeleton width={140} height={20} className="mb-2" />
    <Skeleton width={180} height={14} />
    </div>

    {/* Speaking Speed */}
    <div className="mb-6">
    <Skeleton width={100} height={16} className="mb-3" />
    <div className="flex items-center justify-between mb-2">
    <Skeleton width={40} height={12} />
    <Skeleton width={30} height={12} />
    <Skeleton width={30} height={12} />
    </div>
    <div className="relative">
    <Skeleton width="100%" height={4} className="rounded-full" />
    <Skeleton variant="circular" width={20} height={20} className="absolute top-1/2 transform -translate-y-1/2" style={{ left: '75%' }} />
    </div>
    </div>

    {/* Greeting Message */}
    <div>
        <Skeleton width={120} height={16} className="mb-3" />
    <div className="border border-gray-200 rounded-lg p-4 min-h-[100px]">
    <Skeleton width="90%" height={16} className="mb-2" />
    <Skeleton width="60%" height={16} />
    </div>
    <Skeleton width={250} height={12} className="mt-2" />
        </div>
        </div>
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

export default VoiceAgentSkeleton