import { Sparkles } from "lucide-react"
import ProductListPage from "../../../components/marketplace/ProductListPage"

const SuggestedProductsPage = () => {
    return (
        <ProductListPage
            type="suggested"
            title="💡 Gợi ý cho bạn"
            description="Sản phẩm được AI phân tích dành riêng cho sở thích của bạn"
            icon={Sparkles}
            gradient="bg-gradient-to-r from-purple-500 to-pink-500"
        />
    )
}

export default SuggestedProductsPage
