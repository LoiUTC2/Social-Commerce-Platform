"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ShoppingBag, Zap, Gift, Star, Sparkles, TrendingUp } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
// import BannerImg from '../../../assets/logoHULO.png'

export default function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const BannerImg = "https://res.cloudinary.com/dsst228u9/image/upload/v1750774789/social-commerce/iik5mlkkwjwwciuxidyw.png"

  // Banner data - có thể fetch từ API
  const banners = [
    {
      id: 1,
      title: "Chào mừng đến HULO",
      subtitle: "Sàn thương mại điện tử hàng đầu",
      description: "Khám phá hàng triệu sản phẩm chất lượng từ các thương hiệu uy tín với trải nghiệm mua sắm tuyệt vời!",
      ctaText: "Khám Phá Ngay",
      ctaSecondary: "Tìm Hiểu Thêm",
      background: "from-purple-600 via-pink-600 to-red-500",
      textColor: "text-white",
      badge: "WELCOME",
      icon: <Star className="w-6 h-6" />,
      image: BannerImg,
      offer: "HULO",
      timeLeft: null,
    },
    {
      id: 2,
      title: "HULO - Mua sắm thông minh",
      subtitle: "Nền tảng tin cậy cho mọi nhu cầu",
      description: "Giao hàng nhanh chóng, thanh toán an toàn, dịch vụ khách hàng 24/7. Trải nghiệm mua sắm hoàn hảo!",
      ctaText: "Bắt Đầu Mua Sắm",
      ctaSecondary: "Về Chúng Tôi",
      background: "from-emerald-500 via-teal-500 to-cyan-600",
      textColor: "text-white",
      badge: "TRUSTED",
      icon: <Sparkles className="w-6 h-6" />,
      image: BannerImg,
      offer: "QUALITY",
      timeLeft: null,
    },
    {
      id: 3,
      title: "Flash Sale Cuối Tuần",
      subtitle: "Giảm giá lên đến 70%",
      description: "Hàng ngàn sản phẩm hot với giá không thể tin được!",
      ctaText: "Mua Ngay",
      ctaSecondary: "Xem Tất Cả",
      background: "from-pink-500 via-red-500 to-orange-500",
      textColor: "text-white",
      badge: "HOT",
      icon: <Zap className="w-6 h-6" />,
      image: BannerImg,
      offer: "70%",
      timeLeft: "23:45:12",
    },
    {
      id: 4,
      title: "Tham gia cộng đồng HULO",
      subtitle: "Hơn 1 triệu người dùng tin tưởng",
      description: "Kết nối với hàng ngàn nhà bán hàng uy tín, tìm kiếm sản phẩm yêu thích với giá tốt nhất!",
      ctaText: "Tham Gia Ngay",
      ctaSecondary: "Đăng Ký Bán Hàng",
      background: "from-orange-500 via-pink-500 to-rose-600",
      textColor: "text-white",
      badge: "COMMUNITY",
      icon: <TrendingUp className="w-6 h-6" />,
      image: BannerImg,
      offer: "1M+",
      timeLeft: null,
    },
    {
      id: 5,
      title: "Siêu Khuyến Mãi",
      subtitle: "Mua 1 tặng 1",
      description: "Cơ hội vàng sở hữu sản phẩm yêu thích với giá ưu đãi",
      ctaText: "Mua Ngay",
      ctaSecondary: "Điều Kiện",
      background: "from-green-500 via-teal-500 to-blue-500",
      textColor: "text-white",
      badge: "1+1",
      icon: <Gift className="w-6 h-6" />,
      image: "/api/placeholder/400/300",
      offer: "1+1",
      timeLeft: "48:30:25",
    },
    {
      id: 6,
      title: "HULO - Sàn TMĐT tin cậy",
      subtitle: "Nơi mua sắm thông minh của bạn",
      description: "Hàng triệu sản phẩm chính hãng, giao hàng siêu tốc, thanh toán an toàn. Trải nghiệm mua sắm đỉnh cao!",
      ctaText: "Khám Phá HULO",
      ctaSecondary: "Xem Ưu Đãi",
      background: "from-indigo-600 via-purple-600 to-pink-600",
      textColor: "text-white",
      badge: "PLATFORM",
      icon: <Star className="w-6 h-6" />,
      image: BannerImg,
      offer: "HULO",
      timeLeft: null,
    },
    {
      id: 7,
      title: "Bộ Sưu Tập Mới",
      subtitle: "Thời trang xu hướng 2024",
      description: "Khám phá những thiết kế độc đáo và phong cách mới nhất",
      ctaText: "Khám Phá",
      ctaSecondary: "Xem Lookbook",
      background: "from-blue-600 via-indigo-600 to-purple-700",
      
      textColor: "text-white",
      badge: "NEW",
      icon: <Sparkles className="w-6 h-6" />,
      image: "/api/placeholder/400/300",
      offer: "NEW",
      timeLeft: null,
    }, 
  ]

  // Auto slide effect
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, banners.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }

  const currentBanner = banners[currentSlide]

  return (
    <div className="relative w-full h-80 md:h-96 overflow-hidden rounded-2xl shadow-2xl mb-6 group">
      {/* Background với gradient động */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentBanner.background} transition-all duration-1000`}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left content */}
            <div className="space-y-6 text-center md:text-left">
              {/* Badge */}
              <div className="flex justify-center md:justify-start">
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm font-bold backdrop-blur-sm">
                  {currentBanner.icon}
                  <span className="ml-2">{currentBanner.badge}</span>
                </Badge>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold ${currentBanner.textColor} leading-tight`}>
                  {currentBanner.title}
                </h1>
                <h2 className={`text-xl md:text-2xl ${currentBanner.textColor} opacity-90 font-medium`}>
                  {currentBanner.subtitle}
                </h2>
              </div>

              {/* Description */}
              <p className={`text-lg ${currentBanner.textColor} opacity-80 max-w-md mx-auto md:mx-0`}>
                {currentBanner.description}
              </p>

              {/* Offer highlight */}
              {currentBanner.offer && (
                <div className="flex justify-center md:justify-start">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-white" />
                      <span className="text-white font-bold text-lg">
                        {currentBanner.offer === "NEW"
                          ? "Bộ sưu tập mới"
                          : currentBanner.offer === "1+1"
                            ? "Mua 1 tặng 1"
                            : `Giảm ${currentBanner.offer}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Countdown timer */}
              {currentBanner.timeLeft && (
                <div className="flex justify-center md:justify-start">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <div className="flex items-center gap-2 text-white">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Kết thúc sau:</span>
                      <span className="font-mono text-lg font-bold">{currentBanner.timeLeft}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {currentBanner.ctaText}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/50 text-white hover:bg-white/10 font-medium px-8 py-3 rounded-full backdrop-blur-sm bg-transparent"
                >
                  {currentBanner.ctaSecondary}
                </Button>
              </div>
            </div>

            {/* Right content - Image/Visual */}
            <div className="hidden md:flex justify-center items-center">
              <div className="relative">
                {/* Main image container */}
                <div className="relative w-80 h-80 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                  {/* Rotating border */}
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-white/50 to-transparent animate-spin"
                    style={{ animationDuration: "8s" }}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10 text-center text-white">
                    <div className="text-6xl font-bold mb-2">
                      {currentBanner.offer === "NEW"
                        ? "NEW"
                        : currentBanner.offer === "1+1"
                          ? "1+1"
                          : currentBanner.offer}
                    </div>
                    <div className="text-lg opacity-80">
                      {currentBanner.offer === "NEW" ? "Collection" : currentBanner.offer === "1+1" ? "Special" : "OFF"}
                    </div>
                  </div>

                  {/* Floating icons */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
                      style={{
                        left: `${50 + 35 * Math.cos((i * Math.PI * 2) / 8)}%`,
                        top: `${50 + 35 * Math.sin((i * Math.PI * 2) / 8)}%`,
                        transform: "translate(-50%, -50%)",
                        animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    >
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/70"
              }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / banners.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

// CSS cho animations (thêm vào file CSS global)
const styles = `
@keyframes float {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
  50% { transform: translate(-50%, -50%) translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
`
