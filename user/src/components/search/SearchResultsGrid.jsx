"use client"

import { ShoppingCart, FileText, Store, Users } from "lucide-react"
import ProductCard from "./ProductCard"
import ShopCard from "./ShopCard"
import UserCard from "./UserCard"
import PostCard from "./PostCard"

const SearchResultsGrid = ({
    results,
    type,
    viewMode = "grid",
    onProductClick,
    onShopClick,
    onUserClick,
    onPostClick,
    onPostLike,
    onPostComment,
    onPostShare,
}) => {
    if (!results || results.length === 0) {
        const emptyStateConfig = {
            products: {
                icon: ShoppingCart,
                title: "Không tìm thấy sản phẩm",
                description: "Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc",
            },
            shops: {
                icon: Store,
                title: "Không tìm thấy shop",
                description: "Thử tìm kiếm với từ khóa khác",
            },
            users: {
                icon: Users,
                title: "Không tìm thấy người dùng",
                description: "Thử tìm kiếm với từ khóa khác",
            },
            posts: {
                icon: FileText,
                title: "Không tìm thấy bài viết",
                description: "Thử tìm kiếm với từ khóa khác",
            },
        }

        const config = emptyStateConfig[type] || emptyStateConfig.products
        const IconComponent = config.icon

        return (
            <div className="text-center py-12">
                <IconComponent className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">{config.title}</h2>
                <p className="text-gray-500">{config.description}</p>
            </div>
        )
    }

    const getGridClasses = () => {
        switch (type) {
            case "products":
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            case "shops":
            case "users":
                return "grid grid-cols-1 lg:grid-cols-2 gap-4"
            case "posts":
                return "space-y-4"
            default:
                return "grid grid-cols-1 gap-4"
        }
    }

    const renderCard = (item) => {
        switch (type) {
            case "products":
                return <ProductCard key={item._id} product={item} onProductClick={onProductClick} />
            case "shops":
                return <ShopCard key={item._id} shop={item} onShopClick={onShopClick} />
            case "users":
                return <UserCard key={item._id} user={item} onUserClick={onUserClick} />
            case "posts":
                return (
                    <PostCard
                        key={item._id}
                        post={item}
                        onPostClick={onPostClick}
                        onLike={onPostLike}
                        onComment={onPostComment}
                        onShare={onPostShare}
                    />
                )
            default:
                return null
        }
    }

    return <div className={getGridClasses()}>{results.map(renderCard)}</div>
}

export default SearchResultsGrid
