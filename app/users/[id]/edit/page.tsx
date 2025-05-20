"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    employee?: any;
    provider?: string;
    lastLogin?: string;
}

export default function EditUserPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "", // Optional, only if changing password
        role: "user",
        employeeId: "",
    });
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [changePassword, setChangePassword] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session?.user?.role !== "admin") {
                router.push("/dashboard");
            } else {
                Promise.all([
                    fetchUser(),
                    fetchEmployees()
                ]);
            }
        }
    }, [status, router, session, userId]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/users/${userId}`);
            const userData = response.data.user;
            setUser(userData);
            
            setFormData({
                name: userData.name,
                email: userData.email,
                password: "",
                role: userData.role,
                employeeId: userData.employee?._id || "",
            });
        } catch (err: any) {
            console.error("Error fetching user:", err);
            setError(err.response?.data?.error || "Không thể tải thông tin người dùng");
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get("/api/employees");
            setEmployees(response.data.employees || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.name || !formData.email) {
            setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }

        // Additional validation for password if changing
        if (changePassword && formData.password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            
            const userData: any = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                employee: formData.employeeId || undefined
            };

            // Only include password if it's being changed
            if (changePassword && formData.password) {
                userData.password = formData.password;
            }

            await axios.put(`/api/users/${userId}`, userData);
            
            setSuccess("Thông tin người dùng đã được cập nhật thành công!");
            
            // Refresh user data
            await fetchUser();
            
            // Reset password change option
            setChangePassword(false);
            
        } catch (err: any) {
            console.error("Error updating user:", err);
            setError(err.response?.data?.error || "Không thể cập nhật thông tin người dùng. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Đang tải...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-6 bg-destructive/10 text-destructive rounded-lg max-w-md">
                    <h2 className="text-xl font-bold mb-4">Không tìm thấy người dùng</h2>
                    <p>Người dùng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                    <Link 
                        href="/users" 
                        className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-primary-foreground hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href="/users" className="text-primary-foreground hover:underline">
                            Người dùng
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Chỉnh sửa người dùng</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {session?.user?.name && (
                            <span>Xin chào, {session.user.name}</span>
                        )}
                        <Link
                            href="/api/auth/signout"
                            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                        >
                            Đăng xuất
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto py-6 px-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Chỉnh sửa thông tin: {user.name}</h2>
                    <Link
                        href="/users"
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                    >
                        Quay lại
                    </Link>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                        <p>{success}</p>
                    </div>
                )}

                <div className="bg-card border rounded-lg shadow-sm p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block font-medium mb-1">
                                    Tên người dùng <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-1">
                                    Email <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-2"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        id="changePassword"
                                        checked={changePassword}
                                        onChange={() => setChangePassword(!changePassword)}
                                        className="mr-2"
                                    />
                                    <label htmlFor="changePassword" className="font-medium">
                                        Đổi mật khẩu
                                    </label>
                                </div>
                                
                                {changePassword && (
                                    <>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full border rounded-md p-2"
                                            placeholder="Nhập mật khẩu mới"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                                        </p>
                                    </>
                                )}
                                
                                {user.provider && user.provider !== 'credentials' && (
                                    <p className="text-yellow-600 text-sm mt-1">
                                        Lưu ý: Người dùng này đăng nhập qua {user.provider}. Việc đổi mật khẩu có thể không có tác dụng.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block font-medium mb-1">
                                    Vai trò <span className="text-destructive">*</span>
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-2 bg-background"
                                    required
                                    disabled={user._id === session?.user?.id} // Không thể thay đổi vai trò của chính mình
                                >
                                    <option value="user">Người dùng</option>
                                    <option value="manager">Quản lý</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                                {user._id === session?.user?.id && (
                                    <p className="text-yellow-600 text-sm mt-1">
                                        Bạn không thể thay đổi vai trò của chính mình
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">Liên kết với nhân viên</h3>
                            
                            <div className="mb-4">
                                <label className="block font-medium mb-1">
                                    Tìm kiếm nhân viên
                                </label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full border rounded-md p-2"
                                    placeholder="Tìm theo tên, mã nhân viên, phòng ban..."
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto border rounded-md">
                                <table className="w-full">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-medium">Chọn</th>
                                            <th className="px-4 py-2 text-left font-medium">Tên nhân viên</th>
                                            <th className="px-4 py-2 text-left font-medium">Mã NV</th>
                                            <th className="px-4 py-2 text-left font-medium">Phòng ban</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredEmployees.length > 0 ? (
                                            filteredEmployees.map((emp) => (
                                                <tr key={emp._id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="radio"
                                                            name="employeeId"
                                                            value={emp._id}
                                                            checked={formData.employeeId === emp._id}
                                                            onChange={handleChange}
                                                            className="border rounded"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">{emp.name}</td>
                                                    <td className="px-4 py-2">{emp.employeeId}</td>
                                                    <td className="px-4 py-2">{emp.department}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">
                                                    Không tìm thấy nhân viên phù hợp
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {formData.employeeId && (
                                <div className="mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, employeeId: "" })}
                                        className="text-sm text-destructive hover:underline"
                                    >
                                        Bỏ liên kết với nhân viên
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-6 flex justify-end gap-2">
                            <Link
                                href="/users"
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                                disabled={submitting}
                            >
                                {submitting ? "Đang xử lý..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <footer className="bg-muted py-4">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p>© {new Date().getFullYear()} Hệ thống Quản lý Thiết bị & Tài khoản</p>
                </div>
            </footer>
        </div>
    );
}
