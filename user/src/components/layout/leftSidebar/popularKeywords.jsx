"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { TrendingUp, Search, Hash, Clock, FlameIcon as Fire } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Separator } from "../../ui/separator"
import { getPopularSearches } from "../../../services/searchService"
import { getPopularHashtags } from "../../../services/hashtagsService"

const PopularKeywords = ({ className = "", showTitle = true, maxItems = 10 }) => {
    const navigate = useNavigate()
    const [popularSearches, setPopularSearches] = useState([])
    const [popularHashtags, setPopularHashtags] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadPopularData = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Fetch both popular searches and hashtags in parallel
                const [searchesResponse, hashtagsResponse] = await Promise.all([
                    getPopularSearches(Math.ceil(maxItems / 2), "7d"),
                    getPopularHashtags(Math.ceil(maxItems / 2)),
                ])

                if (searchesResponse.success) {
                    setPopularSearches(searchesResponse.data.searches || [])
                }

                if (hashtagsResponse.success) {
                    setPopularHashtags(hashtagsResponse.data || [])
                }
            } catch (err) {
                console.error("Error loading popular data:", err)
                setError("Không thể tải dữ liệu phổ biến")
            } finally {
                setIsLoading(false)
            }
        }

        loadPopularData()
    }, [maxItems])

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const handleKeywordClick = (keyword) => {
        // Navigate to search page and use searchAll API
        navigate(`/search?q=${encodeURIComponent(keyword)}`)
    }

    const handleHashtagClick = (hashtag) => {
        // Navigate to search page and use searchByHashtag API
        navigate(`/search?hashtag=${encodeURIComponent(hashtag)}`)
    }

    const getTimeAgo = (date) => {
        const now = new Date()
        const searchDate = new Date(date)
        const diffInHours = Math.floor((now - searchDate) / (1000 * 60 * 60))

        if (diffInHours < 1) return "Vừa xong"
        if (diffInHours < 24) return `${diffInHours}h trước`
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d trước`
        return searchDate.toLocaleDateString("vi-VN")
    }

    if (isLoading) {
        return (
            <Card className={className}>
                {showTitle && (
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-pink-500" />
                            Xu hướng tìm kiếm
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent className={showTitle ? "pt-0" : "p-4"}>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className={className}>
                {showTitle && (
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-pink-500" />
                            Xu hướng tìm kiếm
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent className={showTitle ? "pt-0" : "p-4"}>
                    <div className="text-center py-4">
                        <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="mt-2 text-pink-500 hover:text-pink-600"
                        >
                            Thử lại
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (popularSearches.length === 0 && popularHashtags.length === 0) {
        return (
            <Card className={className}>
                {showTitle && (
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="h-5 w-5 text-pink-500" />
                            Xu hướng tìm kiếm
                        </CardTitle>
                    </CardHeader>
                )}
                <CardContent className={showTitle ? "pt-0" : "p-4"}>
                    <div className="text-center py-4">
                        <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">Chưa có dữ liệu xu hướng</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            {showTitle && (
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-pink-500" />
                        Xu hướng tìm kiếm
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className={showTitle ? "pt-0" : "p-4"}>
                <div className="space-y-1">
                    {/* Popular Keywords Section */}
                    {popularSearches.length > 0 && (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <Search className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium text-gray-700">Từ khóa phổ biến</span>
                            </div>
                            <div className="space-y-1 mb-4">
                                {popularSearches.slice(0, Math.ceil(maxItems / 2)).map((search, index) => (
                                    <Button
                                        key={search.keyword}
                                        variant="ghost"
                                        className="w-full justify-start h-auto p-2 text-left hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        onClick={() => handleKeywordClick(search.keyword)}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                                                    {index + 1}
                                                </div>
                                                <span className="text-sm font-medium truncate">{search.keyword}</span>
                                                {index < 3 && <Fire className="h-3 w-3 text-orange-500" />}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Badge variant="outline" className="text-xs">
                                                    {formatNumber(search.count)}
                                                </Badge>
                                                <Clock className="h-3 w-3" />
                                                <span>{getTimeAgo(search.lastSearched)}</span>
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Separator if both sections exist */}
                    {popularSearches.length > 0 && popularHashtags.length > 0 && <Separator className="my-3" />}

                    {/* Popular Hashtags Section */}
                    {popularHashtags.length > 0 && (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <Hash className="h-4 w-4 text-pink-500" />
                                <span className="text-sm font-medium text-gray-700">Hashtag nổi bật</span>
                            </div>
                            <div className="space-y-1">
                                {popularHashtags.slice(0, Math.ceil(maxItems / 2)).map((hashtag, index) => (
                                    <Button
                                        key={hashtag.name}
                                        variant="ghost"
                                        className="w-full justify-start h-auto p-2 text-left hover:bg-pink-50 hover:text-pink-700 transition-colors"
                                        onClick={() => handleHashtagClick(hashtag.name)}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-pink-500" />
                                                <span className="text-sm font-medium">#{hashtag.name}</span>
                                                {index < 3 && (
                                                    <Badge className="text-xs bg-gradient-to-r from-pink-500 to-purple-500">Hot</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {formatNumber(hashtag.usageCount)}
                                                </Badge>
                                                <span className="text-xs text-gray-500">{getTimeAgo(hashtag.lastUsedAt)}</span>
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* View More Button */}
                <div className="mt-4 pt-3 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-pink-500 hover:text-pink-600 hover:bg-pink-50"
                        onClick={() => navigate("/search")}
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Xem thêm xu hướng
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default PopularKeywords
