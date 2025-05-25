"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"
import { createShop } from "../../services/shopService"
import { getCategoryTree } from "../../services/categoryService"

// UI Components
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from "../../components/ui/checkbox"
import { Progress } from "../../components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip"
import { ImageUpload } from "../../components/common/ImageUploadForRegister"

// Icons
import { ArrowLeft, ArrowRight, Check, Info, X, AlertCircle, Loader2 } from "lucide-react"

// Logo
import logo from "assets/Đi bộ (1).png"

// Thêm CSS cho animation
import "./RegisterShopPage.css"

const RegisterShopPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    avatar: "",
    logo: "",
    coverImage: "",

    // Contact Information
    contact: {
      phone: "",
      email: user?.email || "",
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

    // Customer Support
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

    // Business Information
    businessInfo: {
      businessLicense: "",
      taxIdentificationNumber: "",
      businessRegistrationNumber: "",
      businessAddress: {
        street: "",
        ward: "",
        district: "",
        city: "",
        province: "",
        postalCode: "",
      },
    },

    // Operations
    operations: {
      warehouseAddress: {
        street: "",
        ward: "",
        district: "",
        city: "",
        province: "",
      },
      shippingProviders: ["Giao Hàng Nhanh"],
      paymentMethods: [
        { name: "COD", isActive: true },
        { name: "Banking", isActive: true },
      ],
      policies: {
        return: "",
        shipping: "",
        warranty: "",
      },
    },

    // Product Info
    productInfo: {
      mainCategory: "",
      subCategories: [],
      brands: [],
      productRestrictions: [],
    },

    // SEO
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
    },

    // Tags
    tags: [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [categories, setCategories] = useState([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Update progress bar when step changes
  useEffect(() => {
    const totalSteps = 7
    setProgress((currentStep / totalSteps) * 100)
  }, [currentStep])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const response = await getCategoryTree()
        if (response.success) {
          // Flatten category tree for easier selection
          const flattenCategories = flattenCategoryTree(response.data.tree)
          setCategories(flattenCategories)
        } else {
          toast.error("Không thể tải danh mục sản phẩm")
        }
      } catch (error) {
        console.error("Error fetching categories:", error.message)
        toast.error("Lỗi khi tải danh mục sản phẩm")
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Helper function to flatten category tree
  const flattenCategoryTree = (categoryTree, level = 0, prefix = "") => {
    let result = []

    categoryTree.forEach((category) => {
      const displayName = prefix + category.name
      result.push({
        id: category._id,
        name: displayName,
        level: category.level,
        originalName: category.name,
      })

      if (category.children && category.children.length > 0) {
        const childPrefix = prefix + "  "
        const childrenCategories = flattenCategoryTree(category.children, level + 1, childPrefix)
        result = [...result, ...childrenCategories]
      }
    })

    return result
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target

    // Handle nested objects
    if (name.includes(".")) {
      const parts = name.split(".")
      setFormData((prevData) => {
        const newData = { ...prevData }
        let current = newData

        // Navigate to the right level of nesting
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {}
          current = current[parts[i]]
        }

        // Set the value
        current[parts[parts.length - 1]] = value
        return newData
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Handle select changes
  const handleSelectChange = (value, fieldName) => {
    // Handle nested fields
    if (fieldName.includes(".")) {
      const parts = fieldName.split(".")
      setFormData((prevData) => {
        const newData = { ...prevData }
        let current = newData

        // Navigate to the right level of nesting
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) current[parts[i]] = {}
          current = current[parts[i]]
        }

        // Set the value
        current[parts[parts.length - 1]] = value
        return newData
      })
    } else {
      setFormData({ ...formData, [fieldName]: value })
    }
  }

  // Handle image change
  const handleImageChange = (value, type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  // Handle tags and keywords
  const handleTagsChange = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault()
      const value = e.target.value.trim()
      if (e.target.name === "tags") {
        if (!formData.tags.includes(value)) {
          setFormData({
            ...formData,
            tags: [...formData.tags, value],
          })
        }
      } else if (e.target.name === "keywords") {
        if (!formData.seo.keywords.includes(value)) {
          setFormData({
            ...formData,
            seo: {
              ...formData.seo,
              keywords: [...formData.seo.keywords, value],
            },
          })
        }
      } else if (e.target.name === "brands") {
        if (!formData.productInfo.brands.includes(value)) {
          setFormData({
            ...formData,
            productInfo: {
              ...formData.productInfo,
              brands: [...formData.productInfo.brands, value],
            },
          })
        }
      }
      e.target.value = ""
    }
  }

  // Remove tag
  const removeTag = (index, type) => {
    if (type === "tags") {
      const updatedTags = [...formData.tags]
      updatedTags.splice(index, 1)
      setFormData({ ...formData, tags: updatedTags })
    } else if (type === "keywords") {
      const updatedKeywords = [...formData.seo.keywords]
      updatedKeywords.splice(index, 1)
      setFormData({
        ...formData,
        seo: { ...formData.seo, keywords: updatedKeywords },
      })
    } else if (type === "brands") {
      const updatedBrands = [...formData.productInfo.brands]
      updatedBrands.splice(index, 1)
      setFormData({
        ...formData,
        productInfo: { ...formData.productInfo, brands: updatedBrands },
      })
    }
  }

  // Validate fields for current step
  const validateStep = () => {
    const newErrors = {}

    switch (currentStep) {
      case 1: // Basic Shop Information
        if (!formData.name) newErrors.name = "Tên cửa hàng là bắt buộc"
        if (!formData.description) newErrors.description = "Mô tả cửa hàng là bắt buộc"
        break

      case 2: // Contact Information
        if (!formData.contact.phone) newErrors["contact.phone"] = "Số điện thoại là bắt buộc"
        if (!formData.contact.email) newErrors["contact.email"] = "Email là bắt buộc"
        if (!formData.contact.businessAddress.province)
          newErrors["contact.businessAddress.province"] = "Tỉnh/Thành phố là bắt buộc"
        break

      case 3: // Business Information
        if (!formData.businessInfo.taxIdentificationNumber)
          newErrors["businessInfo.taxIdentificationNumber"] = "Mã số thuế là bắt buộc"
        break

      case 4: // Customer Support
        // Optional fields, no validation needed
        break

      case 5: // Operations
        // At least one shipping provider is required
        if (formData.operations.shippingProviders.length === 0)
          newErrors["operations.shippingProviders"] = "Cần ít nhất một đơn vị vận chuyển"
        break

      case 6: // Product Information
        if (!formData.productInfo.mainCategory) newErrors["productInfo.mainCategory"] = "Danh mục chính là bắt buộc"
        break

      case 7: // SEO and Tags
        // Optional fields, no validation needed
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Go to next step
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 7))
    } else {
      const firstError = Object.keys(errors)[0]
      const errorMessage = errors[firstError]
      toast.error(errorMessage)
    }
  }

  // Go to previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) {
      const firstError = Object.keys(errors)[0]
      const errorMessage = errors[firstError]
      toast.error(errorMessage)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await createShop(formData)
      toast.success("Hoàn thành đăng kí shop! Tiếp theo hãy đăng kí thông tin người bán.")
      navigate("/auth/registerSeller")
    } catch (error) {
      toast.error(error.message || "Đăng ký shop thất bại, vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-pink-600 animate-fade-in">Thông tin cơ bản</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  Tên cửa hàng <span className="text-red-500 ml-1">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tên cửa hàng sẽ hiển thị với khách hàng</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nhập tên cửa hàng"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center">
                  Mô tả cửa hàng <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Giới thiệu về cửa hàng của bạn"
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="block">Hình đại diện</Label>
                  <ImageUpload
                    value={formData.avatar}
                    onChange={(value) => handleImageChange(value, "avatar")}
                    label="Tải lên hình đại diện"
                    aspectRatio="square"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="block">Logo cửa hàng</Label>
                  <ImageUpload
                    value={formData.logo}
                    onChange={(value) => handleImageChange(value, "logo")}
                    label="Tải lên logo cửa hàng"
                    aspectRatio="square"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="block">Ảnh bìa</Label>
                  <ImageUpload
                    value={formData.coverImage}
                    onChange={(value) => handleImageChange(value, "coverImage")}
                    label="Tải lên ảnh bìa"
                    aspectRatio="landscape"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-pink-600 animate-fade-in">Thông tin liên hệ</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center">
                    Số điện thoại <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="contactPhone"
                    name="contact.phone"
                    value={formData.contact.phone}
                    onChange={handleChange}
                    placeholder="Số điện thoại liên hệ"
                    className={errors["contact.phone"] ? "border-red-500" : ""}
                  />
                  {errors["contact.phone"] && <p className="text-red-500 text-sm">{errors["contact.phone"]}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center">
                    Email <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="contactEmail"
                    name="contact.email"
                    value={formData.contact.email}
                    onChange={handleChange}
                    placeholder="Email liên hệ"
                    className={errors["contact.email"] ? "border-red-500" : ""}
                  />
                  {errors["contact.email"] && <p className="text-red-500 text-sm">{errors["contact.email"]}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Địa chỉ kinh doanh</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Địa chỉ chi tiết</Label>
                    <Input
                      id="street"
                      name="contact.businessAddress.street"
                      value={formData.contact.businessAddress.street}
                      onChange={handleChange}
                      placeholder="Số nhà, tên đường"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ward">Phường/Xã</Label>
                    <Input
                      id="ward"
                      name="contact.businessAddress.ward"
                      value={formData.contact.businessAddress.ward}
                      onChange={handleChange}
                      placeholder="Phường/Xã"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">Quận/Huyện</Label>
                    <Input
                      id="district"
                      name="contact.businessAddress.district"
                      value={formData.contact.businessAddress.district}
                      onChange={handleChange}
                      placeholder="Quận/Huyện"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Thành phố</Label>
                    <Input
                      id="city"
                      name="contact.businessAddress.city"
                      value={formData.contact.businessAddress.city}
                      onChange={handleChange}
                      placeholder="Thành phố"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province" className="flex items-center">
                      Tỉnh/Thành phố <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="province"
                      name="contact.businessAddress.province"
                      value={formData.contact.businessAddress.province}
                      onChange={handleChange}
                      placeholder="Tỉnh/Thành phố"
                      className={errors["contact.businessAddress.province"] ? "border-red-500" : ""}
                    />
                    {errors["contact.businessAddress.province"] && (
                      <p className="text-red-500 text-sm">{errors["contact.businessAddress.province"]}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Mã bưu điện</Label>
                    <Input
                      id="postalCode"
                      name="contact.businessAddress.postalCode"
                      value={formData.contact.businessAddress.postalCode}
                      onChange={handleChange}
                      placeholder="Mã bưu điện"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-pink-600 animate-fade-in">Thông tin doanh nghiệp</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessLicense" className="flex items-center">
                    Giấy phép kinh doanh
                  </Label>
                  <Input
                    id="businessLicense"
                    name="businessInfo.businessLicense"
                    value={formData.businessInfo.businessLicense}
                    onChange={handleChange}
                    placeholder="Số giấy phép kinh doanh"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId" className="flex items-center">
                    Mã số thuế <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="taxId"
                    name="businessInfo.taxIdentificationNumber"
                    value={formData.businessInfo.taxIdentificationNumber}
                    onChange={handleChange}
                    placeholder="Mã số thuế"
                    className={errors["businessInfo.taxIdentificationNumber"] ? "border-red-500" : ""}
                  />
                  {errors["businessInfo.taxIdentificationNumber"] && (
                    <p className="text-red-500 text-sm">{errors["businessInfo.taxIdentificationNumber"]}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessRegNumber">Số đăng ký kinh doanh</Label>
                <Input
                  id="businessRegNumber"
                  name="businessInfo.businessRegistrationNumber"
                  value={formData.businessInfo.businessRegistrationNumber}
                  onChange={handleChange}
                  placeholder="Số đăng ký kinh doanh (nếu khác mã số thuế)"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-pink-600 animate-fade-in">
              Thông tin hỗ trợ khách hàng
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                  <Input
                    id="supportEmail"
                    name="customerSupport.email"
                    value={formData.customerSupport.email}
                    onChange={handleChange}
                    placeholder="Email hỗ trợ khách hàng"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Số điện thoại hỗ trợ</Label>
                  <Input
                    id="supportPhone"
                    name="customerSupport.phone"
                    value={formData.customerSupport.phone}
                    onChange={handleChange}
                    placeholder="Số điện thoại hỗ trợ khách hàng"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatingHours">Giờ làm việc</Label>
                <Input
                  id="operatingHours"
                  name="customerSupport.operatingHours"
                  value={formData.customerSupport.operatingHours}
                  onChange={handleChange}
                  placeholder="Ví dụ: 8:00 - 18:00, Thứ 2 - Thứ 6"
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Liên kết mạng xã hội</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      name="customerSupport.socialMediaLinks.facebook"
                      value={formData.customerSupport.socialMediaLinks.facebook}
                      onChange={handleChange}
                      placeholder="Link Facebook"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      name="customerSupport.socialMediaLinks.instagram"
                      value={formData.customerSupport.socialMediaLinks.instagram}
                      onChange={handleChange}
                      placeholder="Link Instagram"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube">Youtube</Label>
                    <Input
                      id="youtube"
                      name="customerSupport.socialMediaLinks.youtube"
                      value={formData.customerSupport.socialMediaLinks.youtube}
                      onChange={handleChange}
                      placeholder="Link Youtube"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      name="customerSupport.socialMediaLinks.tiktok"
                      value={formData.customerSupport.socialMediaLinks.tiktok}
                      onChange={handleChange}
                      placeholder="Link TikTok"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-pink-600 animate-fade-in">Thông tin vận hành</h2>

            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-medium">Địa chỉ kho hàng</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warehouseStreet">Địa chỉ chi tiết</Label>
                    <Input
                      id="warehouseStreet"
                      name="operations.warehouseAddress.street"
                      value={formData.operations.warehouseAddress.street}
                      onChange={handleChange}
                      placeholder="Số nhà, tên đường"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warehouseWard">Phường/Xã</Label>
                    <Input
                      id="warehouseWard"
                      name="operations.warehouseAddress.ward"
                      value={formData.operations.warehouseAddress.ward}
                      onChange={handleChange}
                      placeholder="Phường/Xã"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warehouseDistrict">Quận/Huyện</Label>
                    <Input
                      id="warehouseDistrict"
                      name="operations.warehouseAddress.district"
                      value={formData.operations.warehouseAddress.district}
                      onChange={handleChange}
                      placeholder="Quận/Huyện"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warehouseCity">Thành phố</Label>
                    <Input
                      id="warehouseCity"
                      name="operations.warehouseAddress.city"
                      value={formData.operations.warehouseAddress.city}
                      onChange={handleChange}
                      placeholder="Thành phố"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="warehouseProvince">Tỉnh/Thành phố</Label>
                    <Input
                      id="warehouseProvince"
                      name="operations.warehouseAddress.province"
                      value={formData.operations.warehouseAddress.province}
                      onChange={handleChange}
                      placeholder="Tỉnh/Thành phố"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium flex items-center">
                  Đơn vị vận chuyển
                  <span className="text-red-500 ml-1">*</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ghn"
                      checked={formData.operations.shippingProviders.includes("Giao Hàng Nhanh")}
                      onCheckedChange={(checked) => {
                        const providers = [...formData.operations.shippingProviders]
                        if (checked) {
                          if (!providers.includes("Giao Hàng Nhanh")) {
                            providers.push("Giao Hàng Nhanh")
                          }
                        } else {
                          const index = providers.indexOf("Giao Hàng Nhanh")
                          if (index !== -1) {
                            providers.splice(index, 1)
                          }
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            shippingProviders: providers,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="ghn">Giao Hàng Nhanh</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ghtk"
                      checked={formData.operations.shippingProviders.includes("Giao Hàng Tiết Kiệm")}
                      onCheckedChange={(checked) => {
                        const providers = [...formData.operations.shippingProviders]
                        if (checked) {
                          if (!providers.includes("Giao Hàng Tiết Kiệm")) {
                            providers.push("Giao Hàng Tiết Kiệm")
                          }
                        } else {
                          const index = providers.indexOf("Giao Hàng Tiết Kiệm")
                          if (index !== -1) {
                            providers.splice(index, 1)
                          }
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            shippingProviders: providers,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="ghtk">Giao Hàng Tiết Kiệm</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vnpost"
                      checked={formData.operations.shippingProviders.includes("VN Post")}
                      onCheckedChange={(checked) => {
                        const providers = [...formData.operations.shippingProviders]
                        if (checked) {
                          if (!providers.includes("VN Post")) {
                            providers.push("VN Post")
                          }
                        } else {
                          const index = providers.indexOf("VN Post")
                          if (index !== -1) {
                            providers.splice(index, 1)
                          }
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            shippingProviders: providers,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="vnpost">VN Post</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="jt"
                      checked={formData.operations.shippingProviders.includes("J&T Express")}
                      onCheckedChange={(checked) => {
                        const providers = [...formData.operations.shippingProviders]
                        if (checked) {
                          if (!providers.includes("J&T Express")) {
                            providers.push("J&T Express")
                          }
                        } else {
                          const index = providers.indexOf("J&T Express")
                          if (index !== -1) {
                            providers.splice(index, 1)
                          }
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            shippingProviders: providers,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="jt">J&T Express</Label>
                  </div>
                </div>
                {errors["operations.shippingProviders"] && (
                  <p className="text-red-500 text-sm">{errors["operations.shippingProviders"]}</p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Phương thức thanh toán</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cod"
                      checked={formData.operations.paymentMethods.find((m) => m.name === "COD")?.isActive || false}
                      onCheckedChange={(checked) => {
                        const methods = [...formData.operations.paymentMethods]
                        const index = methods.findIndex((m) => m.name === "COD")
                        if (index !== -1) {
                          methods[index].isActive = !!checked
                        } else {
                          methods.push({ name: "COD", isActive: !!checked })
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            paymentMethods: methods,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="cod">Thanh toán khi nhận hàng (COD)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="banking"
                      checked={formData.operations.paymentMethods.find((m) => m.name === "Banking")?.isActive || false}
                      onCheckedChange={(checked) => {
                        const methods = [...formData.operations.paymentMethods]
                        const index = methods.findIndex((m) => m.name === "Banking")
                        if (index !== -1) {
                          methods[index].isActive = !!checked
                        } else {
                          methods.push({ name: "Banking", isActive: !!checked })
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            paymentMethods: methods,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="banking">Chuyển khoản ngân hàng</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="momo"
                      checked={formData.operations.paymentMethods.find((m) => m.name === "Momo")?.isActive || false}
                      onCheckedChange={(checked) => {
                        const methods = [...formData.operations.paymentMethods]
                        const index = methods.findIndex((m) => m.name === "Momo")
                        if (index !== -1) {
                          methods[index].isActive = !!checked
                        } else {
                          methods.push({ name: "Momo", isActive: !!checked })
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            paymentMethods: methods,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="momo">Ví Momo</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="zalopay"
                      checked={formData.operations.paymentMethods.find((m) => m.name === "ZaloPay")?.isActive || false}
                      onCheckedChange={(checked) => {
                        const methods = [...formData.operations.paymentMethods]
                        const index = methods.findIndex((m) => m.name === "ZaloPay")
                        if (index !== -1) {
                          methods[index].isActive = !!checked
                        } else {
                          methods.push({ name: "ZaloPay", isActive: !!checked })
                        }
                        setFormData({
                          ...formData,
                          operations: {
                            ...formData.operations,
                            paymentMethods: methods,
                          },
                        })
                      }}
                    />
                    <Label htmlFor="zalopay">ZaloPay</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Chính sách cửa hàng</h3>

                <div className="space-y-2">
                  <Label htmlFor="returnPolicy">Chính sách đổi trả</Label>
                  <Textarea
                    id="returnPolicy"
                    name="operations.policies.return"
                    value={formData.operations.policies.return}
                    onChange={handleChange}
                    placeholder="Mô tả chính sách đổi trả của cửa hàng"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shippingPolicy">Chính sách vận chuyển</Label>
                  <Textarea
                    id="shippingPolicy"
                    name="operations.policies.shipping"
                    value={formData.operations.policies.shipping}
                    onChange={handleChange}
                    placeholder="Mô tả chính sách vận chuyển của cửa hàng"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warrantyPolicy">Chính sách bảo hành</Label>
                  <Textarea
                    id="warrantyPolicy"
                    name="operations.policies.warranty"
                    value={formData.operations.policies.warranty}
                    onChange={handleChange}
                    placeholder="Mô tả chính sách bảo hành của cửa hàng"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-pink-600 animate-fade-in">Thông tin sản phẩm</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainCategory" className="flex items-center">
                  Danh mục chính <span className="text-red-500 ml-1">*</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Danh mục chính của cửa hàng</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select
                  value={formData.productInfo.mainCategory}
                  onValueChange={(value) => handleSelectChange(value, "productInfo.mainCategory")}
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger className={errors["productInfo.mainCategory"] ? "border-red-500" : ""}>
                    <SelectValue placeholder={isLoadingCategories ? "Đang tải danh mục..." : "Chọn danh mục chính"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["productInfo.mainCategory"] && (
                  <p className="text-red-500 text-sm">{errors["productInfo.mainCategory"]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subCategories">Danh mục phụ</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {isLoadingCategories ? (
                    <div className="col-span-2 text-center py-4 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Đang tải danh mục...
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subcat-${category.id}`}
                          checked={formData.productInfo.subCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            const subCats = [...formData.productInfo.subCategories]
                            if (checked) {
                              if (!subCats.includes(category.id)) {
                                subCats.push(category.id)
                              }
                            } else {
                              const index = subCats.indexOf(category.id)
                              if (index !== -1) {
                                subCats.splice(index, 1)
                              }
                            }
                            setFormData({
                              ...formData,
                              productInfo: {
                                ...formData.productInfo,
                                subCategories: subCats,
                              },
                            })
                          }}
                          disabled={formData.productInfo.mainCategory === category.id}
                        />
                        <Label
                          htmlFor={`subcat-${category.id}`}
                          className={formData.productInfo.mainCategory === category.id ? "text-gray-400" : ""}
                        >
                          {category.name}
                          {formData.productInfo.mainCategory === category.id && " (Danh mục chính)"}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brands">Thương hiệu</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.productInfo.brands.map((brand, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-pink-100 text-pink-800 rounded-full px-3 py-1 text-sm"
                    >
                      {brand}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 hover:bg-pink-200"
                        onClick={() => removeTag(index, "brands")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="brands"
                    name="brands"
                    placeholder="Nhập thương hiệu và nhấn Enter"
                    onKeyDown={handleTagsChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Nhập tên thương hiệu và nhấn Enter để thêm</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productRestrictions">Hạn chế sản phẩm</Label>
                <Textarea
                  id="productRestrictions"
                  name="productInfo.productRestrictions"
                  value={formData.productInfo.productRestrictions.join("\n")}
                  onChange={(e) => {
                    const restrictions = e.target.value.split("\n").filter((item) => item.trim() !== "")
                    setFormData({
                      ...formData,
                      productInfo: {
                        ...formData.productInfo,
                        productRestrictions: restrictions,
                      },
                    })
                  }}
                  placeholder="Mỗi dòng là một hạn chế sản phẩm"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">Mỗi dòng là một hạn chế sản phẩm</p>
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center text-pink-600 animate-fade-in">SEO và Từ khóa</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Tiêu đề SEO</Label>
                <Input
                  id="metaTitle"
                  name="seo.metaTitle"
                  value={formData.seo.metaTitle}
                  onChange={handleChange}
                  placeholder="Tiêu đề SEO cho cửa hàng"
                />
                <p className="text-sm text-muted-foreground">Tiêu đề hiển thị trên kết quả tìm kiếm</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Mô tả SEO</Label>
                <Textarea
                  id="metaDescription"
                  name="seo.metaDescription"
                  value={formData.seo.metaDescription}
                  onChange={handleChange}
                  placeholder="Mô tả ngắn gọn về cửa hàng của bạn"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">Mô tả hiển thị trên kết quả tìm kiếm</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Từ khóa SEO</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.seo.keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-pink-100 text-pink-800 rounded-full px-3 py-1 text-sm"
                    >
                      {keyword}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 hover:bg-pink-200"
                        onClick={() => removeTag(index, "keywords")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="keywords"
                    name="keywords"
                    placeholder="Nhập từ khóa và nhấn Enter"
                    onKeyDown={handleTagsChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Nhập từ khóa và nhấn Enter để thêm</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Thẻ cửa hàng</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-pink-100 text-pink-800 rounded-full px-3 py-1 text-sm"
                    >
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 hover:bg-pink-200"
                        onClick={() => removeTag(index, "tags")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Input id="tags" name="tags" placeholder="Nhập thẻ và nhấn Enter" onKeyDown={handleTagsChange} />
                </div>
                <p className="text-sm text-muted-foreground">Nhập thẻ và nhấn Enter để thêm</p>
              </div>

              <div className="space-y-2 pt-4">
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-pink-600 mt-0.5 mr-2" />
                    <div>
                      <h4 className="font-medium text-pink-800">Xác nhận thông tin</h4>
                      <p className="text-sm text-pink-700 mt-1">
                        Vui lòng kiểm tra lại tất cả thông tin trước khi gửi. Sau khi gửi, yêu cầu đăng ký shop của bạn
                        sẽ được xem xét và phê duyệt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  // Render the main component
  return (
  <div className="relative w-full max-w-full min-h-[calc(100vh-104px)] flex items-center justify-center bg-gradient-to-br from-pink-400 via-white to-pink-100 overflow-hidden">
    {/* Overlay để làm nổi bật nội dung */}
    <div className="absolute inset-0 bg-black/10 z-0" />

    {/* Nội dung chính */}
    <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-between gap-8 py-8">
      {/* Header */}
      <div className="w-full text-center">
        <Button
          variant="ghost"
          className="absolute left-4 top-4 flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} />
          Quay lại
        </Button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Đăng Ký Cửa Hàng</h1>
        <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
          Hãy cùng tạo nên cửa hàng của riêng bạn và bắt đầu hành trình kinh doanh trên HULO
        </p>
      </div>

      {/* Main Content */}
      <Card className="w-full max-w-4xl bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl">Thông Tin Cửa Hàng</CardTitle>
          <CardDescription className="text-center">
            Vui lòng điền đầy đủ thông tin để chúng tôi có thể hỗ trợ bạn tốt nhất
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Progress bar với style thân thiện hơn */}
          <div className="mb-8">
            <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-3">
              <span className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs">
                  {currentStep}
                </div>
                Bước {currentStep} trên 7
              </span>
              <span className="text-pink-600 font-semibold">{Math.round(progress)}% hoàn thành</span>
            </div>
            <Progress value={progress} className="h-3 bg-pink-50" />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Bạn đang làm rất tốt! Chỉ còn {7 - currentStep} bước nữa thôi 🎉
            </p>
          </div>

          {/* Form content */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            {renderStep()}
          </div>

          {/* Navigation buttons với style mới */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 border-gray-300 hover:border-pink-300 hover:text-pink-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>

            <div className="flex items-center gap-3">
              {currentStep < 7 ? (
                <Button 
                  onClick={handleNext} 
                  className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 px-6 py-2 shadow-md hover:shadow-lg transition-all"
                >
                  Tiếp tục
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 px-8 py-2 shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Hoàn tất đăng ký
                      <Check className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Thông tin hỗ trợ */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Cần hỗ trợ trong quá trình đăng ký?
                </h4>
                <p className="text-sm text-blue-600 mb-2">
                  Đội ngũ hỗ trợ HULO luôn sẵn sàng giúp đỡ bạn 24/7
                </p>
                <div className="flex gap-4 text-xs">
                  <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                    📞 Hotline: 1900-xxxx
                  </a>
                  <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                    💬 Chat trực tuyến
                  </a>
                  <a href="#" className="text-blue-600 hover:text-blue-800 underline">
                    📧 Email hỗ trợ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center pt-0 pb-6">
          <p className="text-xs text-gray-500 text-center max-w-lg">
            Bằng việc hoàn tất đăng ký, bạn đồng ý với 
            <a href="#" className="text-pink-600 hover:underline mx-1">Điều khoản dịch vụ</a>
            và 
            <a href="#" className="text-pink-600 hover:underline mx-1">Chính sách quyền riêng tư</a>
            của HULO. Chúng tôi cam kết bảo vệ thông tin của bạn.
          </p>
        </CardFooter>
      </Card>

      {/* Bottom logo với message thân thiện */}
      <div className="w-full max-w-md mx-auto text-center">
        <img
          src={logo}
          alt="HULO Community"
          className="rounded-lg shadow-lg w-full max-h-40 object-contain mb-4"
        />
        <p className="text-sm text-gray-600 font-medium">
          🚀 Cùng HULO kiến tạo thương hiệu của bạn
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Hơn 10,000+ cửa hàng đã tin tưởng và phát triển cùng chúng tôi
        </p>
      </div>
    </div>

    {/* Animation cho background */}
    <div className="absolute inset-0 z-0">
      <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)] animate-pulse-slow" />
    </div>
  </div>
)
}

export default RegisterShopPage
