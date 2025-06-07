import SuggestedProducts from "./suggested-products"
import TopStores from "./top-stores"
import EventsNotifications from "./events-notifications"

export default function RightSidebar() {
  return (
    <div className="space-y-4">
      <SuggestedProducts />
      <TopStores />
      <EventsNotifications />
    </div>
  )
}
