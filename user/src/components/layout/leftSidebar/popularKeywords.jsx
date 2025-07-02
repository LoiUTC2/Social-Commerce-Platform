"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { TrendingUp, Search, Hash, Clock, FlameIcon as Fire, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Separator } from "../../ui/separator"
import { getPopularSearches } from "../../../services/searchService"
import { getPopularHashtags } from "../../../services/hashtagsService"

const PopularKeywords = ({ className = "", showTitle = true }) => {
    const navigate = useNavigate()

    // State cho từ khóa
    const [popularSearches, setPopularSearches] = useState([])
    const [searchesPage, setSearchesPage] = useState(1)
    const [searchesHasMore, setSearchesHasMore] = useState(false)
    const [searchesLoading, setSearchesLoading] = useState(false)

    // State cho hashtags
    const [popularHashtags, setPopularHashtags] = useState([])
    const [hashtagsPage, setHashtagsPage] = useState(1)
    const [hashtagsHasMore, setHashtagsHasMore] = useState(false)
    const [hashtagsLoading, setHashtagsLoading] = useState(false)

    // State chung
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [error, setError] = useState(null)

    const ITEMS_PER_PAGE = 3

    // Load dữ liệu ban đầu
    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        try {
            setIsInitialLoading(true)
            setError(null)

            const [searchesResponse, hashtagsResponse] = await Promise.all([
                getPopularSearches({ limit: ITEMS_PER_PAGE, page: 1, timeRange: "7d" }),
                getPopularHashtags({ limit: ITEMS_PER_PAGE, page: 1 }),
            ])

            if (searchesResponse.success) {
                setPopularSearches(searchesResponse.data.searches || [])
                setSearchesHasMore(searchesResponse.data.pagination?.hasNextPage || false)
                setSearchesPage(1)
            }

            if (hashtagsResponse.success) {
                setPopularHashtags(hashtagsResponse.data.hashtags || [])
                setHashtagsHasMore(hashtagsResponse.data.pagination?.hasNextPage || false)
                setHashtagsPage(1)
            }
        } catch (err) {
            console.error("Error loading popular data:", err)
            setError("Không thể tải dữ liệu phổ biến")
        } finally {
            setIsInitialLoading(false)
        }
    }

    // Load thêm từ khóa
    const loadMoreSearches = async () => {
        if (searchesLoading) return

        try {
            setSearchesLoading(true)
            const nextPage = searchesPage + 1

            const response = await getPopularSearches({
                limit: ITEMS_PER_PAGE,
                page: nextPage,
                timeRange: "7d",
            })

            if (response.success) {
                setPopularSearches((prev) => [...prev, ...(response.data.searches || [])])
                setSearchesHasMore(response.data.pagination?.hasNextPage || false)
                setSearchesPage(nextPage)
            }
        } catch (err) {
            console.error("Error loading more searches:", err)
        } finally {
            setSearchesLoading(false)
        }
    }

    // Load thêm hashtags
    const loadMoreHashtags = async () => {
        if (hashtagsLoading) return

        try {
            setHashtagsLoading(true)
            const nextPage = hashtagsPage + 1

            const response = await getPopularHashtags({
                limit: ITEMS_PER_PAGE,
                page: nextPage,
            })

            if (response.success) {
                setPopularHashtags((prev) => [...prev, ...(response.data.hashtags || [])])
                setHashtagsHasMore(response.data.pagination?.hasNextPage || false)
                setHashtagsPage(nextPage)
            }
        } catch (err) {
            console.error("Error loading more hashtags:", err)
        } finally {
            setHashtagsLoading(false)
        }
    }

    // Thu gọn từ khóa về 3 kết quả đầu
    const collapseSearches = () => {
        setPopularSearches((prev) => prev.slice(0, ITEMS_PER_PAGE))
        setSearchesPage(1)
        setSearchesHasMore(true) // Reset hasMore để có thể load lại
    }

    // Thu gọn hashtags về 3 kết quả đầu
    const collapseHashtags = () => {
        setPopularHashtags((prev) => prev.slice(0, ITEMS_PER_PAGE))
        setHashtagsPage(1)
        setHashtagsHasMore(true) // Reset hasMore để có thể load lại
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const handleKeywordClick = (keyword) => {
        navigate(`/search?q=${encodeURIComponent(keyword)}`)
    }

    const handleHashtagClick = (hashtag) => {
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

    if (isInitialLoading) {
        return (
            <Card className={className}>
                {showTitle && (
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-pink-500" />
                                Xu hướng tìm kiếm
                            </CardTitle>
                        </div>
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
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-pink-500" />
                                Xu hướng tìm kiếm
                            </CardTitle>
                        </div>
                    </CardHeader>
                )}
                <CardContent className={showTitle ? "pt-0" : "p-4"}>
                    <div className="text-center py-4">
                        <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadInitialData}
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
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-pink-500" />
                                Xu hướng tìm kiếm
                            </CardTitle>
                        </div>
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
                            <div className="space-y-1 mb-2">
                                {popularSearches.map((search, index) => (
                                    <Button
                                        key={`${search.keyword}-${index}`}
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

                            {/* Nút điều khiển cho từ khóa */}
                            <div className="flex gap-2 mb-4">
                                {searchesHasMore && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadMoreSearches}
                                        disabled={searchesLoading}
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        {searchesLoading ? "Đang tải..." : "Xem thêm"}
                                    </Button>
                                )}
                                {popularSearches.length > ITEMS_PER_PAGE && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={collapseSearches}
                                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                    >
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Thu gọn
                                    </Button>
                                )}
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
                            <div className="space-y-1 mb-2">
                                {popularHashtags.map((hashtag, index) => (
                                    <Button
                                        key={`${hashtag.name}-${index}`}
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

                            {/* Nút điều khiển cho hashtags */}
                            <div className="flex gap-2">
                                {hashtagsHasMore && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={loadMoreHashtags}
                                        disabled={hashtagsLoading}
                                        className="text-pink-600 border-pink-200 hover:bg-pink-50"
                                    >
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        {hashtagsLoading ? "Đang tải..." : "Xem thêm"}
                                    </Button>
                                )}
                                {popularHashtags.length > ITEMS_PER_PAGE && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={collapseHashtags}
                                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                                    >
                                        <ChevronUp className="h-3 w-3 mr-1" />
                                        Thu gọn
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {/* View More Button */}
                <div className="mt-4 pt-3 border-t">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-pink-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                        onClick={() => navigate("/search")}
                    >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Xem thêm xu hướng
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default PopularKeywords
