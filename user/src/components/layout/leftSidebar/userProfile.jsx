"use client"

import { Card, CardContent } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Users, Bookmark, UserCircle2, Crown, Star, TrendingUp, ArrowRight } from "lucide-react"
import avtAcount from "../../../assets/anh-avatar-trang-tron.jpg"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../contexts/AuthContext"

export default function UserProfile() {
    const navigate = useNavigate()
    const { user } = useAuth()

    const stats = [
        {
            icon: Users,
            label: "Bạn bè",
            value: "124",
            color: "text-pink-600",
            bgColor: "bg-pink-50",
        },
        {
            icon: UserCircle2,
            label: "Hội nhóm",
            value: "8",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            icon: Bookmark,
            label: "Đã lưu",
            value: "12",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
    ]

    const getRoleInfo = (role) => {
        switch (role?.toLowerCase()) {
            case "admin":
                return { text: "Quản trị viên", icon: Crown, color: "bg-gradient-to-r from-yellow-400 to-orange-500" }
            case "buyer":
                return { text: "Người mua", icon: Star, color: "bg-gradient-to-r from-purple-500 to-pink-500" }
            case "seller":
                return { text: "Người bán", icon: TrendingUp, color: "bg-gradient-to-r from-pink-500 to-rose-500" }
            default:
                return { text: "Khách", icon: UserCircle2, color: "bg-gradient-to-r from-gray-400 to-gray-500" }
        }
    }

    const roleInfo = getRoleInfo(user?.role)
    const RoleIcon = roleInfo.icon

    return (
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-pink-50/30">
            <CardContent className="p-0">
                {/* Header với gradient background */}
                <div className="relative bg-gradient-to-r from-pink-500 via-pink-600 to-rose-500 p-4 pb-8">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative flex items-center gap-3">
                        <div className="relative">
                            <img
                                src={user?.avatar || avtAcount}
                                alt="avatar"
                                className="w-14 h-14 rounded-full border-3 border-white/80 shadow-lg object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-base truncate">
                                {user?.fullName || user?.name || "Tài Khoản Người Dùng"}
                            </h3>
                            <Badge className={`${roleInfo.color} text-white border-0 text-xs mt-1`}>
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {roleInfo.text}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Stats section */}
                <div className="p-4 -mt-4 relative">
                    <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-3 mb-4">
                        <div className="grid grid-cols-3 gap-3">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon
                                return (
                                    <div key={index} className="text-center">
                                        <div
                                            className={`${stat.bgColor} ${stat.color} w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-900">{stat.value}</p>
                                        <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="space-y-2">
                        <Button
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 group"
                            onClick={() => navigate(`/feed/profile/${user?.slug}`)}
                        >
                            <UserCircle2 className="w-4 h-4 mr-2" />
                            Trang cá nhân
                            <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                                onClick={() => navigate("/friends")}
                            >
                                <Users className="w-3 h-3 mr-1" />
                                Bạn bè
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300"
                                onClick={() => navigate("/saved")}
                            >
                                <Bookmark className="w-3 h-3 mr-1" />
                                Đã lưu
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
