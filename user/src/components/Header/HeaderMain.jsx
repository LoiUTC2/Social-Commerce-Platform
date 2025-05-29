"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Home, Bell, Search } from "lucide-react"
import { Input } from "../../components/ui/input"
import DarkModeToggle from "../common/DarkModeToggle"
import HeaderChatIcon from "../chat/HeaderChatIcon"
import ShoppingCartWithBadge from "../icons/ShoppingCart"
import UserMenu from "../icons/UserMenu"
import CartDropdown from "../cart/CartDropdown"
import { useCart } from "../../contexts/CartContext"

const HeaderMainUpdated = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const { toggleCartDropdown } = useCart()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSearchInputKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 px-6 py-4 shadow flex items-center justify-between relative">
      {/* Bên trái: Logo + Tabs */}
      <div className="flex items-center gap-8">
        <Link to="/" className="text-3xl font-bold text-pink-600">
          HULO
        </Link>
        <nav className="flex items-center gap-4 text-gray-700 dark:text-gray-300 font-medium text-sm">
          <Link to="/feed" className="flex items-center gap-1 hover:text-pink-500 transition-colors">
            <Home size={18} /> Bảng Tin
          </Link>
          <Link to="/marketplace" className="flex items-center gap-1 hover:text-pink-500 transition-colors">
            🛒 Sàn TMĐT
          </Link>
        </nav>
      </div>

      {/* Giữa: Thanh tìm kiếm */}
      <div className="flex-grow flex justify-center px-6">
        <form onSubmit={handleSearch} className="relative w-full max-w-[1000px]">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchInputKeyPress}
            placeholder="Tìm kiếm sản phẩm, bài viết..."
            className="pr-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
          />
          <button
            type="submit"
            className="absolute right-3 top-2.5 text-gray-400 hover:text-pink-600 transition-colors"
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      {/* Bên phải: Icon thao tác */}
      <div className="flex items-center gap-5 text-gray-600 dark:text-gray-400">
        <Bell className="cursor-pointer hover:text-pink-500 transition-colors" />
        <ShoppingCartWithBadge className="hover:text-pink-500 transition-colors" onClick={toggleCartDropdown} />
        <HeaderChatIcon className="cursor-pointer hover:text-pink-500 transition-colors" />
        <UserMenu className="cursor-pointer hover:text-pink-500 transition-colors" />
        <DarkModeToggle />
      </div>

      {/* Cart Dropdown */}
      <CartDropdown />
    </div>
  )
}

export default HeaderMainUpdated
