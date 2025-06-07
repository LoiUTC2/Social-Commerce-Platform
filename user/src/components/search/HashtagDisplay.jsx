"use client"

import { Badge } from "../../components/ui/badge"
import { Hash } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { navigateToHashtag } from "../../utils/searchNavigation"

const HashtagDisplay = ({ hashtags = [], className = "", limit = 5, size = "sm" }) => {
    const navigate = useNavigate()

    if (!hashtags || hashtags.length === 0) {
        return null
    }

    const displayHashtags = limit ? hashtags.slice(0, limit) : hashtags
    const remainingCount = hashtags.length - displayHashtags.length

    const handleHashtagClick = (hashtag) => {
        navigateToHashtag(navigate, hashtag)
    }

    return (
        <div className={`flex flex-wrap gap-1 ${className}`}>
            {displayHashtags.map((hashtag, index) => (
                <Badge
                    key={index}
                    variant="secondary"
                    className={`cursor-pointer hover:bg-pink-100 hover:text-pink-700 transition-colors ${size === "xs" ? "text-xs px-2 py-1" : ""
                        }`}
                    onClick={() => handleHashtagClick(hashtag)}
                >
                    <Hash className="h-3 w-3 mr-1" />
                    {hashtag}
                </Badge>
            ))}

            {remainingCount > 0 && (
                <Badge variant="outline" className="text-xs">
                    +{remainingCount}
                </Badge>
            )}
        </div>
    )
}

export default HashtagDisplay
