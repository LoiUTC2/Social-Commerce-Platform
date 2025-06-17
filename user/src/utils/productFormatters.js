// Format currency
export const formatCurrency = (amount) => {
    if (typeof amount !== "number" || isNaN(amount)) {
        return "0 ₫"
    }
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount)
}

// Format rating safely
export const formatRating = (rating) => {
    if (typeof rating === "number" && !isNaN(rating)) {
        return rating.toFixed(1)
    }
    return "0.0"
}

// Format number safely
export const formatNumber = (num) => {
    if (typeof num === "number" && !isNaN(num)) {
        return num.toString()
    }
    return "0"
}

// Check if product is new (within 7 days)
export const isNewProduct = (createdAt) => {
    if (!createdAt) return false
    try {
        const now = new Date()
        const productDate = new Date(createdAt)
        if (isNaN(productDate.getTime())) return false

        const diffTime = Math.abs(now - productDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 7
    } catch (error) {
        console.error("Error checking if product is new:", error)
        return false
    }
}

// Calculate discounted price safely
export const calculateDiscountedPrice = (price, discount) => {
    if (typeof price !== "number" || typeof discount !== "number") {
        return price || 0
    }
    if (discount <= 0 || discount > 100) {
        return price
    }
    return price - price * (discount / 100)
}
