"use client"

import { Card, CardContent } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"
import { Brain, Sparkles } from "lucide-react"

const AIRecommendationsSkeleton = () => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-6 mb-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-full">
                    <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Skeleton className="h-8 w-48" />
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span className="text-xs">AI</span>
                        </div>
                    </div>
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>

        {/* AI Metadata Skeleton */}
        <div className="bg-white/50 rounded-lg p-3 mb-6 border border-purple-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
            </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="grid grid-cols-4 gap-2 bg-white shadow-sm rounded-lg p-1 mb-6">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-md" />
            ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-8">
            {/* Flash Sales Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <FlashSaleCardSkeleton key={i} />
                    ))}
                </div>

                <div className="flex justify-center">
                    <Skeleton className="h-10 w-40 rounded-full" />
                </div>
            </div>

            {/* Products Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    </div>
)

// Flash Sale Card Skeleton
const FlashSaleCardSkeleton = () => (
    <Card className="overflow-hidden border-0 shadow-md bg-white">
        <CardContent className="p-0">
            <div className="bg-gray-200 p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                <div className="bg-gray-300 rounded-lg p-2 mt-2">
                    <Skeleton className="h-3 w-20 mb-1" />
                    <div className="flex gap-1">
                        <Skeleton className="h-6 w-8 rounded" />
                        <span className="text-gray-400">:</span>
                        <Skeleton className="h-6 w-8 rounded" />
                        <span className="text-gray-400">:</span>
                        <Skeleton className="h-6 w-8 rounded" />
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_, j) => (
                        <Skeleton key={j} className="h-16 w-full rounded-lg" />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_, j) => (
                        <div key={j} className="bg-gray-50 rounded-lg p-2 text-center">
                            <Skeleton className="h-4 w-8 mx-auto mb-1" />
                            <Skeleton className="h-3 w-12 mx-auto" />
                        </div>
                    ))}
                </div>

                <Skeleton className="h-8 w-full rounded-full" />
            </div>
        </CardContent>
    </Card>
)

// Product Card Skeleton
const ProductCardSkeleton = () => (
    <Card className="overflow-hidden transition-all duration-300 border-0 bg-white rounded-2xl">
        <div className="relative">
            <div className="relative h-32 sm:h-36 overflow-hidden bg-gray-200 rounded-t-2xl">
                <Skeleton className="w-full h-full" />

                {/* Badges */}
                <div className="absolute top-2 left-2">
                    <Skeleton className="h-5 w-8 rounded-full" />
                </div>
                <div className="absolute top-2 right-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>
            </div>

            <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-baseline gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-7 w-full rounded-full" />
            </CardContent>
        </div>
    </Card>
)

export default AIRecommendationsSkeleton
