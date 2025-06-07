"use client"

import { Card, CardContent } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Users, Bookmark, UserCircle2 } from "lucide-react"
import avtAcount from '../../../assets/anh-avatar-trang-tron.jpg';
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../contexts/AuthContext"

export default function UserProfile() {
    const navigate = useNavigate()
    const {user} = useAuth();

    return (
        <Card>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <img src={user?.avatar || avtAcount} alt="avatar" className="w-12 h-12 rounded-full" />
                    <div>
                        <p className="font-semibold text-base">{user?.fullName || user?.name || "Tài Khoản Người Dùng"}</p>
                        <p className="text-xs text-gray-500">Vai trò: {user?.role || "Chưa xác thực"}</p>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-gray-700">
                        <Users className="w-4 h-4" /> Bạn bè: <span className="font-medium">124</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                        <UserCircle2 className="w-4 h-4" /> Hội nhóm tham gia: <span className="font-medium">8</span>
                    </p>
                    <p className="flex items-center gap-2 text-gray-700">
                        <Bookmark className="w-4 h-4" /> Đã lưu: <span className="font-medium">12 bài viết</span>
                    </p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate(`/feed/profile/${user?.slug}`)}>
                    Trang cá nhân
                </Button>
            </CardContent>
        </Card>
    )
}
