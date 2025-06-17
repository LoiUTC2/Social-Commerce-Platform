import { Clock } from "lucide-react"
import ProductListPage from "../../../components/marketplace/ProductListPage"

const LatestProductsPage = () => {
    return (
        <ProductListPage
            type="latest"
            title="🆕 Sản phẩm mới nhất"
            description="Những sản phẩm vừa được cập nhật gần đây"
            icon={Clock}
            gradient="bg-gradient-to-r from-green-500 to-teal-500"
        />
    )
}

export default LatestProductsPage
