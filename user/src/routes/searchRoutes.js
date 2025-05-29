import { Route } from "react-router-dom"
import MainLayout from "../layouts/MainLayout"
import SearchPage from "../pages/search/SearchPage"

const SearchRoutes = (
    <Route path="/search" element={<MainLayout />}>
        <Route index element={<SearchPage />} />
    </Route>
)

export default SearchRoutes
