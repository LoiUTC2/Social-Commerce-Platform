"use client"

import { Card, CardContent } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"
import { Zap, FlameIcon as Fire } from "lucide-react"

const FlashSalesSkeleton = () => (
    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl shadow-lg p-6 mb-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-full">
                    <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
            </div>
            <Skeleton className="h-10 w-24" />
        </div>

        {/* Hot Flash Sales Section Skeleton */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-full">
                    <Fire className="w-5 h-5 text-white" />
                </div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[...Array(3)].map((_, i) => (
                    <HotFlashSaleCardSkeleton key={i} rank={i + 1} />
                ))}
            </div>

            <div className="border-t border-pink-200 my-6"></div>
        </div>

        {/* Regular Flash Sales Section Skeleton */}
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                {[...Array(5)].map((_, i) => (
                    <FlashSaleCardSkeleton key={i} />
                ))}
            </div>

            <div className="flex justify-center">
                <Skeleton className="h-10 w-32 rounded-full" />
            </div>
        </div>
    </div>
)

// Hot Flash Sale Card Skeleton
const HotFlashSaleCardSkeleton = ({ rank }) => {
    const getRankColor = () => {
        switch (rank) {
            case 1:
                return "from-yellow-400 to-orange-500"
            case 2:
                return "from-gray-300 to-gray-500"
            case 3:
                return "from-orange-400 to-red-500"
            default:
                return "from-pink-500 to-rose-500"
        }
    }

    return (
        <Card className="overflow-hidden border-0 shadow-lg bg-white relative">
            {/* Rank Badge */}
            <div className="absolute -top-2 -left-2 z-10">
                <div
                    className={`bg-gradient-to-r ${getRankColor()} text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg`}
                >
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                </div>
            </div>

            {/* Hot Badge */}
            <div className="absolute top-2 right-2 z-10">
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <CardContent className="p-0">
                {/* Header Skeleton */}
                <div className={`bg-gradient-to-r ${getRankColor()} p-4 text-white`}>
                    <div className="pt-2">
                        <Skeleton className="h-5 w-3/4 mb-1 bg-white/20" />
                        <Skeleton className="h-4 w-full mb-3 bg-white/20" />

                        <div className="grid grid-cols-2 gap-2">
                            {[...Array(2)].map((_, j) => (
                                <div key={j} className="bg-white/20 rounded-lg p-2">
                                    <Skeleton className="h-3 w-16 mb-1 bg-white/30" />
                                    <Skeleton className="h-4 w-12 bg-white/30" />
                                </div>
                            ))}
                        </div>

                        <div className="bg-black/30 rounded-lg p-2 mt-3">
                            <Skeleton className="h-3 w-20 mb-1 bg-white/30" />
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, j) => (
                                    <Skeleton key={j} className="h-6 w-8 rounded bg-white/30" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Skeleton */}
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
}

// Regular Flash Sale Card Skeleton
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

export default FlashSalesSkeleton
