"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { cn } from "../../../lib/utils"
import SuggestedProducts from "./suggested-products"
import RecommendedShops from "./recommended-shops"
import RecommendedUsers from "./recommended-users"
import EventsNotifications from "./events-notifications"
import { ChevronUp } from "lucide-react"
import { Button } from "../../../components/ui/button"

const RightSidebar = ({ className }) => {
  const [visibleComponents, setVisibleComponents] = useState(new Set([0])) // Component đầu tiên luôn hiển thị
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollContainerRef = useRef(null)
  const componentRefs = useRef([])

  // Danh sách các component với thông tin metadata
  const components = [
    {
      id: "suggested-products",
      component: SuggestedProducts,
      title: "Sản phẩm gợi ý",
      priority: "high",
      loadDelay: 0,
    },
    {
      id: "recommended-shops",
      component: RecommendedShops,
      title: "Cửa hàng gợi ý",
      priority: "medium",
      loadDelay: 200,
    },
    {
      id: "recommended-users",
      component: RecommendedUsers,
      title: "Gợi ý kết bạn",
      priority: "medium",
      loadDelay: 400,
    },
    {
      id: "events-notifications",
      component: EventsNotifications,
      title: "Sự kiện & Thông báo",
      priority: "low",
      loadDelay: 600,
    },
  ]

  // Tự động load tất cả components sau một khoảng thời gian ngắn
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleComponents(new Set([0, 1, 2, 3])) // Hiển thị tất cả components
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Intersection Observer để lazy load components khi scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.dataset.index)
            if (index >= 0) {
              setVisibleComponents((prev) => new Set([...prev, index]))
            }
          }
        })
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "50px 0px",
        threshold: 0.1,
      },
    )

    // Observe tất cả component refs
    componentRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  // Handle scroll để hiển thị nút scroll to top
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300)
    }

    scrollContainer.addEventListener("scroll", handleScroll)
    return () => scrollContainer.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <div className={cn("relative h-full", className)}>
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-transparent hover:scrollbar-thumb-pink-400 transition-colors"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#f9a8d4 transparent",
        }}
      >
        <div className="space-y-4 pb-4">
          {components.map((componentData, index) => (
            <ComponentWrapper
              key={componentData.id}
              ref={(el) => (componentRefs.current[index] = el)}
              data-index={index}
              isVisible={visibleComponents.has(index)}
              component={componentData.component}
              title={componentData.title}
              priority={componentData.priority}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          variant="outline"
          size="sm"
          className="absolute bottom-4 right-4 rounded-full w-10 h-10 p-0 shadow-lg bg-white/90 backdrop-blur-sm border-pink-200 hover:bg-pink-50 hover:border-pink-300 hover:shadow-xl transition-all duration-300 z-10"
          onClick={scrollToTop}
        >
          <ChevronUp className="w-4 h-4 text-pink-600" />
        </Button>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #f9a8d4;
          border-radius: 3px;
          transition: background-color 0.2s;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #f472b6;
        }
      `}</style>
    </div>
  )
}

// Component Wrapper với animation và lazy loading
const ComponentWrapper = React.forwardRef(
  ({ isVisible, component: Component, title, priority, index, ...props }, ref) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
      if (isVisible && !isLoaded) {
        const loadTime = priority === "high" ? 0 : priority === "medium" ? 100 : 200

        setTimeout(() => {
          setIsLoaded(true)
        }, loadTime)
      }
    }, [isVisible, isLoaded, priority])

    const handleError = () => {
      setHasError(true)
    }

    if (!isVisible) {
      return (
        <div
          ref={ref}
          {...props}
          className="h-40 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg animate-pulse border border-pink-100"
        />
      )
    }

    if (hasError) {
      return (
        <div ref={ref} className="bg-white rounded-lg border border-pink-200 p-4">
          <div className="text-center text-gray-500">
            <p className="text-sm">Không thể tải {title}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50"
              onClick={() => {
                setHasError(false)
                setIsLoaded(false)
              }}
            >
              Thử lại
            </Button>
          </div>
        </div>
      )
    }

    if (!isLoaded) {
      return (
        <div ref={ref} {...props} className="bg-white rounded-lg border border-pink-200 p-4 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-gradient-to-r from-pink-200 to-rose-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded"></div>
              <div className="h-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded w-5/6"></div>
              <div className="h-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          "transform transition-all duration-500 ease-out",
          isLoaded ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95",
        )}
        style={{
          transitionDelay: `${index * 50}ms`,
        }}
      >
        <ErrorBoundary onError={handleError}>
          <Component />
        </ErrorBoundary>
      </div>
    )
  },
)

ComponentWrapper.displayName = "ComponentWrapper"

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("RightSidebar Component Error:", error, errorInfo)
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

export default RightSidebar
