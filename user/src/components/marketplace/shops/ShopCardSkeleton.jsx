"use client"
import { Card, CardContent } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"

const ShopCardSkeleton = ({ className = "" }) => (
    <Card className={`overflow-hidden shadow-lg ${className}`}>
        <CardContent className="p-0">
            {/* Cover skeleton */}
            <div className="relative">
                <Skeleton className="h-40 w-full bg-gradient-to-r from-pink-100 via-pink-50 to-purple-100" />
                {/* Avatar skeleton */}
                <div className="absolute -bottom-8 left-6">
                    <Skeleton className="w-16 h-16 rounded-2xl bg-white border-4 border-white" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="p-6 pt-12">
                <Skeleton className="h-6 w-3/4 mb-2 bg-gray-200" />
                <Skeleton className="h-4 w-20 mb-4 bg-green-100" />
                <Skeleton className="h-4 w-full mb-2 bg-gray-100" />
                <Skeleton className="h-4 w-2/3 mb-4 bg-gray-100" />

                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                        <Skeleton className="h-6 w-12 rounded-lg bg-yellow-100" />
                        <Skeleton className="h-6 w-12 rounded-lg bg-pink-100" />
                    </div>
                    <Skeleton className="h-4 w-8 bg-gray-100" />
                </div>

                <Skeleton className="h-4 w-24 mb-4 bg-gray-100" />
                <Skeleton className="h-6 w-20 rounded-full bg-pink-100" />
            </div>
        </CardContent>
    </Card>
)

export default ShopCardSkeleton