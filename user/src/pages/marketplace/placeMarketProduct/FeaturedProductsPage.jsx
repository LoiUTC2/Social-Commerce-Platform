import { Star } from "lucide-react"
import ProductListPage from "../../../components/marketplace/ProductListPage"

const FeaturedProductsPage = () => {
    return (
        <ProductListPage
            type="featured"
            title="🌟 Sản phẩm nổi bật"
            description="Những sản phẩm được yêu thích và đánh giá cao nhất"
            icon={Star}
            gradient="bg-gradient-to-r from-pink-500 to-pink-600"
        />
    )
}

export default FeaturedProductsPage
