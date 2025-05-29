"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "../../contexts/CartContext"

const ShoppingCartWithBadge = ({ className = "", onClick }) => {
    const { getTotalItems } = useCart()
    const totalItems = getTotalItems()

    return (
        <div className="relative cursor-pointer" onClick={onClick}>
            <ShoppingCart className={className} />
            {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
                    {totalItems > 99 ? "99+" : totalItems}
                </span>
            )}
        </div>
    )
}

export default ShoppingCartWithBadge
