import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "../../../components/ui/button";
import { Loader2, Save, Store, Building2, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { getMyShop, updateShop } from "../../../services/shopService";

const BusinessInfo = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [shopData, setShopData] = useState({
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
        }
    });

    // Lấy thông tin shop khi component mount
    useEffect(() => {
        const fetchShopData = async () => {
            try {
                setLoading(true);
                const response = await getMyShop();
                if (response.success) {
                    // Lấy chỉ các trường cần thiết cho BusinessInfo
                    const { businessInfo, operations } = response.data;
                    setShopData({ businessInfo, operations });
                }
            } catch (err) {
                setError("Không thể tải thông tin doanh nghiệp. Vui lòng thử lại sau.");
                setError(err.response.data.message);
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

    // Xử lý lưu thông tin
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");

            // Lấy thông tin shop hiện tại trước khi cập nhật
            const currentShopData = await getMyShop();
            if (!currentShopData.success) {
                throw new Error("Không thể lấy thông tin cửa hàng hiện tại");
            }

            // Cập nhật chỉ phần businessInfo và operations
            const updatedShopData = {
                ...currentShopData.data,
                businessInfo: shopData.businessInfo,
                operations: shopData.operations
            };

            const response = await updateShop(updatedShopData);

            if (response.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(response.message || "Có lỗi xảy ra khi cập nhật thông tin doanh nghiệp");
            }
        } catch (err) {
            setError("Không thể cập nhật thông tin doanh nghiệp. Vui lòng thử lại sau.");
            console.error("Error updating shop:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-lg">Đang tải thông tin doanh nghiệp...</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Thiết lập cửa hàng</h1>
                <div className="space-x-2">
                    <Button variant="outline" className="bg-white" asChild>
                        <Link to="/seller/store/basic" className="flex items-center">
                            <Store className="mr-2 h-4 w-4" />
                            Thông tin cửa hàng
                        </Link>
                    </Button>
                    <Button variant="outline" className="bg-white font-medium" asChild>
                        <Link to="/seller/store/business" className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            Thông tin doanh nghiệp
                        </Link>
                    </Button>
                </div>
            </div> */}

            {success && (
                <Alert className="mb-4 bg-green-50 border-green-500">
                    <AlertTitle>Thành công!</AlertTitle>
                    <AlertDescription>
                        Thông tin doanh nghiệp đã được cập nhật thành công.
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="businessInfo.businessAddress.province">Tỉnh/Thành phố</Label>
                                    <Input
                                        id="businessInfo.businessAddress.province"
                                        name="businessInfo.businessAddress.province"
                                        placeholder="Tỉnh/Thành phố"
                                        value={shopData.businessInfo?.businessAddress?.province || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="businessInfo.businessAddress.postalCode">Mã bưu chính</Label>
                                    <Input
                                        id="businessInfo.businessAddress.postalCode"
                                        name="businessInfo.businessAddress.postalCode"
                                        placeholder="Mã bưu chính"
                                        value={shopData.businessInfo?.businessAddress?.postalCode || ""}
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
                            
                            <div className="space-y-2">
                                <Label htmlFor="operations.warehouseAddress.province">Tỉnh/Thành phố</Label>
                                <Input
                                    id="operations.warehouseAddress.province"
                                    name="operations.warehouseAddress.province"
                                    placeholder="Tỉnh/Thành phố"
                                    value={shopData.operations?.warehouseAddress?.province || ""}
                                    onChange={handleChange}
                                />
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

export default BusinessInfo;