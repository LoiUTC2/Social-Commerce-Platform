"use client"
import Banner from "./Banner"
import { Card, CardContent } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Sparkles, Zap, Gift, TrendingUp, Heart } from "lucide-react"

// Component showcase để demo các banner khác nhau
export default function BannerShowcase() {
    return (
        <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">🎨 Banner Sàn Thương Mại Điện Tử</h1>
                    <p className="text-lg text-gray-600">Thiết kế đẹp mắt, thu hút và tăng tương tác người dùng</p>
                </div>

                {/* Main Banner */}
                <Banner />

                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Hiệu Ứng Động</h3>
                            <p className="text-gray-600 text-sm">Animations mượt mà, floating particles và gradient transitions</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Tương Tác Cao</h3>
                            <p className="text-gray-600 text-sm">Auto-slide, navigation controls và hover effects hấp dẫn</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Responsive Design</h3>
                            <p className="text-gray-600 text-sm">Tối ưu cho mọi thiết bị từ mobile đến desktop</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Mini banners */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {/* Flash Sale Mini Banner */}
                    <Card className="overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                        <div className="relative h-32 bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10 text-center text-white">
                                <Zap className="w-8 h-8 mx-auto mb-2" />
                                <h3 className="font-bold text-lg">Flash Sale</h3>
                                <p className="text-sm opacity-90">Giảm đến 70%</p>
                            </div>
                            <Badge className="absolute top-2 right-2 bg-yellow-400 text-black">HOT</Badge>
                        </div>
                    </Card>

                    {/* New Collection Mini Banner */}
                    <Card className="overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                        <div className="relative h-32 bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10 text-center text-white">
                                <Sparkles className="w-8 h-8 mx-auto mb-2" />
                                <h3 className="font-bold text-lg">Bộ Sưu Tập Mới</h3>
                                <p className="text-sm opacity-90">Xu hướng 2024</p>
                            </div>
                            <Badge className="absolute top-2 right-2 bg-green-400 text-white">NEW</Badge>
                        </div>
                    </Card>

                    {/* Special Offer Mini Banner */}
                    <Card className="overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                        <div className="relative h-32 bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/10"></div>
                            <div className="relative z-10 text-center text-white">
                                <Gift className="w-8 h-8 mx-auto mb-2" />
                                <h3 className="font-bold text-lg">Ưu Đãi Đặc Biệt</h3>
                                <p className="text-sm opacity-90">Mua 1 tặng 1</p>
                            </div>
                            <Badge className="absolute top-2 right-2 bg-orange-400 text-white">1+1</Badge>
                        </div>
                    </Card>
                </div>

                {/* Features list */}
                <Card className="mt-8">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">✨ Tính Năng Nổi Bật</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Auto-slide với timer tùy chỉnh</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Gradient backgrounds động</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Floating particles animation</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Countdown timer thời gian thực</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Navigation controls mượt mà</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Responsive design hoàn hảo</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Hover effects và transitions</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                <span className="text-gray-700">Progress bar và indicators</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
