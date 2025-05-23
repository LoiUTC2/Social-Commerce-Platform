import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Switch } from "../../../components/ui/switch";
import { Loader2, Save, Store, User, Phone, Mail, MapPin, Facebook, Instagram, Youtube, History } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { getMyShop, updateShop } from "../../../services/shopService";

const StoreInfo = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
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
                country: "Vietnam"
            }
        },
        customerSupport: {
            email: "",
            phone: "",
            operatingHours: "",
            socialMediaLinks: {
                facebook: "",
                instagram: "",
                youtube: "",
                tiktok: ""
            }
        },
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
                postalCode: ""
            }
        },
        operations: {
            warehouseAddress: {
                street: "",
                ward: "",
                district: "",
                city: "",
                province: ""
            },
            shippingProviders: [],
            paymentMethods: [],
            policies: {
                return: "",
                shipping: "",
                warranty: ""
            }
        },
        status: {
            isActive: true,
        }
    });

    // Lấy thông tin shop khi component mount
    useEffect(() => {
        const fetchShopData = async () => {
            try {
                setLoading(true);
                const response = await getMyShop();
                if (response.success) {
                    setShopData(response.data);
                }
            } catch (err) {
                setError("Không thể tải thông tin cửa hàng. Vui lòng thử lại sau.");
                console.error("Error fetching shop data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, []);

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Xử lý các trường lồng nhau (nested fields)
        if (name.includes(".")) {
            const parts = name.split(".");
            setShopData(prev => {
                const newData = { ...prev };
                let current = newData;

                // Đi đến object lồng nhau cuối cùng
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }

                // Cập nhật giá trị
                current[parts[parts.length - 1]] = value;
                return newData;
            });
        } else {
            setShopData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Xử lý thay đổi trạng thái
    const handleStatusChange = (checked) => {
        setShopData(prev => ({
            ...prev,
            status: {
                ...prev.status,
                isActive: checked
            }
        }));
    };

    // Xử lý lưu thông tin
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");
            const response = await updateShop(shopData);

            if (response.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(response.message || "Có lỗi xảy ra khi cập nhật thông tin cửa hàng");
            }
        } catch (err) {
            setError("Không thể cập nhật thông tin cửa hàng. Vui lòng thử lại sau.");
            console.error("Error updating shop:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-lg">Đang tải thông tin cửa hàng...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Thiết lập cửa hàng</h1>

            {success && (
                <Alert className="mb-4 bg-green-50 border-green-500">
                    <AlertTitle>Thành công!</AlertTitle>
                    <AlertDescription>
                        Thông tin cửa hàng đã được cập nhật thành công.
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="mb-4 bg-red-50 border-red-500">
                    <AlertTitle>Lỗi!</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid grid-cols-2 mb-6">
                        <TabsTrigger value="basic" className="text-base">
                            <Store className="mr-2 h-4 w-4" />
                            Thông tin cửa hàng
                        </TabsTrigger>
                        <TabsTrigger value="advanced" className="text-base">
                            <User className="mr-2 h-4 w-4" />
                            Thông tin doanh nghiệp
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic">
                        <div className="grid gap-6">
                            {/* Thông tin cơ bản */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin cơ bản</CardTitle>
                                    <CardDescription>
                                        Thiết lập thông tin cơ bản cho cửa hàng của bạn
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Tên cửa hàng <span className="text-red-500">*</span></Label>
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
                                                <Switch
                                                    id="status"
                                                    checked={shopData.status?.isActive}
                                                    onCheckedChange={handleStatusChange}
                                                />
                                                <Label htmlFor="status">
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

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="avatar">Ảnh đại diện</Label>
                                            <Input
                                                id="avatar"
                                                name="avatar"
                                                placeholder="URL ảnh đại diện"
                                                value={shopData.avatar}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="logo">Logo</Label>
                                            <Input
                                                id="logo"
                                                name="logo"
                                                placeholder="URL logo cửa hàng"
                                                value={shopData.logo}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="coverImage">Ảnh bìa</Label>
                                            <Input
                                                id="coverImage"
                                                name="coverImage"
                                                placeholder="URL ảnh bìa"
                                                value={shopData.coverImage}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Thông tin liên hệ */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin liên hệ</CardTitle>
                                    <CardDescription>
                                        Cập nhật thông tin liên hệ của cửa hàng
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
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

                                    <div className="space-y-2">
                                        <Label htmlFor="contact.businessAddress.street">
                                            <MapPin className="inline h-4 w-4 mr-1" /> Địa chỉ cửa hàng
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
                                </CardContent>
                            </Card>

                            {/* Hỗ trợ khách hàng */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hỗ trợ khách hàng</CardTitle>
                                    <CardDescription>
                                        Thiết lập thông tin hỗ trợ khách hàng
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
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
                        </div>
                    </TabsContent>

                    <TabsContent value="advanced">
                        <div className="grid gap-6">
                            {/* Thông tin doanh nghiệp */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin doanh nghiệp</CardTitle>
                                    <CardDescription>
                                        Cập nhật thông tin pháp lý của doanh nghiệp
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessInfo.businessLicense">Giấy phép kinh doanh</Label>
                                            <Input
                                                id="businessInfo.businessLicense"
                                                name="businessInfo.businessLicense"
                                                placeholder="Số giấy phép kinh doanh"
                                                value={shopData.businessInfo?.businessLicense || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="businessInfo.taxIdentificationNumber">Mã số thuế</Label>
                                            <Input
                                                id="businessInfo.taxIdentificationNumber"
                                                name="businessInfo.taxIdentificationNumber"
                                                placeholder="Mã số thuế"
                                                value={shopData.businessInfo?.taxIdentificationNumber || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="businessInfo.businessRegistrationNumber">Số đăng ký kinh doanh</Label>
                                            <Input
                                                id="businessInfo.businessRegistrationNumber"
                                                name="businessInfo.businessRegistrationNumber"
                                                placeholder="Số đăng ký kinh doanh"
                                                value={shopData.businessInfo?.businessRegistrationNumber || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="businessInfo.businessAddress.street">Địa chỉ doanh nghiệp</Label>
                                        <Input
                                            id="businessInfo.businessAddress.street"
                                            name="businessInfo.businessAddress.street"
                                            placeholder="Số nhà, tên đường"
                                            value={shopData.businessInfo?.businessAddress?.street || ""}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="businessInfo.businessAddress.ward">Phường/Xã</Label>
                                            <Input
                                                id="businessInfo.businessAddress.ward"
                                                name="businessInfo.businessAddress.ward"
                                                placeholder="Phường/Xã"
                                                value={shopData.businessInfo?.businessAddress?.ward || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="businessInfo.businessAddress.district">Quận/Huyện</Label>
                                            <Input
                                                id="businessInfo.businessAddress.district"
                                                name="businessInfo.businessAddress.district"
                                                placeholder="Quận/Huyện"
                                                value={shopData.businessInfo?.businessAddress?.district || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="businessInfo.businessAddress.city">Tỉnh/Thành phố</Label>
                                            <Input
                                                id="businessInfo.businessAddress.city"
                                                name="businessInfo.businessAddress.city"
                                                placeholder="Tỉnh/Thành phố"
                                                value={shopData.businessInfo?.businessAddress?.city || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Thông tin vận hành */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin vận hành</CardTitle>
                                    <CardDescription>
                                        Thiết lập thông tin vận hành và chính sách cửa hàng
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="operations.warehouseAddress.street">Địa chỉ kho hàng</Label>
                                        <Input
                                            id="operations.warehouseAddress.street"
                                            name="operations.warehouseAddress.street"
                                            placeholder="Số nhà, tên đường"
                                            value={shopData.operations?.warehouseAddress?.street || ""}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="operations.warehouseAddress.ward">Phường/Xã</Label>
                                            <Input
                                                id="operations.warehouseAddress.ward"
                                                name="operations.warehouseAddress.ward"
                                                placeholder="Phường/Xã"
                                                value={shopData.operations?.warehouseAddress?.ward || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="operations.warehouseAddress.district">Quận/Huyện</Label>
                                            <Input
                                                id="operations.warehouseAddress.district"
                                                name="operations.warehouseAddress.district"
                                                placeholder="Quận/Huyện"
                                                value={shopData.operations?.warehouseAddress?.district || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="operations.warehouseAddress.city">Tỉnh/Thành phố</Label>
                                            <Input
                                                id="operations.warehouseAddress.city"
                                                name="operations.warehouseAddress.city"
                                                placeholder="Tỉnh/Thành phố"
                                                value={shopData.operations?.warehouseAddress?.city || ""}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="operations.policies.return">Chính sách đổi trả</Label>
                                            <Textarea
                                                id="operations.policies.return"
                                                name="operations.policies.return"
                                                placeholder="Chính sách đổi trả của cửa hàng"
                                                value={shopData.operations?.policies?.return || ""}
                                                onChange={handleChange}
                                                rows={4}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="operations.policies.shipping">Chính sách vận chuyển</Label>
                                            <Textarea
                                                id="operations.policies.shipping"
                                                name="operations.policies.shipping"
                                                placeholder="Chính sách vận chuyển của cửa hàng"
                                                value={shopData.operations?.policies?.shipping || ""}
                                                onChange={handleChange}
                                                rows={4}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="operations.policies.warranty">Chính sách bảo hành</Label>
                                            <Textarea
                                                id="operations.policies.warranty"
                                                name="operations.policies.warranty"
                                                placeholder="Chính sách bảo hành của cửa hàng"
                                                value={shopData.operations?.policies?.warranty || ""}
                                                onChange={handleChange}
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
    );
};

export default StoreInfo;