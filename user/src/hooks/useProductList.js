"use client"

import { useState, useEffect, useCallback } from "react"
import { getFeaturedProducts, getSuggestedProducts, getLatestProducts } from "../services/productService"

export const useProductList = (type, initialLimit = 18) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState(null)
    const [metadata, setMetadata] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [isExpanded, setIsExpanded] = useState(false)

    const ITEMS_PER_PAGE = 6 // Mỗi lần load thêm 6 sản phẩm (1 hàng)

    // Function để fetch products dựa trên type
    const fetchProducts = useCallback(
        async (page, limit, isLoadMore = false) => {
            try {
                if (isLoadMore) {
                    setLoadingMore(true)
                } else {
                    setLoading(true)
                    setError(null)
                }

                let response
                switch (type) {
                    case "featured":
                        response = await getFeaturedProducts(page, limit)
                        break
                    case "suggested":
                        response = await getSuggestedProducts(page, limit, "hybrid")
                        break
                    case "latest":
                        response = await getLatestProducts(page, limit, "all")
                        break
                    default:
                        throw new Error("Invalid product type")
                }

                if (response.success) {
                    const newProducts = response.data.products || []

                    if (isLoadMore) {
                        setProducts((prev) => [...prev, ...newProducts])
                    } else {
                        setProducts(newProducts)
                    }

                    setPagination(response.data.pagination || null)
                    setMetadata(response.data.metadata || null)

                    // Check if there are more products to load
                    const totalLoaded = isLoadMore ? products.length + newProducts.length : newProducts.length
                    const totalAvailable = response.data.pagination?.total || 0
                    setHasMore(totalLoaded < totalAvailable)
                } else {
                    setError(response.message || `Không thể tải sản phẩm ${type}`)
                }
            } catch (err) {
                console.error(`Error fetching ${type} products:`, err)
                setError("Lỗi kết nối. Vui lòng thử lại sau.")
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        [type, products.length],
    )

    // Load initial products
    useEffect(() => {
        setCurrentPage(1)
        fetchProducts(1, initialLimit, false)
    }, [type, initialLimit])

    // Load more products
    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            const nextPage = Math.ceil(products.length / ITEMS_PER_PAGE) + 1
            setCurrentPage(nextPage)
            setIsExpanded(true)
            fetchProducts(nextPage, ITEMS_PER_PAGE, true)
        }
    }, [loadingMore, hasMore, products.length, fetchProducts])

    // Collapse to initial state
    const collapse = useCallback(() => {
        setCurrentPage(1)
        setIsExpanded(false)
        fetchProducts(1, initialLimit, false)
    }, [initialLimit, fetchProducts])

    // Retry function
    const retry = useCallback(() => {
        setCurrentPage(1)
        setIsExpanded(false)
        fetchProducts(1, initialLimit, false)
    }, [initialLimit, fetchProducts])

    return {
        products,
        loading,
        loadingMore,
        error,
        pagination,
        metadata,
        hasMore,
        isExpanded,
        loadMore,
        collapse,
        retry,
    }
}
