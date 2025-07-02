"use client"

import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
    FiHome,
    FiUsers,
    FiShoppingBag,
    FiFileText,
    FiDollarSign,
    FiHeadphones,
    FiBell,
    FiTrendingUp,
    FiShield,
    FiCreditCard,
    FiBarChart2,
    FiMessageSquare,
    FiTarget,
    FiEye,
    FiPackage,
    FiEdit3,
    FiZap,
    FiChevronDown,
    FiChevronRight,
    FiStore,
    FiTrash2,
    FiTag,
} from "react-icons/fi"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { cn } from "../../lib/utils"

const Sidebar = ({ collapsed, onToggle }) => {
    const location = useLocation()
    const [expandedSections, setExpandedSections] = useState({
        0: true, // Tổng quan
        1: true, // Giám sát & Quản lý
        2: true, // Kiểm duyệt & Nội dung - mở mặc định để thấy trang mới
        3: false, // Quản lý tài chính
        4: false, // Hỗ trợ & Tranh chấp
        5: false, // Thông báo & Quảng cáo
    })

    const menuItems = [
        {
            title: "Tổng quan",
            items: [{ path: "/admin", icon: FiHome, label: "Dashboard", badge: null }],
        },
        {
            title: "Giám sát & Quản lý",
            items: [
                // { path: "/admin/staff", icon: FiShield, label: "Nhân viên", badge: null },
                { path: "/admin/users", icon: FiUsers, label: "Khách hàng", badge: "12.5K" },
                { path: "/admin/stores", icon: FiShoppingBag, label: "Gian hàng", badge: "1.2K" },
                { path: "/admin/products", icon: FiPackage, label: "Sản phẩm", badge: null },
                { path: "/admin/posts", icon: FiEdit3, label: "Bài viết", badge: null },
                { path: "/admin/categories", icon: FiTag, label: "Danh mục", badge: "17" },
            ],
        },
        {
            title: "Kiểm duyệt & Nội dung",
            items: [
                { path: "/admin/posts-review", icon: FiFileText, label: "Duyệt bài đăng", badge: "45" },
                { path: "/admin/content-review", icon: FiEye, label: "Kiểm tra nội dung", badge: null },
                {
                    path: "/admin/shop-create-approval",
                    icon: FiShoppingBag,
                    label: "Duyệt tạo shop",
                    badge: "12",
                    isNew: true,
                },
                {
                    path: "/admin/shop-delete-approval",
                    icon: FiTrash2,
                    label: "Duyệt xóa shop",
                    badge: "3",
                    isNew: true,
                    isDanger: true,
                },
                { path: "/admin/flash-sale-approval", icon: FiZap, label: "Duyệt flash sale", badge: "8" },
            ],
        },
        {
            title: "Quản lý tài chính",
            items: [
                { path: "/admin/wallets", icon: FiCreditCard, label: "Ví người dùng", badge: null },
                { path: "/admin/coupons", icon: FiDollarSign, label: "Mã giảm giá", badge: null },
                { path: "/admin/revenue", icon: FiBarChart2, label: "Doanh thu", badge: null },
                { path: "/admin/business-performance", icon: FiTrendingUp, label: "Hiệu suất KD", badge: null },
            ],
        },
        {
            title: "Hỗ trợ & Tranh chấp",
            items: [
                { path: "/admin/complaints", icon: FiHeadphones, label: "Khiếu nại", badge: "12" },
                { path: "/admin/disputes", icon: FiMessageSquare, label: "Tranh chấp", badge: "8" },
            ],
        },
        {
            title: "Thông báo & Quảng cáo",
            items: [
                { path: "/admin/notifications", icon: FiBell, label: "Thông báo", badge: null },
                { path: "/admin/advertisements", icon: FiTarget, label: "Quảng cáo", badge: null },
                { path: "/admin/recommendations", icon: FiTrendingUp, label: "Đề xuất SP", badge: null },
            ],
        },
    ]

    const toggleSection = (index) => {
        setExpandedSections((prev) => ({
            ...prev,
            [index]: !prev[index],
        }))
    }

    const isActiveSection = (items) => {
        return items.some((item) => location.pathname === item.path)
    }

    return (
        <aside
            className={cn(
                // "bg-white border-r border-gray-200 transition-all duration-300 shadow-sm flex flex-col",
                "bg-white border-r border-gray-200 transition-all duration-300 shadow-sm flex flex-col h-screen sticky top-0",
                collapsed ? "w-16" : "w-64",
            )}
        >
            {/* Logo */}
            <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-gradient-to-r from-pink-600 to-pink-700">
                {collapsed ? (
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-pink-600 font-bold text-lg">HL</span>
                    </div>
                ) : (
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-white">HULO</h1>
                        <p className="text-xs text-pink-100">Admin Panel</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-2 px-3">
                    {menuItems.map((section, sectionIndex) => {
                        const isExpanded = expandedSections[sectionIndex]
                        const hasActiveItem = isActiveSection(section.items)

                        return (
                            <div key={sectionIndex} className="space-y-1">
                                {!collapsed && (
                                    <Collapsible open={isExpanded} onOpenChange={() => toggleSection(sectionIndex)}>
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-between h-8 px-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                                                    hasActiveItem && "text-pink-600",
                                                )}
                                            >
                                                <span className="truncate">{section.title}</span>
                                                {isExpanded ? <FiChevronDown className="h-3 w-3" /> : <FiChevronRight className="h-3 w-3" />}
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="space-y-1">
                                            {section.items.map((item) => {
                                                const isActive = location.pathname === item.path
                                                return (
                                                    <NavLink
                                                        key={item.path}
                                                        to={item.path}
                                                        className={cn(
                                                            "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors group",
                                                            isActive
                                                                ? "bg-pink-100 text-pink-700 font-medium"
                                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                                                        )}
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <item.icon
                                                                className={cn(
                                                                    "h-4 w-4 flex-shrink-0",
                                                                    isActive ? "text-pink-600" : "text-gray-500 group-hover:text-gray-700",
                                                                )}
                                                            />
                                                            <span className="truncate">{item.label}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            {item.isNew && (
                                                                <Badge
                                                                    variant="default"
                                                                    className={cn(
                                                                        "text-xs h-4 px-1.5",
                                                                        item.isDanger
                                                                            ? "bg-red-600 hover:bg-red-600 text-white"
                                                                            : "bg-green-600 hover:bg-green-600 text-white",
                                                                    )}
                                                                >
                                                                    Mới
                                                                </Badge>
                                                            )}
                                                            {item.badge && (
                                                                <Badge
                                                                    variant={isActive ? "default" : "secondary"}
                                                                    className={cn("text-xs h-5 px-1.5", isActive ? "bg-pink-600 hover:bg-pink-600" : "")}
                                                                >
                                                                    {item.badge}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </NavLink>
                                                )
                                            })}
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}

                                {collapsed && (
                                    <div className="space-y-1">
                                        {section.items.map((item) => {
                                            const isActive = location.pathname === item.path
                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    className={cn(
                                                        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors relative group",
                                                        isActive
                                                            ? "bg-pink-100 text-pink-700"
                                                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                                                    )}
                                                    title={item.label}
                                                >
                                                    <item.icon className="h-5 w-5" />
                                                    {(item.badge || item.isNew) && (
                                                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-pink-600 hover:bg-pink-600">
                                                            {item.badge ? (Number.parseInt(item.badge) > 99 ? "99+" : item.badge) : "!"}
                                                        </Badge>
                                                    )}

                                                    {/* Tooltip */}
                                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                        {item.label}
                                                        {item.isNew && <span className="text-green-400 ml-1">(Mới)</span>}
                                                    </div>
                                                </NavLink>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3">
                {!collapsed ? (
                    <div className="text-center">
                        <p className="text-xs text-gray-500">HULO Admin v2.0</p>
                        <p className="text-xs text-gray-400">© 2024 HULO Platform</p>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-500">v2</span>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}

export default Sidebar