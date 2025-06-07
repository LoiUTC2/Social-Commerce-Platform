"use client"

import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Home, Bell, Search, Clock, TrendingUp, X } from 'lucide-react'
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import DarkModeToggle from "../../components/common/DarkModeToggle"
import HeaderChatIcon from "../chat/HeaderChatIcon"
import ShoppingCartWithBadge from "../icons/ShoppingCart"
import UserMenu from "../icons/UserMenu"
import { getSearchSuggestions, getPopularSearches } from "../../services/searchService"
import { useAuth } from "../../contexts/AuthContext"
import CartDropdown from "../cart/CartDropdown"
import { useCart } from "../../contexts/CartContext"

const HeaderMain = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const { toggleCartDropdown } = useCart()
  const [suggestions, setSuggestions] = useState([])
  const [popularSearches, setPopularSearches] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const searchRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Load popular searches on mount
  useEffect(() => {
    const loadPopularSearches = async () => {
      try {
        const response = await getPopularSearches(8, '7d')
        if (response.success) {
          setPopularSearches(response.data.searches)
        }
      } catch (error) {
        console.error('Error loading popular searches:', error)
      }
    }
    loadPopularSearches()
  }, [])

  // Handle search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        const response = await getSearchSuggestions(searchQuery.trim(), 'all', 8)
        if (response.success) {
          setSuggestions(response.data)
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
      setSearchQuery("")
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch()
  }

  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion.text)
  }

  const handleInputFocus = () => {
    setShowSuggestions(true)
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'product': return '🛍️'
      case 'shop': return '🏪'
      case 'user': return '👤'
      case 'post': return '📝'
      case 'history': return <Clock className="h-4 w-4 text-gray-400" />
      default: return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'product': return 'Sản phẩm'
      case 'shop': return 'Shop'
      case 'user': return 'Người dùng'
      case 'post': return 'Bài viết'
      case 'history': return 'Tìm kiếm gần đây'
      default: return ''
    }
  }

  return (
    <div className="bg-white px-6 py-4 shadow flex items-center justify-between">
      {/* Bên trái: Logo + Tabs */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-3xl font-bold text-pink-600">
          HULO
        </Link>
        <nav className="flex items-center gap-4 text-gray-700 font-medium text-sm">
          <Link to="/feed" className="flex items-center gap-1 hover:text-pink-500 transition-colors">
            <Home size={18} /> Bảng Tin
          </Link>
          <Link to="/marketplace" className="flex items-center gap-1 hover:text-pink-500 transition-colors">
            🛒 Sàn TMĐT
          </Link>
        </nav>
      </div>

      {/* Giữa: Thanh tìm kiếm với suggestions */}
      <div className="flex-grow flex justify-center px-6 relative">
        <div className="relative w-full max-w-[1000px]">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Tìm kiếm sản phẩm, bài viết, shop, người dùng..."
              className="pr-12 pl-4 py-3 text-base border-2 border-gray-200 focus:border-pink-500 rounded-lg"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-pink-500 hover:bg-pink-600"
            >
              <Search size={16} />
            </Button>
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <Card 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg border-2"
            >
              <CardContent className="p-0">
                {/* Popular Searches */}
                {searchQuery.length < 2 && popularSearches.length > 0 && (
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-pink-500" />
                      <span className="text-sm font-medium text-gray-700">Tìm kiếm phổ biến</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-pink-100 hover:text-pink-700 transition-colors"
                          onClick={() => handleSuggestionClick({ text: search.keyword })}
                        >
                          {search.keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Suggestions */}
                {searchQuery.length >= 2 && (
                  <div className="p-2">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto"></div>
                        <span className="text-sm mt-2 block">Đang tìm kiếm...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="space-y-1">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                            <div className="flex-1">
                              <span className="text-gray-900">{suggestion.text}</span>
                              {suggestion.type && (
                                <span className="text-xs text-gray-500 ml-2">
                                  trong {getTypeLabel(suggestion.type)}
                                </span>
                              )}
                            </div>
                            {suggestion.count && (
                              <Badge variant="outline" className="text-xs">
                                {suggestion.count}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <span className="text-sm">Không tìm thấy gợi ý nào</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Search Tips */}
                {searchQuery.length < 2 && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Mẹo tìm kiếm:</span> Nhập ít nhất 2 ký tự để xem gợi ý
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bên phải: Icon thao tác */}
      <div className="flex items-center gap-5 text-gray-600">
        <Bell className="cursor-pointer hover:text-pink-500 transition-colors" />
        <ShoppingCartWithBadge className="cursor-pointer hover:text-pink-500 transition-colors" onClick={toggleCartDropdown} />
        <HeaderChatIcon className="cursor-pointer hover:text-pink-500 transition-colors" />
        <UserMenu className="cursor-pointer hover:text-pink-500 transition-colors" />
        <DarkModeToggle />
      </div>

      {/* Cart Dropdown */}
      <CartDropdown />
    </div>
  )
}

export default HeaderMain
