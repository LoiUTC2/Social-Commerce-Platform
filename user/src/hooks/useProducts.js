"use client"

import { useState, useEffect } from "react"
import { getFeaturedProducts, getSuggestedProducts, getLatestProducts } from "../services/productService"

// Hook cho sản phẩm nổi bật
export const useFeaturedProducts = (limit = 12, category = null) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await getFeaturedProducts(1, limit, category)

                if (response.success) {
                    setProducts(response.data.products || [])
                    setPagination(response.data.pagination || null)
                } else {
                    setError(response.message || "Không thể tải sản phẩm nổi bật")
                }
            } catch (err) {
                console.error("Error fetching featured products:", err)
                setError("Lỗi kết nối. Vui lòng thử lại sau.")
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [limit, category])

    return { products, loading, error, pagination }
}

// Hook cho sản phẩm gợi ý
export const useSuggestedProducts = (limit = 12, method = "hybrid") => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState(null)
    const [metadata, setMetadata] = useState(null)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await getSuggestedProducts(1, limit, method)

                if (response.success) {
                    setProducts(response.data.products || [])
                    setPagination(response.data.pagination || null)
                    setMetadata(response.data.metadata || null)
                } else {
                    setError(response.message || "Không thể tải sản phẩm gợi ý")
                }
            } catch (err) {
                console.error("Error fetching suggested products:", err)
                setError("Lỗi kết nối. Vui lòng thử lại sau.")
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [limit, method])

    return { products, loading, error, pagination, metadata }
}

// Hook cho sản phẩm mới nhất
export const useLatestProducts = (limit = 12, timeRange = "all") => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pagination, setPagination] = useState(null)

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await getLatestProducts(1, limit, timeRange)

                if (response.success) {
                    setProducts(response.data.products || [])
                    setPagination(response.data.pagination || null)
                } else {
                    setError(response.message || "Không thể tải sản phẩm mới nhất")
                }
            } catch (err) {
                console.error("Error fetching latest products:", err)
                setError("Lỗi kết nối. Vui lòng thử lại sau.")
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [limit, timeRange])

    return { products, loading, error, pagination }
}
