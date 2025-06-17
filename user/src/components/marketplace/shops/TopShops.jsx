"use client"

import FeaturedShops from "./FeaturedShops"
import RecommendedShops from "./RecommendedShops"

export default function TopShops() {
  return (
    <div className="space-y-6">
      <FeaturedShops />
      <RecommendedShops />
    </div>
  )
}
