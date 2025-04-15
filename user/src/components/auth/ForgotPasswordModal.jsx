import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function ForgotPasswordModal({ open, onClose }) {
  const handleSubmit = () => {
    // Gửi email reset tại đây
    alert('Đã gửi email đặt lại mật khẩu!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quên mật khẩu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Nhập địa chỉ email để nhận hướng dẫn đặt lại mật khẩu.
          </p>
          <Input placeholder="Email" />
          <Button className="w-full" onClick={handleSubmit}>
            Gửi yêu cầu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
