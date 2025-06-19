"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import {
    FiMenu,
    FiBell,
    FiUser,
    FiLogOut,
    FiSettings,
    FiSearch,
    FiMessageSquare,
    FiShield,
    FiMoon,
    FiSun,
    FiMaximize2,
    FiMinimize2,
} from "react-icons/fi"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { ScrollArea } from "../ui/scroll-area"

const Header = ({ onToggleSidebar, sidebarCollapsed }) => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const searchInputRef = useRef(null)

    const [notifications] = useState([
        {
            id: 1,
            message: "Có 5 bài đăng chờ duyệt",
            time: "5 phút trước",
            unread: true,
            type: "approval",
            priority: "high",
        },
        {
            id: 2,
            message: "Tranh chấp mới cần xử lý",
            time: "10 phút trước",
            unread: true,
            type: "dispute",
            priority: "high",
        },
        {
            id: 3,
            message: "Doanh thu hôm nay tăng 15%",
            time: "1 giờ trước",
            unread: false,
            type: "info",
            priority: "low",
        },
        {
            id: 4,
            message: "Người dùng mới đăng ký",
            time: "2 giờ trước",
            unread: false,
            type: "user",
            priority: "medium",
        },
        {
            id: 5,
            message: "Flash Sale mới cần duyệt",
            time: "3 giờ trước",
            unread: true,
            type: "approval",
            priority: "medium",
        },
    ])

    const unreadCount = notifications.filter((n) => n.unread).length

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case "approval":
                return <FiShield className="w-4 h-4 text-orange-500" />
            case "dispute":
                return <FiMessageSquare className="w-4 h-4 text-red-500" />
            case "user":
                return <FiUser className="w-4 h-4 text-blue-500" />
            default:
                return <FiBell className="w-4 h-4 text-gray-500" />
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "bg-red-100 text-red-800"
            case "medium":
                return "bg-yellow-100 text-yellow-800"
            case "low":
                return "bg-green-100 text-green-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
            // Ctrl/Cmd + B for sidebar toggle
            if ((e.ctrlKey || e.metaKey) && e.key === "b") {
                e.preventDefault()
                onToggleSidebar()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [onToggleSidebar])

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex h-16 items-center px-6">
                {/* Left Section */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="h-9 w-9 p-0 hover:bg-gray-100">
                        <FiMenu className="h-4 w-4" />
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>

                    <div className="hidden md:block">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                            HULO Admin
                        </h1>
                    </div>
                </div>

                {/* Center Section - Search */}
                <div className="flex-1 flex justify-center px-6">
                    <div className="relative w-full max-w-md">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Tìm kiếm... (Ctrl+K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white focus:border-pink-300 focus:ring-pink-200"
                        />
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center space-x-2">
                    {/* Fullscreen Toggle */}
                    <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-9 w-9 p-0 hover:bg-gray-100">
                        {isFullscreen ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
                    </Button>

                    {/* Dark Mode Toggle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="h-9 w-9 p-0 hover:bg-gray-100"
                    >
                        {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                    </Button>

                    {/* Notifications */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100 relative">
                                <FiBell className="h-4 w-4" />
                                {unreadCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-pink-600 hover:bg-pink-600">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <span>Thông báo</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {unreadCount} mới
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-80">
                                        <div className="space-y-1">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-l-2 ${notification.unread ? "border-l-pink-500 bg-pink-50/50" : "border-l-transparent"
                                                        }`}
                                                >
                                                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={`text-sm ${notification.unread ? "font-medium text-gray-900" : "text-gray-700"}`}
                                                        >
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-xs text-gray-500">{notification.time}</span>
                                                            <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                                                {notification.priority === "high"
                                                                    ? "Cao"
                                                                    : notification.priority === "medium"
                                                                        ? "Trung bình"
                                                                        : "Thấp"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {notification.unread && (
                                                        <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-2"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    <div className="p-3 border-t">
                                        <Button variant="outline" className="w-full text-sm">
                                            Xem tất cả thông báo
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </PopoverContent>
                    </Popover>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                                    <AvatarFallback className="bg-pink-100 text-pink-700">{user?.name?.charAt(0) || "A"}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || "Admin"}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "admin@hulo.com"}</p>
                                    <Badge variant="secondary" className="w-fit text-xs mt-1">
                                        {user?.role || "Super Admin"}
                                    </Badge>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <FiUser className="mr-2 h-4 w-4" />
                                <span>Hồ sơ</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <FiSettings className="mr-2 h-4 w-4" />
                                <span>Cài đặt</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={handleLogout}
                            >
                                <FiLogOut className="mr-2 h-4 w-4" />
                                <span>Đăng xuất</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}

export default Header