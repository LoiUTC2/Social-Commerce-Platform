import { Card, CardContent } from "../../../components/ui/card"

export default function SuggestedProducts() {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="font-semibold mb-2">Gợi ý sản phẩm</p>
                <ul className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <li key={i} className="flex items-center gap-2">
                            <img
                                src={`https://source.unsplash.com/random/40x40?product${i}`}
                                className="rounded"
                                alt={`Sản phẩm ${i}`}
                            />
                            <div>
                                <p className="text-sm font-medium">Sản phẩm {i}</p>
                                <p className="text-xs text-gray-500">Giá: {100 * i}.000đ</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
