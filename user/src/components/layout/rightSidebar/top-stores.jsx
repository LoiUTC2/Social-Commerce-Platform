import { Card, CardContent } from "../../../components/ui/card"

export default function TopStores() {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="font-semibold mb-2">Top gian hàng</p>
                <ul className="text-sm space-y-1 text-blue-600">
                    <li>🌟 SneakerZone</li>
                    <li>🎒 BaloStore</li>
                    <li>👚 FashionHouse</li>
                </ul>
            </CardContent>
        </Card>
    )
}
