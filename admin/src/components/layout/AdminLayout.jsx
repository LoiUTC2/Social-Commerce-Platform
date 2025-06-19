"use client"

import { useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import Sidebar from "./Sidebar"
import Header from "./Header"

const AdminLayout = () => {
    const { user, loading } = useAuth()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-white">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin animation-delay-150"></div>
                </div>
                <div className="mt-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang tải...</h2>
                    <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return (
        // <div className="flex min-h-screen bg-gray-50">
        <div className="flex h-screen bg-gray-50">

            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <div className="flex-1 flex flex-col">
                <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
                {/* <main className="flex-1 p-6 overflow-y-auto"> */}
                <main className="flex-1 p-6 overflow-y-auto h-full">

                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
