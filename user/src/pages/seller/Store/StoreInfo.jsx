"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Button } from "../../../components/ui/button"
import { Switch } from "../../../components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Loader2, Save, Store, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Tag, Search, Package, AlertTriangle, } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import { ImageUpload } from "../../../components/common/ImageUploadForSeller"
import { getMyShop, updateShop } from "../../../services/shopService"
import { getCategoryTree } from "../../../services/categoryService"
import { Badge } from "../../../components/ui/badge"
import { Separator } from "../../../components/ui/separator"

const StoreInfo = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [shopData, setShopData] = useState({
    name: "",
    description: "",
    avatar: "",
    logo: "",
    coverImage: "",
    contact: {
      phone: "",
      email: "",
      businessAddress: {
        street: "",
        ward: "",
        district: "",
        city: "",
        province: "",
        postalCode: "",
        country: "Vietnam",
      },
    },
    customerSupport: {
      email: "",
      phone: "",
      operatingHours: "",
      socialMediaLinks: {
        facebook: "",
        instagram: "",
        youtube: "",
        tiktok: "",
      },
    },
    productInfo: {
      mainCategory: "",
      subCategories: [],
      brands: [],
      productRestrictions: [],
    },
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
    },
    tags: [],
    status: {
      isActive: true,
    },
  })

  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Mock data cho categories - trong thực tế sẽ fetch từ API
  // const categories = [
  //   { _id: "cat1", name: "Thời trang" },
  //   { _id: "cat2", name: "Điện tử" },
  //   { _id: "cat3", name: "Gia dụng" },
  //   { _id: "cat4", name: "Sách" },
  //   { _id: "cat5", name: "Thể thao" },
  // ]

  // Lấy thông tin shop khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingCategories(true)

        // Lấy dữ liệu shop
        const shopResponse = await getMyShop()
        if (shopResponse.success) {
          setShopData({
            ...shopResponse.data,
            // Đảm bảo các trường luôn có giá trị mặc định
            productInfo: shopResponse.data.productInfo || {
              mainCategory: "",
              subCategories: [],
              brands: [],
              productRestrictions: [],
            },
            seo: shopResponse.data.seo || {
              metaTitle: "",
              metaDescription: "",
              keywords: [],
            },
            tags: shopResponse.data.tags || [],
          })
        }

        // Lấy dữ liệu danh mục
        const categoryResponse = await getCategoryTree()
        if (categoryResponse.success) {
          setCategories(categoryResponse.data)
        }
      } catch (err) {
        setError(err.response?.data?.message || "Không thể tải thông tin. Vui lòng thử lại sau.")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
        setLoadingCategories(false)
      }
    }

    fetchData()
  }, [])

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target

    // Xử lý các trường lồng nhau (nested fields)
    if (name.includes(".")) {
      const parts = name.split(".")
      setShopData((prev) => {
        const newData = { ...prev }
        let current = newData

        // Đi đến object lồng nhau cuối cùng
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {}
          current = current[parts[i]]
        }

        // Cập nhật giá trị
        current[parts[parts.length - 1]] = value
        return newData
      })
    } else {
      setShopData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Xử lý thay đổi hình ảnh
  const handleImageChange = (field, value) => {
    setShopData((prev) => ({ ...prev, [field]: value }))
  }

  // Xử lý thay đổi danh mục chính
  const handleMainCategoryChange = (value) => {
    setShopData((prev) => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        mainCategory: value,
      },
    }))
  }

  // Xử lý thay đổi trạng thái
  const handleStatusChange = (checked) => {
    setShopData((prev) => ({
      ...prev,
      status: {
        ...prev.status,
        isActive: checked,
      },
    }))
  }

  // Xử lý thêm/xóa brand
  const handleBrandsChange = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = e.target.value.trim()
      if (value && !shopData.productInfo.brands.includes(value)) {
        setShopData((prev) => ({
          ...prev,
          productInfo: {
            ...prev.productInfo,
            brands: [...prev.productInfo.brands, value],
          },
        }))
        e.target.value = ""
      }
    }
  }

  const removeBrand = (brandToRemove) => {
    setShopData((prev) => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        brands: prev.productInfo.brands.filter((brand) => brand !== brandToRemove),
      },
    }))
  }

  // Xử lý thêm/xóa keywords SEO
  const handleKeywordsChange = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = e.target.value.trim()
      if (value && !shopData.seo.keywords.includes(value)) {
        setShopData((prev) => ({
          ...prev,
          seo: {
            ...prev.seo,
            keywords: [...prev.seo.keywords, value],
          },
        }))
        e.target.value = ""
      }
    }
  }

  const removeKeyword = (keywordToRemove) => {
    setShopData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter((keyword) => keyword !== keywordToRemove),
      },
    }))
  }

  // Xử lý thêm/xóa tags
  const handleTagsChange = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = e.target.value.trim()
      if (value && !shopData.tags.includes(value)) {
        setShopData((prev) => ({
          ...prev,
          tags: [...prev.tags, value],
        }))
        e.target.value = ""
      }
    }
  }

  const removeTag = (tagToRemove) => {
    setShopData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  // Xử lý lưu thông tin
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError("")
      const response = await updateShop(shopData)

      if (response.success) {
        setSuccess(true)
        setShopData(response.data)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(response.message || "Có lỗi xảy ra khi cập nhật thông tin cửa hàng")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật thông tin cửa hàng. Vui lòng thử lại sau.")
      console.error("Error updating shop:", err)
    } finally {
      setSaving(false)
    }
  }

  // Xử lý thay đổi danh mục con
  const handleSubCategoryChange = (selectedIds) => {
    setShopData((prev) => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        subCategories: selectedIds,
      },
    }))
  }

  // Lấy tên danh mục từ ID
  const getCategoryNameById = (categoryId) => {
    const findCategory = (categories, id) => {
      for (const category of categories) {
        if (category._id === id) return category.name
        if (category.children && category.children.length > 0) {
          const found = findCategory(category.children, id)
          if (found) return found
        }
      }
      return "Danh mục không xác định"
    }

    return findCategory(categories, categoryId)
  }

  // Tạo options cho danh mục
  const getCategoryOptions = (categoriesData, level = 0) => {
    if (!categoriesData) return []

    let options = []

    categoriesData.forEach((category) => {
      options.push({
        value: category._id,
        label: "  ".repeat(level) + (level > 0 ? "└ " : "") + category.name,
        disabled: level === 0, // Vô hiệu hóa danh mục cấp 1 (chỉ chọn từ cấp 2 trở xuống)
      })

      if (category.children && category.children.length > 0) {
        options = [...options, ...getCategoryOptions(category.children, level + 1)]
      }
    })

    return options
  }

  // Xử lý thêm/xóa product restrictions
  const handleProductRestrictionsChange = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = e.target.value.trim()
      if (value && !shopData.productInfo.productRestrictions.includes(value)) {
        setShopData((prev) => ({
          ...prev,
          productInfo: {
            ...prev.productInfo,
            productRestrictions: [...prev.productInfo.productRestrictions, value],
          },
        }))
        e.target.value = ""
      }
    }
  }

  const removeProductRestriction = (restriction) => {
    setShopData((prev) => ({
      ...prev,
      productInfo: {
        ...prev.productInfo,
        productRestrictions: prev.productInfo.productRestrictions.filter((r) => r !== restriction),
      },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-2 text-lg">Đang tải thông tin cửa hàng...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-500">
          <AlertTitle>Thành công!</AlertTitle>
          <AlertDescription>Thông tin cửa hàng đã được cập nhật thành công.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-500">
          <AlertTitle className="text-red-700">Lỗi!</AlertTitle>
          <AlertDescription className="text-red-600">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Thông tin cửa hàng</h1>
          <p className="text-gray-500">Quản lý thông tin cửa hàng của bạn</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Trạng thái:</span>
          <Badge variant={shopData.status?.isActive ? "success" : "secondary"} className="px-2 py-1">
            {shopData.status?.isActive ? "Đang hoạt động" : "Tạm ngưng"}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
            <TabsTrigger value="product">Sản phẩm & Ngành hàng</TabsTrigger>
            <TabsTrigger value="seo">SEO & Tìm kiếm</TabsTrigger>
            <TabsTrigger value="contact">Liên hệ & Hỗ trợ</TabsTrigger>
          </TabsList>

          {/* Tab Thông tin cơ bản */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="mr-2 h-5 w-5" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>Thiết lập thông tin cơ bản cho cửa hàng của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Tên cửa hàng <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Nhập tên cửa hàng"
                      value={shopData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Trạng thái cửa hàng</Label>
                    <div className="flex items-center space-x-2">
                      <Switch id="status" checked={shopData.status?.isActive} onCheckedChange={handleStatusChange} />
                      <Label htmlFor="status" className="cursor-pointer">
                        {shopData.status?.isActive ? "Đang hoạt động" : "Tạm ngưng hoạt động"}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả cửa hàng</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Mô tả về cửa hàng của bạn"
                    value={shopData.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-4">Hình ảnh cửa hàng</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>
                      Ảnh đại diện <span className="text-red-500">*</span>
                    </Label>
                    <ImageUpload
                      value={shopData.avatar}
                      onChange={(value) => handleImageChange("avatar", value)}
                      label="Tải ảnh đại diện"
                      aspectRatio="square"
                      previewSize="medium"
                    />
                    <p className="text-xs text-gray-500">Ảnh đại diện sẽ hiển thị trên trang cửa hàng</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo cửa hàng</Label>
                    <ImageUpload
                      value={shopData.logo}
                      onChange={(value) => handleImageChange("logo", value)}
                      label="Tải logo"
                      aspectRatio="square"
                      previewSize="medium"
                    />
                    <p className="text-xs text-gray-500">Logo sẽ hiển thị trên trang sản phẩm và đơn hàng</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Ảnh bìa</Label>
                    <ImageUpload
                      value={shopData.coverImage}
                      onChange={(value) => handleImageChange("coverImage", value)}
                      label="Tải ảnh bìa"
                      aspectRatio="landscape"
                      previewSize="medium"
                    />
                    <p className="text-xs text-gray-500">Ảnh bìa sẽ hiển thị ở đầu trang cửa hàng</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Tags cửa hàng</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {shopData.tags?.map((tag, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1 px-2 py-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input placeholder="Nhập tag và nhấn Enter" onKeyPress={handleTagsChange} />
                  <p className="text-xs text-gray-500">Nhấn Enter để thêm tag</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Sản phẩm & Ngành hàng */}
          <TabsContent value="product">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Thông tin sản phẩm và ngành hàng
                </CardTitle>
                <CardDescription>Thiết lập danh mục và thông tin sản phẩm kinh doanh</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="mainCategory">
                    Danh mục chính <span className="text-red-500">*</span>
                  </Label>
                  {loadingCategories ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">Đang tải danh mục...</span>
                    </div>
                  ) : (
                    <Select value={shopData.productInfo?.mainCategory} onValueChange={handleMainCategoryChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn danh mục chính" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-gray-500">Danh mục chính sẽ quyết định vị trí hiển thị cửa hàng của bạn</p>
                </div>

                <div className="space-y-2">
                  <Label>Danh mục sản phẩm kinh doanh</Label>
                  {loadingCategories ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">Đang tải danh mục...</span>
                    </div>
                  ) : (
                    <>
                      <Select
                        onValueChange={(value) => {
                          if (!shopData.productInfo.subCategories.includes(value)) {
                            handleSubCategoryChange([...shopData.productInfo.subCategories, value])
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn danh mục sản phẩm kinh doanh" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px]">
                          {getCategoryOptions(categories).map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled || shopData.productInfo.subCategories.includes(option.value)}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {shopData.productInfo?.subCategories?.map((categoryId) => (
                          <Badge key={categoryId} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                            {getCategoryNameById(categoryId)}
                            <button
                              type="button"
                              onClick={() =>
                                handleSubCategoryChange(
                                  shopData.productInfo.subCategories.filter((id) => id !== categoryId),
                                )
                              }
                              className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                        {shopData.productInfo?.subCategories?.length === 0 && (
                          <span className="text-sm text-gray-500 italic">Chưa chọn danh mục nào</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Chọn các danh mục sản phẩm bạn sẽ kinh doanh trong cửa hàng
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Thương hiệu kinh doanh</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {shopData.productInfo?.brands?.map((brand, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {brand}
                        <button
                          type="button"
                          onClick={() => removeBrand(brand)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {shopData.productInfo?.brands?.length === 0 && (
                      <span className="text-sm text-gray-500 italic">Chưa có thương hiệu nào</span>
                    )}
                  </div>
                  <Input placeholder="Nhập tên thương hiệu và nhấn Enter" onKeyPress={handleBrandsChange} />
                  <p className="text-xs text-gray-500">Nhấn Enter để thêm thương hiệu</p>
                </div>

                <div className="space-y-2">
                  <Label>Hạn chế sản phẩm</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {shopData.productInfo?.productRestrictions?.map((restriction, index) => (
                      <Badge
                        key={index}
                        variant="destructive"
                        className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        {restriction}
                        <button
                          type="button"
                          onClick={() => removeProductRestriction(restriction)}
                          className="ml-1 text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {shopData.productInfo?.productRestrictions?.length === 0 && (
                      <span className="text-sm text-gray-500 italic">Không có hạn chế nào</span>
                    )}
                  </div>
                  <Input
                    placeholder="Nhập hạn chế sản phẩm và nhấn Enter"
                    onKeyPress={handleProductRestrictionsChange}
                  />
                  <p className="text-xs text-gray-500">
                    Nhập các loại sản phẩm mà bạn không được phép bán (VD: Hàng cấm, đồ nguy hiểm...)
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">Lưu ý về sản phẩm:</p>
                      <ul className="text-sm text-gray-600 mt-1 space-y-1 list-disc list-inside">
                        <li>Chọn danh mục chính phù hợp với sản phẩm bạn kinh doanh</li>
                        <li>Thương hiệu giúp khách hàng dễ dàng tìm kiếm sản phẩm</li>
                        <li>Đảm bảo thông tin sản phẩm tuân thủ quy định của nền tảng</li>
                        <li>Hạn chế sản phẩm giúp bạn lưu ý về các mặt hàng không được phép kinh doanh</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab SEO & Tìm kiếm */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  Tối ưu hóa tìm kiếm (SEO)
                </CardTitle>
                <CardDescription>Cải thiện khả năng tìm kiếm cửa hàng trên các công cụ tìm kiếm</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="seo.metaTitle">Tiêu đề SEO</Label>
                  <Input
                    id="seo.metaTitle"
                    name="seo.metaTitle"
                    placeholder="Tiêu đề hiển thị trên kết quả tìm kiếm"
                    value={shopData.seo?.metaTitle || ""}
                    onChange={handleChange}
                    maxLength={60}
                  />
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-500">Tiêu đề hiển thị trên kết quả tìm kiếm</p>
                    <p
                      className={`text-xs ${(shopData.seo?.metaTitle?.length || 0) > 50 ? "text-amber-500" : "text-gray-500"}`}
                    >
                      {shopData.seo?.metaTitle?.length || 0}/60 ký tự
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo.metaDescription">Mô tả SEO</Label>
                  <Textarea
                    id="seo.metaDescription"
                    name="seo.metaDescription"
                    placeholder="Mô tả ngắn gọn về cửa hàng hiển thị trong kết quả tìm kiếm"
                    value={shopData.seo?.metaDescription || ""}
                    onChange={handleChange}
                    rows={3}
                    maxLength={160}
                  />
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-500">Mô tả hiển thị dưới tiêu đề trong kết quả tìm kiếm</p>
                    <p
                      className={`text-xs ${(shopData.seo?.metaDescription?.length || 0) > 140 ? "text-amber-500" : "text-gray-500"}`}
                    >
                      {shopData.seo?.metaDescription?.length || 0}/160 ký tự
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Từ khóa SEO</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {shopData.seo?.keywords?.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 px-2 py-1"
                      >
                        <Search className="h-3 w-3" />
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input placeholder="Nhập từ khóa và nhấn Enter" onKeyPress={handleKeywordsChange} />
                  <p className="text-xs text-gray-500">Nhấn Enter để thêm từ khóa</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Search className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Tips SEO:</p>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside">
                        <li>Tiêu đề SEO nên chứa tên cửa hàng và từ khóa chính</li>
                        <li>Mô tả SEO nên súc tích, hấp dẫn và chứa từ khóa</li>
                        <li>Sử dụng từ khóa liên quan đến sản phẩm bạn bán</li>
                        <li>Thêm từ khóa địa phương nếu bạn phục vụ một khu vực cụ thể</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Liên hệ & Hỗ trợ */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Thông tin liên hệ và hỗ trợ
                </CardTitle>
                <CardDescription>Cập nhật thông tin liên hệ và hỗ trợ khách hàng</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact.email">
                      <Mail className="inline h-4 w-4 mr-1" /> Email liên hệ
                    </Label>
                    <Input
                      id="contact.email"
                      name="contact.email"
                      placeholder="Email liên hệ"
                      value={shopData.contact?.email || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact.phone">
                      <Phone className="inline h-4 w-4 mr-1" /> Số điện thoại
                    </Label>
                    <Input
                      id="contact.phone"
                      name="contact.phone"
                      placeholder="Số điện thoại liên hệ"
                      value={shopData.contact?.phone || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-4">Địa chỉ cửa hàng</h3>

                <div className="space-y-2">
                  <Label htmlFor="contact.businessAddress.street">
                    <MapPin className="inline h-4 w-4 mr-1" /> Địa chỉ
                  </Label>
                  <Input
                    id="contact.businessAddress.street"
                    name="contact.businessAddress.street"
                    placeholder="Số nhà, tên đường"
                    value={shopData.contact?.businessAddress?.street || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact.businessAddress.ward">Phường/Xã</Label>
                    <Input
                      id="contact.businessAddress.ward"
                      name="contact.businessAddress.ward"
                      placeholder="Phường/Xã"
                      value={shopData.contact?.businessAddress?.ward || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact.businessAddress.district">Quận/Huyện</Label>
                    <Input
                      id="contact.businessAddress.district"
                      name="contact.businessAddress.district"
                      placeholder="Quận/Huyện"
                      value={shopData.contact?.businessAddress?.district || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact.businessAddress.city">Tỉnh/Thành phố</Label>
                    <Input
                      id="contact.businessAddress.city"
                      name="contact.businessAddress.city"
                      placeholder="Tỉnh/Thành phố"
                      value={shopData.contact?.businessAddress?.city || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-4">Hỗ trợ khách hàng</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerSupport.email">Email hỗ trợ</Label>
                    <Input
                      id="customerSupport.email"
                      name="customerSupport.email"
                      placeholder="Email hỗ trợ khách hàng"
                      value={shopData.customerSupport?.email || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerSupport.phone">Hotline hỗ trợ</Label>
                    <Input
                      id="customerSupport.phone"
                      name="customerSupport.phone"
                      placeholder="Số điện thoại hỗ trợ"
                      value={shopData.customerSupport?.phone || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerSupport.operatingHours">Giờ làm việc</Label>
                  <Input
                    id="customerSupport.operatingHours"
                    name="customerSupport.operatingHours"
                    placeholder="Ví dụ: 8:00 - 18:00, Thứ 2 - Thứ 6"
                    value={shopData.customerSupport?.operatingHours || ""}
                    onChange={handleChange}
                  />
                </div>

                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-4">Mạng xã hội</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerSupport.socialMediaLinks.facebook">
                      <Facebook className="inline h-4 w-4 mr-1" /> Facebook
                    </Label>
                    <Input
                      id="customerSupport.socialMediaLinks.facebook"
                      name="customerSupport.socialMediaLinks.facebook"
                      placeholder="Link Facebook"
                      value={shopData.customerSupport?.socialMediaLinks?.facebook || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerSupport.socialMediaLinks.instagram">
                      <Instagram className="inline h-4 w-4 mr-1" /> Instagram
                    </Label>
                    <Input
                      id="customerSupport.socialMediaLinks.instagram"
                      name="customerSupport.socialMediaLinks.instagram"
                      placeholder="Link Instagram"
                      value={shopData.customerSupport?.socialMediaLinks?.instagram || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerSupport.socialMediaLinks.youtube">
                      <Youtube className="inline h-4 w-4 mr-1" /> Youtube
                    </Label>
                    <Input
                      id="customerSupport.socialMediaLinks.youtube"
                      name="customerSupport.socialMediaLinks.youtube"
                      placeholder="Link Youtube"
                      value={shopData.customerSupport?.socialMediaLinks?.youtube || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerSupport.socialMediaLinks.tiktok">
                      <span className="inline-block w-4 h-4 mr-1">♪</span> TikTok
                    </Label>
                    <Input
                      id="customerSupport.socialMediaLinks.tiktok"
                      name="customerSupport.socialMediaLinks.tiktok"
                      placeholder="Link TikTok"
                      value={shopData.customerSupport?.socialMediaLinks?.tiktok || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving} className="flex items-center">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default StoreInfo
