import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Loader2, Save, Upload, CreditCard, Landmark } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../../../components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Checkbox } from "../../../components/ui/checkbox";
import { getMySellerInfo, updateSeller } from "../../../services/sellerService";
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary"; // Adjust path as needed

const SellerInfo = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [sellerData, setSellerData] = useState({
        legalName: "",
        idCardNumber: "",
        idCardFrontImage: "",
        idCardBackImage: "",
        bankName: "",
        bankAccountNumber: "",
        accountHolderName: "",
        paymentMethods: [],
        kycLevel: 0,
        kycDetails: {}
    });

    // File input refs for triggering file selection
    const frontImageRef = useRef(null);
    const backImageRef = useRef(null);

    // Danh sách ngân hàng Việt Nam
    const bankList = [
        { value: "VietcomBank", label: "Ngân hàng TMCP Ngoại thương Việt Nam (VietcomBank)" },
        { value: "Vietinbank", label: "Ngân hàng TMCP Công thương Việt Nam (VietinBank)" },
        { value: "BIDV", label: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)" },
        { value: "Agribank", label: "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)" },
        { value: "Techcombank", label: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)" },
        { value: "ACB", label: "Ngân hàng TMCP Á Châu (ACB)" },
        { value: "MBBank", label: "Ngân hàng TMCP Quân đội (MB Bank)" },
        { value: "TPBank", label: "Ngân hàng TMCP Tiên Phong (TPBank)" },
        { value: "VPBank", label: "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)" }
    ];

    // Danh sách các phương thức thanh toán
    const paymentOptions = [
        { id: "banking", label: "Chuyển khoản ngân hàng" },
        { id: "cash", label: "Tiền mặt" },
        { id: "momo", label: "Ví điện tử MoMo" },
        { id: "zalopay", label: "ZaloPay" },
        { id: "vnpay", label: "VNPAY" }
    ];

    // Lấy thông tin người bán khi component mount
    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                setLoading(true);
                const response = await getMySellerInfo();
                if (response.success) {
                    setSellerData(response.data);
                } else {
                    setError(response.message || "Không thể tải thông tin người bán.");
                }
            } catch (err) {
                setError(err.message || "Không thể tải thông tin người bán. Vui lòng thử lại sau.");
                console.error("Error fetching seller data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSellerData();
    }, []);

    // Xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSellerData(prev => ({ ...prev, [name]: value }));
    };

    // Xử lý thay đổi ngân hàng
    const handleBankChange = (value) => {
        setSellerData(prev => ({ ...prev, bankName: value }));
    };

    // Xử lý thay đổi phương thức thanh toán
    const handlePaymentMethodChange = (methodId, checked) => {
        setSellerData(prev => {
            if (checked) {
                return { ...prev, paymentMethods: [...prev.paymentMethods, methodId] };
            } else {
                return { ...prev, paymentMethods: prev.paymentMethods.filter(id => id !== methodId) };
            }
        });
    };

    // Xử lý tải ảnh
    const handleImageUpload = async (type, event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setSaving(true);
            const secureUrl = await uploadToCloudinary(file);
            setSellerData(prev => ({ ...prev, [type]: secureUrl }));
        } catch (err) {
            setError("Không thể tải ảnh lên. Vui lòng thử lại.");
            console.error("Error uploading image:", err);
        } finally {
            setSaving(false);
        }
    };

    // Xử lý lưu thông tin
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError("");
            const response = await updateSeller(sellerData._id, sellerData);

            if (response.success) {
                setSuccess(true);
                setSellerData(response.data); // Update local state with new data from server
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(response.message || "Có lỗi xảy ra khi cập nhật thông tin người bán");
            }
        } catch (err) {
            setError(err.message || "Không thể cập nhật thông tin người bán. Vui lòng thử lại sau.");
            console.error("Error updating seller:", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-lg">Đang tải thông tin người bán...</span>
            </div>
        );
    }

    // Tính trạng thái KYC
    const getKycStatus = () => {
        switch (sellerData.kycLevel) {
            case 0:
                return "Chưa xác thực";
            case 1:
                return "Đã xác thực cơ bản";
            case 2:
                return "Đã xác thực nâng cao";
            default:
                return "Chưa xác thực";
        }
    };

    return (
        <div className="container mx-auto">
            {success && (
                <Alert className="mb-4 bg-green-50 border-green-500">
                    <AlertTitle>Thành công!</AlertTitle>
                    <AlertDescription>
                        Thông tin người bán đã được cập nhật thành công.
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
                    {/* Thông tin cá nhân */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin cá nhân</CardTitle>
                            <CardDescription>
                                Cung cấp thông tin cá nhân để xác thực danh tính người bán
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="legalName">Họ và tên <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="legalName"
                                        name="legalName"
                                        placeholder="Họ và tên đầy đủ theo giấy tờ"
                                        value={sellerData.legalName}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="idCardNumber">Số CMND/CCCD <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="idCardNumber"
                                        name="idCardNumber"
                                        placeholder="Nhập số CMND hoặc CCCD"
                                        value={sellerData.idCardNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="idCardFrontImage">Ảnh mặt trước CMND/CCCD <span className="text-red-500">*</span></Label>
                                    <div className="flex items-center space-x-4">
                                        {sellerData.idCardFrontImage && (
                                            <div className="w-32 h-20 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={sellerData.idCardFrontImage}
                                                    alt="Mặt trước CMND/CCCD"
                                                    className="object-cover w-full h-full"
                                                    onError={(e) => { e.target.src = "/api/placeholder/120/80"; }}
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <input
                                                type="file"
                                                ref={frontImageRef}
                                                onChange={(e) => handleImageUpload('idCardFrontImage', e)}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => frontImageRef.current.click()}
                                                className="flex items-center"
                                                disabled={saving}
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                {sellerData.idCardFrontImage ? "Thay đổi ảnh" : "Tải ảnh lên"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="idCardBackImage">Ảnh mặt sau CMND/CCCD <span className="text-red-500">*</span></Label>
                                    <div className="flex items-center space-x-4">
                                        {sellerData.idCardBackImage && (
                                            <div className="w-32 h-20 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={sellerData.idCardBackImage}
                                                    alt="Mặt sau CMND/CCCD"
                                                    className="object-cover w-full h-full"
                                                    onError={(e) => { e.target.src = "/api/placeholder/120/80"; }}
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <input
                                                type="file"
                                                ref={backImageRef}
                                                onChange={(e) => handleImageUpload('idCardBackImage', e)}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => backImageRef.current.click()}
                                                className="flex items-center"
                                                disabled={saving}
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                {sellerData.idCardBackImage ? "Thay đổi ảnh" : "Tải ảnh lên"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center">
                                    <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
                                    <span className="font-medium">Trạng thái xác thực (KYC):</span>
                                    <span className={`ml-2 px-2 py-1 text-sm rounded-full ${sellerData.kycLevel === 0 ? "bg-gray-200 text-gray-700" :
                                            sellerData.kycLevel === 1 ? "bg-blue-100 text-blue-700" :
                                                "bg-green-100 text-green-700"
                                        }`}>
                                        {getKycStatus()}
                                    </span>
                                </div>
                                {sellerData.kycLevel > 0 && sellerData.kycDetails?.verifiedAt && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Đã xác thực vào: {new Date(sellerData.kycDetails.verifiedAt).toLocaleDateString('vi-VN')}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Thông tin thanh toán */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin thanh toán</CardTitle>
                            <CardDescription>
                                Thiết lập thông tin ngân hàng để nhận thanh toán
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bankName">Ngân hàng <span className="text-red-500">*</span></Label>
                                <Select
                                    value={sellerData.bankName}
                                    onValueChange={handleBankChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Chọn ngân hàng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bankList.map((bank) => (
                                            <SelectItem key={bank.value} value={bank.value}>
                                                {bank.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccountNumber">Số tài khoản <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="bankAccountNumber"
                                        name="bankAccountNumber"
                                        placeholder="Nhập số tài khoản"
                                        value={sellerData.bankAccountNumber}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountHolderName">Tên chủ tài khoản <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="accountHolderName"
                                        name="accountHolderName"
                                        placeholder="Tên chủ tài khoản (viết IN HOA không dấu)"
                                        value={sellerData.accountHolderName}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        *Lưu ý: Tên phải trùng khớp với tên trên tài khoản ngân hàng của bạn
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Phương thức thanh toán chấp nhận</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {paymentOptions.map((option) => (
                                        <div key={option.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={option.id}
                                                checked={sellerData.paymentMethods.includes(option.id)}
                                                onCheckedChange={(checked) => handlePaymentMethodChange(option.id, checked)}
                                            />
                                            <Label htmlFor={option.id} className="cursor-pointer">
                                                {option.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-start">
                                    <Landmark className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Thông tin quan trọng về thanh toán:</p>
                                        <ul className="text-sm text-gray-600 mt-1 space-y-1 list-disc list-inside">
                                            <li>Hãy đảm bảo thông tin tài khoản ngân hàng chính xác</li>
                                            <li>Tên chủ tài khoản phải khớp với tên trong CMND/CCCD đã cung cấp</li>
                                            <li>Hệ thống sẽ gửi tiền thanh toán vào tài khoản này sau khi đơn hàng hoàn tất</li>
                                            <li>Việc thanh toán diễn ra vào các ngày 1, 15 hàng tháng</li>
                                        </ul>
                                    </div>
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

export default SellerInfo;