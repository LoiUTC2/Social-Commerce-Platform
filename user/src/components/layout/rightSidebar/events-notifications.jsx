import { Card, CardContent } from "../../../components/ui/card"

export default function EventsNotifications() {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="font-semibold mb-2">Sự kiện & Thông báo</p>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>🎉 Sale 4.4 giảm 70%</li>
                    <li>🛍️ Miễn phí vận chuyển toàn quốc</li>
                    <li>🎁 Tặng voucher 50k cho thành viên mới</li>
                </ul>
            </CardContent>
        </Card>
    )
}
