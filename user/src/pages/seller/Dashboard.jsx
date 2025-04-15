import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Line } from 'react-chartjs-2';
import {
  PackageCheck,
  ShoppingCart,
  Users,
  BarChart2,
  PlusCircle,
  LayoutDashboard,
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);
export default function Dashboard() {
  // Giả lập dữ liệu
  const summary = [
    { title: 'Tổng đơn hàng', value: 128, icon: ShoppingCart },
    { title: 'Đang xử lý', value: 24, icon: PackageCheck },
    { title: 'Sản phẩm', value: 82, icon: PlusCircle },
    { title: 'Khách hàng', value: 231, icon: Users },
  ];

  const chartData = {
    labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5'],
    datasets: [
      {
        label: 'Doanh thu (triệu VNĐ)',
        data: [10, 20, 15, 30, 25],
        fill: false,
        borderColor: '#3b82f6',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard className="w-6 h-6" /> Tổng quan cửa hàng
      </h1>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summary.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Biểu đồ */}
      <Card>
        <CardContent className="p-4">
          <p className="font-semibold mb-4">📈 Doanh thu 5 tháng gần nhất</p>
          <div className="h-64">
            <Line key={Date.now()} data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Điều hướng nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold">Thêm sản phẩm mới</p>
            <p className="text-sm text-gray-500">Tạo sản phẩm nhanh chóng để bắt đầu bán.</p>
            <Button variant="outline" className="w-full">Thêm sản phẩm</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold">Quản lý đơn hàng</p>
            <p className="text-sm text-gray-500">Duyệt, theo dõi và xử lý đơn hàng.</p>
            <Button variant="outline" className="w-full">Xem đơn hàng</Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold">Chiến dịch Marketing</p>
            <p className="text-sm text-gray-500">Thiết lập mã giảm giá, quảng cáo sản phẩm.</p>
            <Button variant="outline" className="w-full">Tạo chiến dịch</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
