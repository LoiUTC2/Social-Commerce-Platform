"use client"

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Package, TrendingUp } from 'lucide-react'
import { getCategoriesByLevel } from '../../services/categoryService'
import { navigateToCategory } from '../../utils/searchNavigation'

const MarketplaceCategory = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await getCategoriesByLevel(1)

        if (response.success) {
          console.log("tenCategory", response.data.categories)
          // Sắp xếp theo sortOrder và chỉ lấy tối đa 12 danh mục
          const sortedCategories = response.data.categories
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .slice(0, 12)

          setCategories(sortedCategories)
        } else {
          setError('Không thể tải danh mục')
        }
      } catch (err) {
        console.error('Error loading categories:', err)
        setError('Lỗi khi tải danh mục')
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  const handleCategoryClick = (category) => {
    navigateToCategory(navigate, category._id, category.name)
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">📚 Danh mục nổi bật</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mb-2"></div>
              <div className="h-4 w-12 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">📚 Danh mục nổi bật</h2>
        <div className="text-center py-8">
          <Folder className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-pink-500 hover:text-pink-600 text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">📚 Danh mục nổi bật</h2>
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Chưa có danh mục nào</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-pink-500" />
          Danh mục nổi bật
        </h2>
        <span className="text-sm text-gray-500">
          {categories.length} danh mục
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4">
        {categories.map((category) => (
          <div
            key={category._id}
            className="flex flex-col items-center text-center text-sm hover:scale-105 cursor-pointer transition-all duration-200 group"
            onClick={() => handleCategoryClick(category)}
          >
            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 shadow-md group-hover:shadow-lg transition-shadow relative">
              {category.icon ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-pink-100 text-2xl">
                  {category.icon}
                </div>
              ) : (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Overlay với số lượng sản phẩm */}
              {category.productCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {category.productCount > 99 ? '99+' : category.productCount}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-gray-700 group-hover:text-pink-600 transition-colors font-medium">
                {category.name}
              </span>

              {category.productCount > 0 && (
                <div className="text-xs text-gray-500">
                  {formatNumber(category.productCount)} Sản phẩm
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hiển thị thêm nếu có nhiều danh mục */}
      {categories.length >= 12 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/categories')}
            className="text-pink-500 hover:text-pink-600 text-sm font-medium transition-colors"
          >
            Xem tất cả danh mục →
          </button>
        </div>
      )}
    </div>
  )
}

export default MarketplaceCategory