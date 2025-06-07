"use client"

import { Card, CardContent } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { useState } from "react"

// Import ảnh (bạn cần điều chỉnh đường dẫn phù hợp với project của bạn)
import hoiYeuCN from "../../../assets/hoiYeuCongnghe.png"
import hoimacDep from "../../../assets/hoiMacDep.png"
import hoihanmade from "../../../assets/hoiHanmade.png"

export default function FeaturedGroups() {
    const [hoveredGroup, setHoveredGroup] = useState(null)

    const groups = [
        {
            id: 1,
            name: "Hội Yêu Công Nghệ",
            members: "120k",
            image: hoiYeuCN,
            joined: false,
        },
        {
            id: 2,
            name: "Cộng đồng Mặc Đẹp",
            members: "85k",
            image: hoimacDep,
            joined: true,
        },
        {
            id: 3,
            name: "Đồ Handmade Tinh Tế",
            members: "50k",
            image: hoihanmade,
            joined: false,
        },
    ]

    return (
        <Card>
            <CardContent className="p-4">
                <p className="font-semibold mb-2">👥 Hội nhóm nổi bật</p>
                <ul className="space-y-2 text-sm text-gray-700">
                    {groups.map((group) => (
                        <li
                            key={group.id}
                            className="flex items-center justify-between p-2 rounded hover:bg-gray-100 transition"
                            onMouseEnter={() => setHoveredGroup(group.id)}
                            onMouseLeave={() => setHoveredGroup(null)}
                        >
                            <div className="flex items-center gap-2">
                                <img src={group.image || "/placeholder.svg"} className="rounded-md w-8 h-8" alt={group.name} />
                                <div>
                                    <p className="font-medium">{group.name}</p>
                                    <p className="text-xs text-gray-500">{group.members} thành viên</p>
                                </div>
                            </div>

                            {hoveredGroup === group.id && !group.joined && (
                                <Button size="sm" variant="outline">
                                    Tham gia
                                </Button>
                            )}

                            {group.joined && hoveredGroup === group.id && <span className="text-xs text-green-600">Đã tham gia</span>}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
