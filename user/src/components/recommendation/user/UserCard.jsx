"use client"

import { useState } from "react"
import { Heart, MapPin, Calendar, Users, MessageCircle, Verified, Sparkles, User } from "lucide-react"
import { Button } from "../../ui/button"
import { Card, CardContent } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { useAuth } from "../../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

const UserCard = ({ user, onFollow, isFollowing, className = "" }) => {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const { isAuthenticated, setShowLoginModal } = useAuth()

    const handleFollowClick = () => {
        if (!isAuthenticated) {
            setShowLoginModal(true)
            return
        }
        onFollow(user._id, "user")
    }

    // Format join date
    const formatJoinDate = (date) => {
        if (!date) return ""
        const joinDate = new Date(date)
        const now = new Date()
        const diffTime = Math.abs(now - joinDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 30) {
            return `${diffDays} ngày trước`
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30)
            return `${months} tháng trước`
        } else {
            const years = Math.floor(diffDays / 365)
            return `${years} năm trước`
        }
    }

    return (
        <Card
            className={`group relative overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 shadow-lg hover:shadow-pink-100/50 ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-all duration-500" />

            {/* Sparkle effect */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200">
                <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
            </div>

            <CardContent className="p-0">
                {/* Cover/Background Section */}
                <div className="relative h-32 bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100 overflow-hidden">
                    {user.coverImage ? (
                        <>
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                </div>
                            )}
                            <img
                                src={user.coverImage || "/placeholder.svg"}
                                alt={`${user.fullName} cover`}
                                className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? "opacity-100" : "opacity-0"
                                    } ${isHovered ? "scale-110 brightness-110" : "scale-100"}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageLoaded(true)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-100 via-pink-50 to-purple-100 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            <User className="w-12 h-12 text-pink-400/60" />
                        </div>
                    )}

                    {/* Follow button overlay */}
                    <div className="absolute top-3 right-3 transform transition-all duration-300 hover:scale-105">
                        <Button
                            size="sm"
                            variant={isFollowing ? "default" : "outline"}
                            className={`${isFollowing
                                ? "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white border-0 shadow-lg"
                                : "bg-white/95 hover:bg-white text-pink-600 border-pink-200/50 shadow-lg backdrop-blur-sm"
                                } transition-all duration-300 font-medium`}
                            onClick={handleFollowClick}
                        >
                            <Heart
                                className={`w-4 h-4 mr-1.5 transition-transform duration-200 ${isFollowing ? "fill-current scale-110" : "hover:scale-110"}`}
                            />
                            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                        </Button>
                    </div>


                </div>

                {/* User Info Section */}
                <div className="p-6 pt-6" onClick={() => navigate(`/feed/profile/${user.slug}`)}>
                    <div className="flex items-start gap-4 mb-4">
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-white shadow-xl border-4 border-white overflow-hidden transform transition-all duration-300 group-hover:scale-105">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar || "/placeholder.svg"}
                                            alt={`${user.fullName} avatar`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">{user.fullName?.charAt(0)?.toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                {user.isActive && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                                        <Verified className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* User name and status */}
                        <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-xl text-gray-900 truncate group-hover:text-pink-600 transition-colors duration-300 leading-tight">
                                    {user.fullName}
                                </h3>
                            </div>

                            {user.isActive && (
                                <Badge
                                    variant="secondary"
                                    className="bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-0 font-medium"
                                >
                                    <Verified className="w-3 h-3 mr-1" />
                                    Đang hoạt động
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{user.bio}</p>}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            {/* Followers */}
                            <div className="flex items-center bg-pink-50 px-2 py-1 rounded-lg">
                                <Users className="w-4 h-4 text-pink-500 mr-1" />
                                <span className="font-semibold text-gray-800 text-sm">{user.followersCount || 0}</span>
                            </div>

                            {/* Join date */}
                            {user.createdAt && (
                                <div className="flex items-center bg-purple-50 px-2 py-1 rounded-lg">
                                    <Calendar className="w-4 h-4 text-purple-500 mr-1" />
                                    <span className="font-medium text-gray-700 text-xs">{formatJoinDate(user.createdAt)}</span>
                                </div>
                            )}
                        </div>

                        {/* Message button */}
                        <Button
                            size="sm"
                            variant="outline"
                            className="bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-800"
                        >
                            <MessageCircle className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Location */}
                    {user.address && (
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="truncate font-medium">{user.address}</span>
                        </div>
                    )}

                    {/* Role/Status Tags */}
                    <div className="flex flex-wrap gap-2">
                        {user.roles &&
                            user.roles.length > 0 &&
                            user.roles.map((role, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className={`text-xs font-medium ${role === "seller"
                                        ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200"
                                        : role === "admin"
                                            ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200"
                                            : "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200"
                                        }`}
                                >
                                    {role === "seller" ? "🏪 Người bán" : role === "admin" ? "👑 Quản trị" : "👤 Người mua"}
                                </Badge>
                            ))}
                    </div>
                </div>
            </CardContent>

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-400/10 via-purple-400/5 to-pink-400/10 blur-xl" />
            </div>
        </Card>
    )
}

export default UserCard
