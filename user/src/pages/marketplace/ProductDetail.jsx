"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import DailySuggestions from "../../components/marketplace/DailySuggestions"
import { getProductDetailForUser } from "../../services/productService"
import { Heart, Share2, ShoppingCart, MessageCircle, Star, Truck, Shield, RotateCcw, Award } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "../../contexts/CartContext"

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItemToCart, buyNow, loading: cartLoading } = useCart()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [reviewProduct, setReviewProduct] = useState({})
  const [selectedVariants, setSelectedVariants] = useState({})
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [currentMediaType, setCurrentMediaType] = useState("video")
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState("description")

  useEffect(() => {
    if (slug) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
      fetchProductDetail()
    }
  }, [slug])

  useEffect(() => {
    if (product) {
      const videos = product.videos && product.videos.length > 0 ? product.videos : []
      const defaultType = videos.length > 0 ? "video" : "image"
      setCurrentMediaType(defaultType)
      setCurrentMediaIndex(0)
    }
  }, [product])

  const fetchProductDetail = async () => {
    try {
      setLoading(true)
      const response = await getProductDetailForUser(slug)
      if (response.success) {
        setProduct(response.data.product)
        setRelatedProducts(response.data.relatedProducts)
        setReviewProduct(response.data.reviews)
      } else {
        setError("Không thể tải thông tin sản phẩm")
      }
    } catch (err) {
      setError("Lỗi kết nối. Vui lòng thử lại sau.")
      console.error("Error fetching product:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product?.stock) {
      setQuantity(newQuantity)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price)
  }

  const calculateDiscountedPrice = (price, discount) => {
    return price - (price * discount) / 100
  }

  const renderStars = (rating, size = "sm") => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} fill-yellow-400 text-yellow-400`} />,
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} fill-yellow-400 text-yellow-400`}
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />,
        )
      } else {
        stars.push(<Star key={i} className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} text-gray-300`} />)
      }
    }
    return stars
  }

  const validateVariants = () => {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (!selectedVariants[variant.name]) {
          toast.info(`Vui lòng chọn ${variant.name}`)
          return false
        }
      }
    }
    return true
  }

  const handleAddToCart = async () => {
    if (!validateVariants()) return

    try {
      setIsAddingToCart(true)
      await addItemToCart(product._id, quantity, selectedVariants)
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!validateVariants()) return

    try {
      setIsBuyingNow(true)
      await buyNow(product._id, quantity, selectedVariants)
      // Navigate to cart page instead of checkout
      navigate("/marketplace/cart")
    } catch (error) {
      console.error("Error buying now:", error)
    } finally {
      setIsBuyingNow(false)
    }
  }

  const handleVariantSelect = (variantName, option) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: option,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchProductDetail}>Thử lại</Button>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Không tìm thấy sản phẩm</p>
      </div>
    )
  }

  const discountedPrice =
    product.discount > 0 ? calculateDiscountedPrice(product.price, product.discount) : product.price
  const images = product.images && product.images.length > 0 ? product.images : []
  const videos = product.videos && product.videos.length > 0 ? product.videos : []
  const hasMedia = images.length > 0 || videos.length > 0

  const getCurrentMedia = () => {
    if (currentMediaType === "video" && videos.length > 0) {
      return videos[currentMediaIndex]
    } else if (currentMediaType === "image" && images.length > 0) {
      return images[currentMediaIndex]
    }
    return "/placeholder-image.jpg"
  }

  const getAllMediaItems = () => {
    const mediaItems = []

    videos.forEach((video, index) => {
      mediaItems.push({
        type: "video",
        src: video,
        index: index,
        thumbnail: video,
      })
    })

    images.forEach((image, index) => {
      mediaItems.push({
        type: "image",
        src: image,
        index: index,
        thumbnail: image,
      })
    })

    return mediaItems
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm text-gray-600">
            <span className="hover:text-pink-500 cursor-pointer" onClick={() => navigate("/marketplace")}>
              Marketplace
            </span>
            {product.categories && product.categories.length > 0 && (
              <>
                <span className="mx-2">›</span>
                <span className="hover:text-pink-500 cursor-pointer">{product.categories[0].name}</span>
              </>
            )}
            <span className="mx-2">›</span>
            <span className="text-gray-900">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Main Product Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              {/* Product Images & Videos */}
              <div className="lg:w-2/5 p-6">
                <div className="space-y-4">
                  <div className="relative group">
                    {currentMediaType === "video" ? (
                      <video
                        src={getCurrentMedia()}
                        controls
                        autoPlay={true}
                        muted
                        loop
                        className="w-full h-96 object-cover rounded-lg shadow-md bg-black"
                        poster="/video-placeholder.jpg"
                      >
                        <source src={getCurrentMedia()} type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    ) : (
                      <img
                        src={getCurrentMedia() || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-96 object-cover rounded-lg shadow-md"
                      />
                    )}

                    {product.discount > 0 && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        -{product.discount}%
                      </div>
                    )}
                    <button
                      onClick={() => setIsLiked(!isLiked)}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                    </button>

                    {currentMediaType === "video" && (
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                        📹 Video
                      </div>
                    )}
                  </div>

                  {/* Media thumbnails */}
                  {hasMedia && (
                    <div className="flex gap-2 overflow-x-auto">
                      {getAllMediaItems().map((mediaItem, index) => (
                        <div key={`${mediaItem.type}-${mediaItem.index}`} className="relative flex-shrink-0">
                          {mediaItem.type === "video" ? (
                            <div
                              className={`relative w-16 h-16 rounded-md cursor-pointer border-2 transition-colors overflow-hidden ${currentMediaType === "video" && currentMediaIndex === mediaItem.index
                                ? "border-pink-500"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                              onClick={() => {
                                setCurrentMediaType("video")
                                setCurrentMediaIndex(mediaItem.index)
                              }}
                            >
                              <video src={mediaItem.src} className="w-full h-full object-cover" muted />
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-2 border-l-gray-800 border-y-1 border-y-transparent ml-0.5"></div>
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 text-center">
                                📹
                              </div>
                            </div>
                          ) : (
                            <img
                              src={mediaItem.thumbnail || "/placeholder.svg"}
                              alt={`${product.name} ${mediaItem.index + 1}`}
                              className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 transition-colors ${currentMediaType === "image" && currentMediaIndex === mediaItem.index
                                ? "border-pink-500"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                              onClick={() => {
                                setCurrentMediaType("image")
                                setCurrentMediaIndex(mediaItem.index)
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="lg:w-3/5 p-6 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>

                  {/* Rating & Sales */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <div className="flex">{renderStars(product.ratings?.avg || 0)}</div>
                      <span className="ml-1">({product.ratings?.count || 0} đánh giá)</span>
                    </div>
                    <span>|</span>
                    <span>{product.soldCount || 0} đã bán</span>
                  </div>

                  {/* Price */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-baseline gap-3">
                      {product.discount > 0 && (
                        <span className="text-lg text-gray-400 line-through">₫{formatPrice(product.price)}</span>
                      )}
                      <span className="text-3xl font-bold text-pink-500">₫{formatPrice(discountedPrice)}</span>
                      {product.discount > 0 && (
                        <span className="bg-pink-500 text-white px-2 py-1 rounded text-sm font-medium">
                          {product.discount}% GIẢM
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-3">
                    {product.variants.map((variant, index) => (
                      <div key={index}>
                        <span className="text-sm font-medium text-gray-700 mb-2 block">{variant.name}:</span>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map((option, optionIndex) => (
                            <button
                              key={optionIndex}
                              onClick={() => handleVariantSelect(variant.name, option)}
                              className={`px-4 py-2 border rounded-md transition-colors ${selectedVariants[variant.name] === option
                                ? "border-pink-500 bg-pink-50 text-pink-500"
                                : "border-gray-300 hover:border-pink-500 hover:text-pink-500"
                                }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                      className="w-16 text-center py-2 border-none outline-none"
                      min="1"
                      max={product.stock}
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">{product.stock} sản phẩm có sẵn</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-pink-500 text-pink-500 hover:bg-pink-50"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || cartLoading}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isAddingToCart || cartLoading ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                  </Button>
                  <Button
                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                    onClick={handleBuyNow}
                    disabled={isBuyingNow || cartLoading}
                  >
                    {isBuyingNow ? "Đang xử lý..." : "Mua ngay"}
                  </Button>
                </div>

                {/* Additional Actions */}
                <div className="flex justify-center gap-6 pt-4 border-t">
                  <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-500">
                    <Share2 className="w-4 h-4" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={product.seller?.avatar || "/default-avatar.png"}
                  alt={product.seller?.name || product.seller?.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  onClick={() => navigate(`/feed/profile/${product.seller?.slug}`)}
                />
                <div>
                  <h3
                    className="font-bold text-lg text-gray-900 cursor-pointer hover:underline"
                    onClick={() => navigate(`/feed/profile/${product.seller?.slug}`)}
                  >
                    {product.seller?.name || product.seller?.username}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>Online 2 giờ trước</span>
                    <span>|</span>
                    <div className="flex items-center gap-1">
                      <div className="flex">{renderStars(product.seller?.stats?.rating?.avg)}</div>
                      <span>({product.seller?.stats?.rating?.avg})</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat ngay
                </Button>
                <Button variant="outline" onClick={() => navigate(`/feed/profile/${product.seller?.slug}`)}>
                  Xem shop
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policies */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Miễn phí vận chuyển</p>
                  <p className="text-sm text-gray-600">Đơn hàng từ 300k</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Đảm bảo chất lượng</p>
                  <p className="text-sm text-gray-600">Hoàn tiền 100%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Đổi trả dễ dàng</p>
                  <p className="text-sm text-gray-600">Trong vòng 7 ngày</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details Tabs */}
        <Card>
          <CardContent className="p-0">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === "description"
                    ? "border-pink-500 text-pink-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Mô tả sản phẩm
                </button>
                <button
                  onClick={() => setActiveTab("specifications")}
                  className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === "specifications"
                    ? "border-pink-500 text-pink-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Thông số kỹ thuật
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === "reviews"
                    ? "border-pink-500 text-pink-500"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Đánh giá ({product.ratings?.count || 0})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "description" && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {activeTab === "specifications" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-medium">{product.sku}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Thương hiệu:</span>
                      <span className="font-medium">{product.brand || "Không xác định"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Tình trạng:</span>
                      <span className="font-medium">{product.condition === "new" ? "Mới" : "Đã sử dụng"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Kho hàng:</span>
                      <span className="font-medium">{product.stock} sản phẩm</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-6">
                  {/* Review Overview */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Overall Rating */}
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 mb-2">
                          {product.reviewStats?.averageRating?.toFixed(1) || product.ratings?.avg?.toFixed(1) || "0.0"}
                        </div>
                        <div className="flex justify-center mb-2">
                          {renderStars(product.reviewStats?.averageRating || product.ratings?.avg || 0, "lg")}
                        </div>
                        <p className="text-gray-600">
                          {product.reviewStats?.totalReviews || product.ratings?.count || 0} đánh giá
                        </p>
                        {product.reviewStats?.verifiedReviews > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            {product.reviewStats.verifiedReviews} đánh giá đã xác thực
                          </p>
                        )}
                      </div>

                      {/* Rating Breakdown */}
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count =
                            product.reviewStats?.ratingDistribution?.[
                            star === 5
                              ? "five"
                              : star === 4
                                ? "four"
                                : star === 3
                                  ? "three"
                                  : star === 2
                                    ? "two"
                                    : "one"
                            ] || 0
                          const percentage =
                            product.reviewStats?.ratingPercentage?.[
                            star === 5
                              ? "five"
                              : star === 4
                                ? "four"
                                : star === 3
                                  ? "three"
                                  : star === 2
                                    ? "two"
                                    : "one"
                            ] || 0

                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-sm font-medium w-6">{star}</span>
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12">{count}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Reviews List */}
                  {reviewProduct?.data && reviewProduct.data.length > 0 ? (
                    <div className="space-y-6">
                      {/* Sort Options */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Đánh giá từ khách hàng</h3>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" defaultValue="newest">
                          <option value="newest">Mới nhất</option>
                          <option value="oldest">Cũ nhất</option>
                          <option value="rating_high">Điểm cao nhất</option>
                          <option value="rating_low">Điểm thấp nhất</option>
                          <option value="most_liked">Nhiều like nhất</option>
                        </select>
                      </div>

                      {/* Reviews */}
                      <div className="space-y-4">
                        {reviewProduct.data.map((review) => (
                          <div
                            key={review._id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                          >
                            {/* Review Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={review.reviewer._id?.avatar || "/default-avatar.png"}
                                  alt={review.reviewer._id?.name || review.reviewer._id?.fullName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900">{review.reviewer._id?.name || review.reviewer._id?.fullName}</h4>
                                    {review.isVerified && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Đã mua hàng
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex">{renderStars(review.rating)}</div>
                                    <span className="text-sm text-gray-500">
                                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Review Content */}
                            <div className="space-y-3">
                              {review.title && <h5 className="font-medium text-gray-900">{review.title}</h5>}

                              {review.content && <p className="text-gray-700 leading-relaxed">{review.content}</p>}

                              {/* Purchased Variant */}
                              {review.purchasedVariant && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Phân loại:</span>{" "}
                                  {Object.entries(review.purchasedVariant)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(", ")}
                                </div>
                              )}

                              {/* Review Media */}
                              {(review.images?.length > 0 || review.videos?.length > 0) && (
                                <div className="flex gap-2 overflow-x-auto">
                                  {review.images?.map((image, index) => (
                                    <img
                                      key={index}
                                      src={image || "/placeholder.svg"}
                                      alt={`Review image ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80"
                                    />
                                  ))}
                                  {review.videos?.map((video, index) => (
                                    <div key={index} className="relative w-20 h-20">
                                      <video
                                        src={video}
                                        className="w-full h-full object-cover rounded-md border cursor-pointer"
                                        muted
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-md">
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                          <div className="w-0 h-0 border-l-4 border-l-gray-800 border-y-2 border-y-transparent ml-0.5"></div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Review Actions */}
                              <div className="flex items-center gap-4 pt-2">
                                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-pink-500 transition-colors">
                                  <Heart
                                    className={`w-4 h-4 ${review.isLikedByUser ? "fill-pink-500 text-pink-500" : ""}`}
                                  />
                                  Hữu ích ({review.likesCount || 0})
                                </button>

                                {review.replies && review.replies.length > 0 && (
                                  <button className="text-sm text-gray-600 hover:text-pink-500 transition-colors">
                                    {review.replies.length} phản hồi
                                  </button>
                                )}
                              </div>

                              {/* Seller Replies */}
                              {review.replies && review.replies.length > 0 && (
                                <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-2">
                                  {review.replies.map((reply, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <img
                                          src={reply.author._id?.avatar || "/default-avatar.png"}
                                          alt={reply.author._id?.name}
                                          className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <span className="text-sm font-medium text-gray-900">
                                          {reply.author._id?.name}
                                        </span>
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                          Người bán
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(reply.createdAt).toLocaleDateString("vi-VN")}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700">{reply.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {reviewProduct.pagination && reviewProduct.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                          <Button variant="outline" size="sm" disabled={!reviewProduct.pagination.hasPrev}>
                            Trước
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, reviewProduct.pagination.totalPages) }, (_, i) => {
                              const page = i + 1
                              const isActive = page === reviewProduct.pagination.currentPage
                              return (
                                <Button
                                  key={page}
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  className={isActive ? "bg-pink-500 hover:bg-pink-600" : ""}
                                >
                                  {page}
                                </Button>
                              )
                            })}
                          </div>

                          <Button variant="outline" size="sm" disabled={!reviewProduct.pagination.hasNext}>
                            Sau
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>Chưa có đánh giá nào cho sản phẩm này</p>
                      <p className="text-sm">Hãy là người đầu tiên đánh giá!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct._id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/marketplace/products/${relatedProduct.slug}`)}
                >
                  <CardContent className="p-3">
                    <img
                      src={relatedProduct.images?.[0] || "/placeholder-image.jpg"}
                      alt={relatedProduct.name}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{relatedProduct.name}</h3>
                    <p className="text-pink-500 font-bold text-sm">₫{formatPrice(relatedProduct.price)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex">{renderStars(relatedProduct.ratings?.avg || 0)}</div>
                      <span className="text-xs text-gray-500">({relatedProduct.soldCount || 0})</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Daily Suggestions */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Có thể bạn cũng thích</h2>
          <DailySuggestions />
        </section>
      </div>
    </div>
  )
}
