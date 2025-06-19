"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { FiEye, FiEyeOff } from "react-icons/fi"

const FormDataDebug = ({ formData, title = "Form Data Debug" }) => {
    const [isVisible, setIsVisible] = useState(false)

    if (process.env.NODE_ENV === "production") {
        return null // Không hiển thị trong production
    }

    return (
        <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-yellow-800">{title}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsVisible(!isVisible)} className="h-6 px-2 text-xs">
                        {isVisible ? <FiEyeOff className="w-3 h-3" /> : <FiEye className="w-3 h-3" />}
                    </Button>
                </div>
            </CardHeader>
            {isVisible && (
                <CardContent className="pt-0">
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-96">
                        {JSON.stringify(formData, null, 2)}
                    </pre>
                </CardContent>
            )}
        </Card>
    )
}

export default FormDataDebug
