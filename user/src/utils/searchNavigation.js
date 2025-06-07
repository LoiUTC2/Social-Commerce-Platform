// Utility functions for search navigation

/**
 * Navigate to search page with category filter
 * @param {Function} navigate - React Router navigate function
 * @param {string} categoryId - Category ID to search
 * @param {string} categoryName - Category name for display
 */
export const navigateToCategory = (navigate, categoryId, categoryName = "") => {
    const params = new URLSearchParams()
    params.set("categoryId", categoryId)
    if (categoryName) {
        params.set("categoryName", categoryName)
    }
    navigate(`/search?${params.toString()}`)
}

/**
 * Navigate to search page with hashtag filter
 * @param {Function} navigate - React Router navigate function
 * @param {string} hashtag - Hashtag to search (with or without #)
 */
export const navigateToHashtag = (navigate, hashtag) => {
    const cleanHashtag = hashtag.replace(/^#/, "") // Remove # if present
    const params = new URLSearchParams()
    params.set("hashtag", cleanHashtag)
    navigate(`/search?${params.toString()}`)
}

/**
 * Navigate to search page with keyword
 * @param {Function} navigate - React Router navigate function
 * @param {string} keyword - Search keyword
 */
export const navigateToSearch = (navigate, keyword) => {
    const params = new URLSearchParams()
    params.set("q", keyword)
    navigate(`/search?${params.toString()}`)
}

/**
 * Create hashtag click handler
 * @param {Function} navigate - React Router navigate function
 * @returns {Function} Click handler function
 */
export const createHashtagClickHandler = (navigate) => {
    return (hashtag) => {
        navigateToHashtag(navigate, hashtag)
    }
}

/**
 * Create category click handler
 * @param {Function} navigate - React Router navigate function
 * @returns {Function} Click handler function
 */
export const createCategoryClickHandler = (navigate) => {
    return (categoryId, categoryName) => {
        navigateToCategory(navigate, categoryId, categoryName)
    }
}

/**
 * Parse search params from URL
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Parsed search parameters
 */
export const parseSearchParams = (searchParams) => {
    return {
        q: searchParams.get("q") || "",
        hashtag: searchParams.get("hashtag") || "",
        categoryId: searchParams.get("categoryId") || "",
        categoryName: searchParams.get("categoryName") || "",
        tab: searchParams.get("tab") || "all",
    }
}

/**
 * Build search URL with parameters
 * @param {Object} params - Search parameters
 * @returns {string} Search URL
 */
export const buildSearchUrl = (params) => {
    const urlParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
            urlParams.set(key, value.toString().trim())
        }
    })

    return `/search?${urlParams.toString()}`
}
