"use client"

import { useState, useEffect } from "react"
import { Hash, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { getPopularHashtags } from "../../services/hashtagsService"

const PopularHashtags = ({ onHashtagClick, className = "" }) => {
    const [hashtags, setHashtags] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadPopularHashtags = async () => {
            try {
                setIsLoading(true)
                setError(null)

                const response = await getPopularHashtags(15) // Lấy 15 hashtag phổ biến

                if (response.success) {
                    setHashtags(response.data)
                } else {
                    setError("Không thể tải hashtag phổ biến")
                }
            } catch (err) {
                console.error("Error loading popular hashtags:", err)
                setError("Lỗi khi tải hashtag phổ biến")
            } finally {
                setIsLoading(false)
            }
        }

        loadPopularHashtags()
    }, [])

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const handleHashtagClick = (hashtag) => {
        if (onHashtagClick) {
            onHashtagClick(hashtag.name)
        }
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Hashtag nổi bật
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Hashtag nổi bật
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <Hash className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-2 text-pink-500 hover:text-pink-600 text-sm">
                            Thử lại
                        </button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (hashtags.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Hashtag nổi bật
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <Hash className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Chưa có hashtag nào</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-pink-500" />
                    Hashtag nổi bật
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {hashtags.map((hashtag, index) => (
                        <Button
                            key={hashtag.name}
                            variant="ghost"
                            className="w-full justify-start h-auto p-2 text-left hover:bg-pink-50 hover:text-pink-700 transition-colors"
                            onClick={() => handleHashtagClick(hashtag)}
                        >
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-pink-500" />
                                    <span className="text-sm font-medium">#{hashtag.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {formatNumber(hashtag.usageCount)}
                                    </Badge>
                                    {index < 3 && <Badge className="text-xs bg-gradient-to-r from-pink-500 to-purple-500">Hot</Badge>}
                                </div>
                            </div>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default PopularHashtags
