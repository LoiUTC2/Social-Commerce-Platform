import { useState, useEffect, useRef } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { getCurrentUser, updateProfile } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { ImageUpload } from '../../components/common/ImageUploadForSeller';
import { Camera, User, Calendar, MapPin, Phone, Mail, Edit3, Save, X } from 'lucide-react';
import avtAcount from '../../assets/anh-avatar-trang-tron.jpg';
import avtMale from '../../assets/avatar-mac-dinh-nam.jpg';
import avtFemale from '../../assets/avatar-mac-dinh-nu.jpg';
import avtOther from '../../assets/avatar-mac-dinh-lgbt.jpg';

export default function AccountPage() {
    const { user, userDataLatest } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        fullName: '',
        gender: '',
        dateOfBirth: '',
        bio: '',
        avatar: '',
        coverImage: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getCurrentUser();
                const { fullName, gender, dateOfBirth, bio, avatar, coverImage, phone, address } = res.data;
                setForm({
                    fullName: fullName || '',
                    gender: gender || '',
                    dateOfBirth: dateOfBirth?.slice(0, 10) || '',
                    bio: bio || '',
                    avatar: avatar || '',
                    coverImage: coverImage || '',
                    phone: phone || '',
                    address: address || ''
                });
            } catch (err) {
                toast.error('Không thể tải thông tin tài khoản');
            }
        };

        fetch();
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const getDefaultAvatarByGender = (gender) => {
        switch (gender) {
            case 'male':
                return avtMale;
            case 'female':
                return avtFemale;
            case 'other':
                return avtOther;
            default:
                return avtAcount;
        }
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const res = await updateProfile(form);
            userDataLatest(res.data);
            toast.success('Cập nhật thông tin thành công!');
            setIsEditing(false);
        } catch (err) {
            console.log("Lỗi khi cập nhật: ", err.message);
            toast.error(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Reset form về trạng thái ban đầu
        const fetch = async () => {
            try {
                const res = await getCurrentUser();
                const { fullName, gender, dateOfBirth, bio, avatar, coverImage, phone, address } = res.data;
                setForm({
                    fullName: fullName || '',
                    gender: gender || '',
                    dateOfBirth: dateOfBirth?.slice(0, 10) || '',
                    bio: bio || '',
                    avatar: avatar || '',
                    coverImage: coverImage || '',
                    phone: phone || '',
                    address: address || ''
                });
            } catch (err) {
                toast.error('Có lỗi xảy ra');
            }
        };
        fetch();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const getGenderText = (gender) => {
        switch (gender) {
            case 'male': return 'Nam';
            case 'female': return 'Nữ';
            case 'other': return 'Khác';
            default: return 'Chưa cập nhật';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* Header với nút chỉnh sửa */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Thông tin cá nhân</h1>
                    <p className="text-gray-600 mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Chỉnh sửa
                    </Button>
                )}
            </div>

            {/* Profile Header Card - Cover Image & Avatar */}
            <Card className="overflow-hidden">
                <div className="relative">
                    {/* Cover Image */}
                    <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                        {form.coverImage && (
                            <img
                                src={form.coverImage}
                                alt="Cover"
                                className="w-full h-full object-cover"
                            />
                        )}
                        {isEditing && (
                            <div className="absolute top-4 right-4">
                                <ImageUpload
                                    value={form.coverImage}
                                    onChange={(url) => setForm(prev => ({ ...prev, coverImage: url }))}
                                    label="Thay đổi ảnh bìa"
                                    aspectRatio="landscape"
                                    previewSize="small"
                                    className="bg-black/50 border-white/20 hover:bg-black/60"
                                />
                            </div>
                        )}
                        {!form.coverImage && isEditing && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ImageUpload
                                    value={form.coverImage}
                                    onChange={(url) => setForm(prev => ({ ...prev, coverImage: url }))}
                                    label="Thêm ảnh bìa"
                                    aspectRatio="landscape"
                                    previewSize="medium"
                                    className="bg-black/30 border-white/40 text-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* Avatar */}
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                                <img
                                    src={form.avatar || getDefaultAvatarByGender(form.gender)}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {isEditing && (
                                <div className="absolute bottom-2 right-2">
                                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white shadow-lg cursor-pointer hover:bg-gray-200">
                                        <ImageUpload
                                            value={form.avatar}
                                            onChange={(url) => setForm(prev => ({ ...prev, avatar: url }))}
                                            label=""
                                            aspectRatio="square"
                                            previewSize="small"
                                            className="w-full h-full border-none bg-transparent p-0"
                                        />
                                        <Camera className="w-4 h-4 text-gray-600 absolute" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Info */}
                <CardContent className="pt-20 pb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{form.fullName || 'Chưa cập nhật tên'}</h2>
                            <p className="text-gray-600 mt-1 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {user?.email}
                            </p>
                            {form.bio && (
                                <p className="text-gray-700 mt-2 max-w-2xl">{form.bio}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {user?.roles?.map((role) => (
                                <Badge key={role} variant="secondary" className="capitalize">
                                    {role === 'buyer' ? 'Người mua' : role === 'seller' ? 'Người bán' : 'Quản trị'}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Thông tin cá nhân
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Họ và tên</Label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Giới tính</Label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={form.gender}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Chọn giới tính --</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    name="dateOfBirth"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="Nhập số điện thoại"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Địa chỉ</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Nhập địa chỉ"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bio">Tiểu sử</Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    rows={3}
                                    value={form.bio}
                                    onChange={handleChange}
                                    placeholder="Viết vài dòng về bản thân..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Họ và tên</p>
                                    <p className="text-gray-900">{form.fullName || 'Chưa cập nhật'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 text-gray-400 flex items-center justify-center">
                                    ♂♀
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Giới tính</p>
                                    <p className="text-gray-900">{getGenderText(form.gender)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Ngày sinh</p>
                                    <p className="text-gray-900">{formatDate(form.dateOfBirth)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Số điện thoại</p>
                                    <p className="text-gray-900">{form.phone || 'Chưa cập nhật'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 md:col-span-2">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Địa chỉ</p>
                                    <p className="text-gray-900">{form.address || 'Chưa cập nhật'}</p>
                                </div>
                            </div>

                            {form.bio && (
                                <div className="flex items-start gap-3 md:col-span-2">
                                    <Edit3 className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Tiểu sử</p>
                                        <p className="text-gray-900">{form.bio}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            {isEditing && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Hủy
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}