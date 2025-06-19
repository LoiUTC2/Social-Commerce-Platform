"use client"

import { useState, useEffect } from "react"
import { Navigate, Link } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { loginUser } from "../../services/authService"
import {
    FiEye,
    FiEyeOff,
    FiMail,
    FiLock,
    FiShield,
    FiArrowRight,
    FiAlertCircle,
    FiCheck,
    FiSun,
    FiMoon,
    FiGlobe,
} from "react-icons/fi"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { Checkbox } from "../../components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../components/ui/select"
import { toast } from "sonner"

const Login = () => {
    const { user, login } = useAuth()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [language, setLanguage] = useState("vi")
    const [loginAttempts, setLoginAttempts] = useState(0)
    const [isBlocked, setIsBlocked] = useState(false)
    const [blockTimeLeft, setBlockTimeLeft] = useState(0)

    // Demo accounts for testing
    const [showDemoAccounts, setShowDemoAccounts] = useState(false)
    const demoAccounts = [
        { email: "admin@hulo.com", password: "admin123", role: "Super Admin" },
        { email: "manager@hulo.com", password: "manager123", role: "Manager" },
        { email: "moderator@hulo.com", password: "mod123", role: "Moderator" },
    ]

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        })
        // Clear error when user starts typing
        if (error) setError("")
    }

    // Handle demo account selection
    const handleDemoLogin = (demoAccount) => {
        setFormData({
            ...formData,
            email: demoAccount.email,
            password: demoAccount.password,
        })
        toast.success(`Đã chọn tài khoản demo: ${demoAccount.role}`)
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()

        if (isBlocked) {
            toast.error(`Tài khoản bị khóa. Vui lòng thử lại sau ${blockTimeLeft} giây.`)
            return
        }

        setLoading(true)
        setError("")

        try {
            const { accessToken, user: userData } = await loginUser(formData.email, formData.password)

            if (userData.role !== "admin") {
                setError("Tài khoản không có quyền truy cập admin.")
                setLoginAttempts((prev) => prev + 1)
                setLoading(false)
                return
            }

            // Save remember me preference
            if (formData.rememberMe) {
                localStorage.setItem("rememberMe", "true")
                localStorage.setItem("savedEmail", formData.email)
            } else {
                localStorage.removeItem("rememberMe")
                localStorage.removeItem("savedEmail")
            }

            login(accessToken, userData)
            toast.success("Đăng nhập thành công!")
        } catch (err) {
            console.error("Login error:", err)
            const errorMessage = err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
            setError(errorMessage)
            setLoginAttempts((prev) => prev + 1)

            // Block account after 5 failed attempts
            if (loginAttempts >= 4) {
                setIsBlocked(true)
                setBlockTimeLeft(300) // 5 minutes
                toast.error("Tài khoản bị khóa do đăng nhập sai quá nhiều lần.")
            }
        } finally {
            setLoading(false)
        }
    }

    // Handle block countdown
    useEffect(() => {
        let interval
        if (isBlocked && blockTimeLeft > 0) {
            interval = setInterval(() => {
                setBlockTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsBlocked(false)
                        setLoginAttempts(0)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isBlocked, blockTimeLeft])

    // Load saved email on component mount
    useEffect(() => {
        const rememberMe = localStorage.getItem("rememberMe")
        const savedEmail = localStorage.getItem("savedEmail")
        if (rememberMe && savedEmail) {
            setFormData((prev) => ({
                ...prev,
                email: savedEmail,
                rememberMe: true,
            }))
        }
    }, [])

    // Format block time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    if (user && user.role === "admin") {
        return <Navigate to="/admin" replace />
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-600 via-pink-700 to-pink-800 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fillRule=evenodd%3E%3Cg fill=%23ffffff fillOpacity=0.1%3E%3Ccircle cx=30 cy=30 r=4/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 text-center">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                            <FiShield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">HULO Admin</h1>
                        <p className="text-xl text-pink-100 mb-8">Quản lý nền tảng thương mại điện tử</p>
                    </div>

                    <div className="space-y-6 max-w-md">
                        <div className="flex items-center space-x-4 text-pink-100">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <FiCheck className="w-4 h-4" />
                            </div>
                            <span>Quản lý người dùng và gian hàng</span>
                        </div>
                        <div className="flex items-center space-x-4 text-pink-100">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <FiCheck className="w-4 h-4" />
                            </div>
                            <span>Theo dõi doanh thu và hiệu suất</span>
                        </div>
                        <div className="flex items-center space-x-4 text-pink-100">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <FiCheck className="w-4 h-4" />
                            </div>
                            <span>Xử lý tranh chấp và hỗ trợ</span>
                        </div>
                    </div>

                    <div className="mt-12 text-sm text-pink-200">
                        <p>Trusted by 10,000+ businesses worldwide</p>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="mx-auto w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="lg:hidden mb-6">
                            <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FiShield className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">HULO Admin</h1>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại</h2>
                        <p className="text-gray-600">Đăng nhập vào tài khoản admin của bạn</p>
                    </div>

                    {/* Settings */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsDarkMode(!isDarkMode)} className="h-8 w-8 p-0">
                                {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                            </Button>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="w-20 h-8">
                                    <FiGlobe className="h-4 w-4" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vi">VI</SelectItem>
                                    <SelectItem value="en">EN</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                            className="text-pink-600 hover:text-pink-700"
                        >
                            Demo Accounts
                        </Button>
                    </div>

                    {/* Demo Accounts */}
                    {showDemoAccounts && (
                        <Card className="mb-6 border-pink-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium text-pink-700">Tài khoản demo</CardTitle>
                                <CardDescription className="text-xs">Click để sử dụng tài khoản demo</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {demoAccounts.map((account, index) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDemoLogin(account)}
                                        className="w-full justify-between text-xs h-8"
                                    >
                                        <span>{account.email}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {account.role}
                                        </Badge>
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Login Form */}
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Error Alert */}
                                {error && (
                                    <Alert variant="destructive" className="mb-4">
                                        <FiAlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                {/* Block Alert */}
                                {isBlocked && (
                                    <Alert className="mb-4 border-orange-200 bg-orange-50">
                                        <FiAlertCircle className="h-4 w-4 text-orange-600" />
                                        <AlertDescription className="text-orange-800">
                                            Tài khoản bị khóa do đăng nhập sai quá nhiều lần. Thời gian còn lại: {formatTime(blockTimeLeft)}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Login Attempts Warning */}
                                {loginAttempts > 0 && loginAttempts < 5 && !isBlocked && (
                                    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                                        <FiAlertCircle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-800">
                                            Đăng nhập sai {loginAttempts}/5 lần. Tài khoản sẽ bị khóa sau {5 - loginAttempts} lần thử sai nữa.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                        Email
                                    </Label>
                                    <div className="relative">
                                        <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="admin@hulo.com"
                                            className="pl-10 h-11 border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                                            required
                                            disabled={loading || isBlocked}
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Mật khẩu
                                    </Label>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className="pl-10 pr-10 h-11 border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                                            required
                                            disabled={loading || isBlocked}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                                            disabled={loading || isBlocked}
                                        >
                                            {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="rememberMe"
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
                                            disabled={loading || isBlocked}
                                        />
                                        <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                                            Ghi nhớ đăng nhập
                                        </Label>
                                    </div>
                                    <Link to="/forgot-password" className="text-sm text-pink-600 hover:text-pink-700 font-medium">
                                        Quên mật khẩu?
                                    </Link>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={loading || isBlocked}
                                    className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-medium transition-colors"
                                >
                                    {loading ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Đang đăng nhập...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <span>Đăng nhập</span>
                                            <FiArrowRight className="w-4 h-4" />
                                        </div>
                                    )}
                                </Button>
                            </form>

                            <Separator className="my-6" />

                            {/* Additional Info */}
                            <div className="text-center space-y-4">
                                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                                    <span>🔒 Bảo mật SSL</span>
                                    <span>•</span>
                                    <span>🛡️ 2FA Ready</span>
                                    <span>•</span>
                                    <span>⚡ 99.9% Uptime</span>
                                </div>

                                <div className="text-xs text-gray-400">
                                    Bằng cách đăng nhập, bạn đồng ý với{" "}
                                    <Link to="/terms" className="text-pink-600 hover:underline">
                                        Điều khoản sử dụng
                                    </Link>{" "}
                                    và{" "}
                                    <Link to="/privacy" className="text-pink-600 hover:underline">
                                        Chính sách bảo mật
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-500">
                            © 2024 HULO Platform. All rights reserved.
                            <br />
                            Version 2.0.1 • Last updated: Dec 2024
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
