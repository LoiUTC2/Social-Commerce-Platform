"use client"

import { useState, useEffect } from "react"
import { Button } from "../../ui/button"
import { useNavigate } from "react-router-dom"
import { getHomepageFlashSales, getFlashSaleForUser, getHotFlashSales } from "../../../services/flashSaleService"
import { Zap, ChevronDown, ChevronUp, ArrowRight, FlameIcon as Fire, TrendingUp } from "lucide-react"
import FlashSaleCard from "./FlashSaleCard"
import HotFlashSaleCard from "./HotFlashSaleCard"
import AIRecommendedFlashSales from "./AIRecommendedFlashSales"
import FlashSaleDetailModal from "./FlashSaleDetailModal"
import FlashSalesSkeleton from "./FlashSalesSkeleton"

const FlashSale = () => {
  const navigate = useNavigate()
  const [flashSales, setFlashSales] = useState([])
  const [hotFlashSales, setHotFlashSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [hotLoading, setHotLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)

  // Modal state
  const [selectedFlashSale, setSelectedFlashSale] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)

  const ITEMS_PER_PAGE = 5

  useEffect(() => {
    fetchFlashSales()
    fetchHotFlashSales()
  }, [currentPage])

  const fetchFlashSales = async () => {
    try {
      setLoading(true)
      const response = await getHomepageFlashSales(currentPage, ITEMS_PER_PAGE)

      if (currentPage === 1) {
        setFlashSales(response.data?.items || [])
      } else {
        setFlashSales((prev) => [...prev, ...(response.data?.items || [])])
      }

      setTotalPages(response.data?.pagination?.totalPages || 1)
    } catch (err) {
      setError("Không thể tải dữ liệu Flash Sale")
      console.error("Error fetching flash sales:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchHotFlashSales = async () => {
    try {
      setHotLoading(true)
      const response = await getHotFlashSales(3) // Lấy top 3 hot flash sales
      setHotFlashSales(response.data?.items || [])
    } catch (err) {
      console.error("Error fetching hot flash sales:", err)
    } finally {
      setHotLoading(false)
    }
  }

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
      setIsExpanded(true)
    }
  }

  const handleCollapse = () => {
    setFlashSales((prev) => prev.slice(0, ITEMS_PER_PAGE))
    setCurrentPage(1)
    setIsExpanded(false)
  }

  const handleFlashSaleClick = async (flashSaleId) => {
    try {
      setModalLoading(true)
      setModalOpen(true)

      const response = await getFlashSaleForUser(flashSaleId)
      setSelectedFlashSale(response.data)
    } catch (err) {
      console.error("Error fetching flash sale details:", err)
      setError("Không thể tải chi tiết Flash Sale")
    } finally {
      setModalLoading(false)
    }
  }

  const handleViewAllFlashSales = () => {
    navigate("/marketplace/flash-sales")
  }

  if (loading && currentPage === 1 && hotLoading) {
    return <FlashSalesSkeleton />
  }

  if (error && flashSales.length === 0 && hotFlashSales.length === 0) {
    return (
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl shadow-lg p-6 mb-8">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button
            onClick={() => {
              fetchFlashSales()
              fetchHotFlashSales()
            }}
            variant="outline"
          >
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
    {/* AI Recommended Flash Sales Section */}
      <AIRecommendedFlashSales />
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl shadow-lg p-6 mb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-full">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Flash Sale
              </h2>
              <p className="text-gray-600 text-sm">Giá sốc mỗi ngày - Số lượng có hạn</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 transition-all duration-300"
            onClick={handleViewAllFlashSales}
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Hot Flash Sales Section */}
        {hotFlashSales.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-full">
                <Fire className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                🔥 Flash Sale HOT nhất
              </h3>
              <div className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <span className="text-red-600 text-xs font-semibold">Trending</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {hotFlashSales.map((flashSale, index) => (
                <HotFlashSaleCard
                  key={flashSale._id}
                  flashSale={flashSale}
                  rank={index + 1}
                  onClick={() => handleFlashSaleClick(flashSale._id)}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-pink-200 my-6"></div>
          </div>
        )}

        {/* Regular Flash Sales Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Tất cả Flash Sale</h3>
            <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-medium">
              {flashSales.length} chương trình
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            {flashSales.map((flashSale) => (
              <FlashSaleCard
                key={flashSale._id}
                flashSale={flashSale}
                onClick={() => handleFlashSaleClick(flashSale._id)}
              />
            ))}
          </div>

          {/* Load More / Collapse Buttons */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3">
              {!isExpanded && currentPage < totalPages && (
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-2 rounded-full transition-all duration-300"
                >
                  {loading ? (
                    "Đang tải..."
                  ) : (
                    <>
                      Xem thêm
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}

              {isExpanded && (
                <Button
                  onClick={handleCollapse}
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 px-6 py-2 rounded-full transition-all duration-300"
                >
                  Thu gọn
                  <ChevronUp className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flash Sale Detail Modal */}
      <FlashSaleDetailModal
        flashSale={selectedFlashSale}
        open={modalOpen}
        onOpenChange={setModalOpen}
        loading={modalLoading}
      />
    </>
  )
}

export default FlashSale
