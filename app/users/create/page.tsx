"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    department: string;
}

export default function CreateUserPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user",
        employeeId: "",
    });
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session?.user?.role !== "admin") {
                router.push("/dashboard");
            } else {
                fetchEmployees();
            }
        }
    }, [status, router, session]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/employees");
            setEmployees(response.data.employees || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        } finally {
            setLoading(false);
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
        if (!formData.name || !formData.email || !formData.password) {
            setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                employee: formData.employeeId || undefined
            };

            await axios.post("/api/users", userData);
            
            setSuccess("Người dùng đã được tạo thành công!");
            
            // Reset form
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "user",
                employeeId: "",
            });
            
            // Redirect after 2 seconds
            setTimeout(() => {
                router.push("/users");
            }, 2000);
            
        } catch (err: any) {
            console.error("Error creating user:", err);
            setError(err.response?.data?.error || "Không thể tạo người dùng. Vui lòng thử lại.");
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
                        <h1 className="text-xl font-bold">Thêm người dùng</h1>
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
                    <h2 className="text-2xl font-bold">Thêm người dùng mới</h2>
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
                                <label className="block font-medium mb-1">
                                    Mật khẩu <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border rounded-md p-2"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                                </p>
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
                                >
                                    <option value="user">Người dùng</option>
                                    <option value="manager">Quản lý</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">Liên kết với nhân viên (không bắt buộc)</h3>
                            
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
                                        Bỏ chọn nhân viên
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
                                {submitting ? "Đang xử lý..." : "Tạo người dùng"}
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
