"use client"

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"

const ErrorState = ({
    title = "Có lỗi xảy ra",
    message = "Không thể tải dữ liệu. Vui lòng thử lại.",
    onRetry,
    type = "general", // "general", "network", "server"
}) => {
    const getIcon = () => {
        switch (type) {
            case "network":
                return <WifiOff className="w-16 h-16 text-gray-400" />
            case "server":
                return <AlertCircle className="w-16 h-16 text-red-400" />
            default:
                return <AlertCircle className="w-16 h-16 text-gray-400" />
        }
    }

    const getColors = () => {
        switch (type) {
            case "network":
                return {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    text: "text-blue-600",
                    button: "bg-blue-500 hover:bg-blue-600",
                }
            case "server":
                return {
                    bg: "bg-red-50",
                    border: "border-red-200",
                    text: "text-red-600",
                    button: "bg-red-500 hover:bg-red-600",
                }
            default:
                return {
                    bg: "bg-gray-50",
                    border: "border-gray-200",
                    text: "text-gray-600",
                    button: "bg-pink-500 hover:bg-pink-600",
                }
        }
    }

    const colors = getColors()

    return (
        <Card className={`${colors.bg} ${colors.border} border-2`}>
            <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                    {getIcon()}

                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <p className={`text-sm ${colors.text} max-w-md`}>{message}</p>
                    </div>

                    {onRetry && (
                        <Button
                            onClick={onRetry}
                            className={`${colors.button} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Thử lại
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default ErrorState
