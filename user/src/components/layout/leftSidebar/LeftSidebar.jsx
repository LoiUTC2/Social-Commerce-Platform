import PopularKeywords from "./popularKeywords"
import FeaturedGroups from "./featuredGroups"
import UserProfile from "./userProfile"

export default function LeftSidebar() {
  return (
    <div className="space-y-4">
      <PopularKeywords />
      <FeaturedGroups />
      <UserProfile />
    </div>
  )
}