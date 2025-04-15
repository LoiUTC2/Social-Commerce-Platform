import AuthLayout from '../../layouts/AuthLayout';

///KHÔNG CÓ TRANG NÀY NHAAAAAA
export default function Login() {
  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800 dark:text-white">Đăng nhập</h2>
      <form className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded bg-gray-100 dark:bg-zinc-700 text-sm dark:text-white"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full p-3 rounded bg-gray-100 dark:bg-zinc-700 text-sm dark:text-white"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Đăng nhập
        </button>
      </form>
    </AuthLayout>
  );
}
