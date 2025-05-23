import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registerSeller } from '../../services/sellerService';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ImageUpload } from '../../components/common/ImageUploadForRegister';

import logo from 'assets/Đi bộ (1).png';

// Danh sách các ngân hàng phổ biến tại Việt Nam
const BANKS = [
    { code: 'VCB', name: 'Vietcombank' },
    { code: 'TCB', name: 'Techcombank' },
    { code: 'BIDV', name: 'BIDV' },
    { code: 'VTB', name: 'Vietinbank' },
    { code: 'ACB', name: 'ACB' },
    { code: 'MB', name: 'MB Bank' },
    { code: 'TPB', name: 'TPBank' },
    { code: 'SHB', name: 'SHB' },
    { code: 'VPB', name: 'VPBank' },
    { code: 'SCB', name: 'Sacombank' },
    { code: 'OCB', name: 'OCB' },
    { code: 'MSB', name: 'MSB' },
    { code: 'HDBank', name: 'HDBank' },
    { code: 'SEABank', name: 'SeABank' },
    { code: 'LPB', name: 'LienVietPostBank' },
    { code: 'VIB', name: 'VIB' },
    { code: 'VAB', name: 'VietABank' },
    { code: 'NAB', name: 'Nam A Bank' },
    { code: 'PGB', name: 'PGBank' },
    { code: 'CAKE', name: 'CAKE by VPBank' },
];

// Validation rules
const VALIDATION_RULES = {
    legalName: {
        required: "Vui lòng nhập họ tên đầy đủ",
        minLength: { value: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
        maxLength: { value: 100, message: "Họ tên không được quá 100 ký tự" },
        pattern: {
            value: /^[a-zA-ZÀ-ỹ\s]+$/,
            message: "Họ tên chỉ được chứa chữ cái và khoảng trắng"
        }
    },
    idCardNumber: {
        required: "Vui lòng nhập số CMND/CCCD",
        pattern: {
            value: /^[0-9]{9,12}$/,
            message: "Số CMND/CCCD phải có 9-12 chữ số"
        }
    },
    idCardFrontImage: {
        required: "Vui lòng tải lên ảnh mặt trước CMND/CCCD"
    },
    idCardBackImage: {
        required: "Vui lòng tải lên ảnh mặt sau CMND/CCCD"
    },
    bankName: {
        required: "Vui lòng chọn ngân hàng"
    },
    bankAccountNumber: {
        required: "Vui lòng nhập số tài khoản",
        pattern: {
            value: /^[0-9]{6,20}$/,
            message: "Số tài khoản phải có 6-20 chữ số"
        }
    },
    accountHolderName: {
        required: "Vui lòng nhập tên chủ tài khoản",
        minLength: { value: 2, message: "Tên chủ tài khoản phải có ít nhất 2 ký tự" },
        maxLength: { value: 100, message: "Tên chủ tài khoản không được quá 100 ký tự" },
        pattern: {
            value: /^[A-Z\s]+$/,
            message: "Tên chủ tài khoản phải viết HOA và chỉ chứa chữ cái"
        }
    }
};

const RegisterSellerPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("personal");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm({
        defaultValues: {
            legalName: '',
            idCardNumber: '',
            idCardFrontImage: '',
            idCardBackImage: '',
            bankName: '',
            bankAccountNumber: '',
            accountHolderName: '',
            paymentMethods: ['Bank Transfer'], // Default payment method
        },
        mode: 'onChange' // Enable real-time validation
    });

    // Validate form before moving to next tab
    const validatePersonalInfo = async () => {
        const personalFields = ['legalName', 'idCardNumber', 'idCardFrontImage', 'idCardBackImage'];
        const isValid = await form.trigger(personalFields);
        
        if (!isValid) {
            toast.error("Vui lòng điền đầy đủ và chính xác thông tin cá nhân");
            return false;
        }
        return true;
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Final validation before submit
            const isValid = await form.trigger();
            if (!isValid) {
                toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
                setIsLoading(false);
                return;
            }

            // Validate required images
            if (!data.idCardFrontImage || !data.idCardBackImage) {
                toast.error("Vui lòng tải lên đầy đủ ảnh CMND/CCCD");
                setIsLoading(false);
                return;
            }

            // Add user ID to the data
            const sellerData = {
                ...data,
                user: user._id,
            };

            console.log('Sending seller data:', sellerData);

            await registerSeller(sellerData);
            toast.success("Hoàn thành đăng ký người bán", {
                description: "Hệ thống sẽ tiến hành xét duyệt và sẽ thông báo đến bạn ngay",
            });
            setIsSubmitted(true);

            // After a delay, navigate to shop registration
            setTimeout(() => {
                navigate('/');
            }, 8000);

        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || "Đăng ký thất bại, vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = async (value) => {
        if (value === "payment" && activeTab === "personal") {
            const isValid = await validatePersonalInfo();
            if (!isValid) return;
        }
        setActiveTab(value);
    };

    const handleContinueToPayment = async () => {
        const isValid = await validatePersonalInfo();
        if (isValid) {
            setActiveTab("payment");
        }
    };

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
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Đăng Ký Người Bán</h1>
                    <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
                        Hoàn tất thông tin cá nhân và tài khoản ngân hàng để trở thành người bán trên HULO
                    </p>
                </div>

                {isSubmitted ? (
                    <Card className="w-full max-w-3xl bg-white shadow-lg">
                        <CardContent className="pt-6 pb-8 px-8 text-center">
                            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Đăng Ký Thành Công!</h2>
                            <p className="text-gray-600 mb-6">
                                Thông tin người bán của bạn đã được ghi nhận. Bạn sẽ được chuyển hướng về trang chủ trong giây lát...
                            </p>
                            <div className="flex justify-center">
                                <Button
                                    className="bg-pink-500 hover:bg-pink-600"
                                    onClick={() => navigate('/')}
                                >
                                    Về trang chủ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="w-full max-w-3xl bg-white shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center text-xl">Thông Tin Người Bán</CardTitle>
                            <CardDescription className="text-center">
                                Vui lòng cung cấp các thông tin chính xác để dễ dàng xác minh danh tính của bạn
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="personal">Thông Tin Cá Nhân</TabsTrigger>
                                    <TabsTrigger value="payment">Thông Tin Thanh Toán</TabsTrigger>
                                </TabsList>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)}>
                                        <TabsContent value="personal">
                                            <div className="space-y-6">
                                                <Alert className="bg-blue-50 border-blue-200">
                                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                                    <AlertTitle className="text-blue-700">Lưu ý quan trọng</AlertTitle>
                                                    <AlertDescription className="text-blue-600">
                                                        Thông tin cá nhân của bạn sẽ được bảo mật và chỉ sử dụng cho mục đích xác minh danh tính.
                                                    </AlertDescription>
                                                </Alert>

                                                <FormField
                                                    control={form.control}
                                                    name="legalName"
                                                    rules={VALIDATION_RULES.legalName}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Họ tên đầy đủ (theo CMND/CCCD) <span className="text-red-500">*</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="Nguyễn Văn A" 
                                                                    {...field}
                                                                    className={form.formState.errors.legalName ? "border-red-500" : ""}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Nhập chính xác họ tên như trên CMND/CCCD
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="idCardNumber"
                                                    rules={VALIDATION_RULES.idCardNumber}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Số CMND/CCCD <span className="text-red-500">*</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="012345678901" 
                                                                    {...field}
                                                                    maxLength={12}
                                                                    className={form.formState.errors.idCardNumber ? "border-red-500" : ""}
                                                                    onChange={(e) => {
                                                                        // Only allow numbers
                                                                        const value = e.target.value.replace(/\D/g, '');
                                                                        field.onChange(value);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Nhập 9-12 chữ số (CMND: 9 số, CCCD: 12 số)
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <FormField
                                                        control={form.control}
                                                        name="idCardFrontImage"
                                                        rules={VALIDATION_RULES.idCardFrontImage}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Ảnh mặt trước CMND/CCCD <span className="text-red-500">*</span>
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <ImageUpload
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        label="Tải ảnh mặt trước"
                                                                        maxSize={5}
                                                                        aspectRatio="landscape"
                                                                        previewSize="medium"
                                                                        className={form.formState.errors.idCardFrontImage ? "border-red-500" : ""}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Định dạng: JPG, PNG. Tối đa 5MB
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="idCardBackImage"
                                                        rules={VALIDATION_RULES.idCardBackImage}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Ảnh mặt sau CMND/CCCD <span className="text-red-500">*</span>
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <ImageUpload
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        label="Tải ảnh mặt sau"
                                                                        maxSize={5}
                                                                        aspectRatio="landscape"
                                                                        previewSize="medium"
                                                                        className={form.formState.errors.idCardBackImage ? "border-red-500" : ""}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    Định dạng: JPG, PNG. Tối đa 5MB
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>

                                                <div className="pt-4 flex justify-end">
                                                    <Button
                                                        type="button"
                                                        className="bg-pink-500 hover:bg-pink-600"
                                                        onClick={handleContinueToPayment}
                                                    >
                                                        Tiếp tục
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="payment">
                                            <div className="space-y-6">
                                                <Alert className="bg-blue-50 border-blue-200">
                                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                                    <AlertTitle className="text-blue-700">Thông tin tài khoản ngân hàng</AlertTitle>
                                                    <AlertDescription className="text-blue-600">
                                                        Thông tin này sẽ được sử dụng để thanh toán tiền bán hàng cho bạn.
                                                    </AlertDescription>
                                                </Alert>

                                                <FormField
                                                    control={form.control}
                                                    name="bankName"
                                                    rules={VALIDATION_RULES.bankName}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Tên ngân hàng <span className="text-red-500">*</span>
                                                            </FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className={form.formState.errors.bankName ? "border-red-500" : ""}>
                                                                        <SelectValue placeholder="Chọn ngân hàng" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {BANKS.map((bank) => (
                                                                        <SelectItem key={bank.code} value={bank.name}>
                                                                            {bank.name} ({bank.code})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="bankAccountNumber"
                                                    rules={VALIDATION_RULES.bankAccountNumber}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Số tài khoản <span className="text-red-500">*</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="1234567890123456" 
                                                                    {...field}
                                                                    maxLength={20}
                                                                    className={form.formState.errors.bankAccountNumber ? "border-red-500" : ""}
                                                                    onChange={(e) => {
                                                                        // Only allow numbers
                                                                        const value = e.target.value.replace(/\D/g, '');
                                                                        field.onChange(value);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Nhập 6-20 chữ số
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="accountHolderName"
                                                    rules={VALIDATION_RULES.accountHolderName}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Tên chủ tài khoản <span className="text-red-500">*</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input 
                                                                    placeholder="NGUYEN VAN A" 
                                                                    {...field}
                                                                    className={form.formState.errors.accountHolderName ? "border-red-500" : ""}
                                                                    onChange={(e) => {
                                                                        // Convert to uppercase and only allow letters and spaces
                                                                        const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
                                                                        field.onChange(value);
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Nhập chính xác tên chủ tài khoản như trên thẻ/sổ ngân hàng (viết HOA, không dấu)
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <div className="pt-4 flex justify-between">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setActiveTab("personal")}
                                                    >
                                                        Quay lại
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        className="bg-pink-500 hover:bg-pink-600"
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                Đang xử lý...
                                                            </>
                                                        ) : (
                                                            "Hoàn tất đăng ký"
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </form>
                                </Form>
                            </Tabs>
                        </CardContent>

                        <CardFooter className="flex flex-col items-center pt-0">
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của HULO
                            </p>
                        </CardFooter>
                    </Card>
                )}

                {/* Bottom image */}
                <div className="w-full max-w-md mx-auto">
                    <img
                        src={logo}
                        alt="HULO Community"
                        className="rounded-lg shadow-lg w-full max-h-40 object-contain"
                    />
                </div>
            </div>

            {/* Animation cho background */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)] animate-pulse-slow" />
            </div>
        </div>
    );
};

export default RegisterSellerPage;