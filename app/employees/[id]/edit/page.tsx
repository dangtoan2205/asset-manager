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

export default function EditEmployeePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [managers, setManagers] = useState<Employee[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        employeeId: "",
        email: "",
        department: "",
        position: "",
        phone: "",
        status: "active",
        joinDate: "",
        leaveDate: "",
        manager: "",
        notes: "",
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Kiểm tra quyền hạn
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }

            // Tải thông tin nhân viên
            fetchEmployee();

            // Tải danh sách nhân viên để chọn làm quản lý
            fetchManagers();
        }
    }, [status, session, router, employeeId]);

    const fetchEmployee = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/employees/${employeeId}`);
            const employee = response.data.employee;

            // Format dates for input fields
            const joinDate = employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : "";
            const leaveDate = employee.leaveDate ? new Date(employee.leaveDate).toISOString().split('T')[0] : "";

            setFormData({
                name: employee.name || "",
                employeeId: employee.employeeId || "",
                email: employee.email || "",
                department: employee.department || "",
                position: employee.position || "",
                phone: employee.phone || "",
                status: employee.status || "active",
                joinDate,
                leaveDate,
                manager: employee.manager?._id || "",
                notes: employee.notes || "",
            });

            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải thông tin nhân viên");
            console.error("Error fetching employee:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await axios.get("/api/employees");
            // Chỉ lấy các nhân viên đang hoạt động để làm quản lý, và loại trừ nhân viên hiện tại
            const activeEmployees = response.data.employees.filter(
                (emp: any) => emp.status === "active" && emp._id !== employeeId
            );
            setManagers(activeEmployees || []);
        } catch (err: any) {
            console.error("Error fetching managers:", err);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            setSubmitting(true);

            // Validate dữ liệu
            if (!formData.name || !formData.employeeId || !formData.email || !formData.department || !formData.position) {
                setError("Vui lòng điền đầy đủ thông tin bắt buộc");
                setSubmitting(false);
                return;
            }

            // Kiểm tra định dạng email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setError("Email không hợp lệ");
                setSubmitting(false);
                return;
            }

            // Gửi request cập nhật nhân viên
            const response = await axios.put(`/api/employees/${employeeId}`, formData);

            // Redirect khi thành công
            router.push(`/employees/${employeeId}`);
        } catch (err: any) {
            setError(err.response?.data?.error || "Đã xảy ra lỗi khi cập nhật nhân viên");
            setSubmitting(false);
        }
    };

    if (loading && status !== "authenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-primary-foreground hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <Link href="/employees" className="text-primary-foreground hover:underline">
                            Nhân viên
                        </Link>
                        <span>/</span>
                        <Link href={`/employees/${employeeId}`} className="text-primary-foreground hover:underline">
                            Chi tiết
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Chỉnh sửa nhân viên</h1>
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
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">Chỉnh sửa nhân viên</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium">
                                    Họ tên <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="employeeId" className="block text-sm font-medium">
                                    Mã nhân viên <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="employeeId"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium">
                                    Email <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="department" className="block text-sm font-medium">
                                    Phòng ban <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="position" className="block text-sm font-medium">
                                    Chức vụ <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone" className="block text-sm font-medium">
                                    Số điện thoại
                                </label>
                                <input
                                    type="text"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="status" className="block text-sm font-medium">
                                    Trạng thái <span className="text-destructive">*</span>
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                >
                                    <option value="active">Đang làm việc</option>
                                    <option value="on_leave">Tạm nghỉ</option>
                                    <option value="inactive">Đã nghỉ việc</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="joinDate" className="block text-sm font-medium">
                                    Ngày vào làm <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="joinDate"
                                    name="joinDate"
                                    value={formData.joinDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="leaveDate" className="block text-sm font-medium">
                                    Ngày nghỉ việc
                                </label>
                                <input
                                    type="date"
                                    id="leaveDate"
                                    name="leaveDate"
                                    value={formData.leaveDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="manager" className="block text-sm font-medium">
                                    Quản lý
                                </label>
                                <select
                                    id="manager"
                                    name="manager"
                                    value={formData.manager}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    <option value="">-- Chọn quản lý --</option>
                                    {managers.map((manager) => (
                                        <option key={manager._id} value={manager._id}>
                                            {manager.name} ({manager.employeeId}) - {manager.department}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label htmlFor="notes" className="block text-sm font-medium mb-2">
                                Ghi chú
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                            />
                        </div>

                        <div className="mt-8 flex justify-end space-x-4">
                            <Link
                                href={`/employees/${employeeId}`}
                                className="px-4 py-2 border rounded-md hover:bg-muted"
                            >
                                Hủy
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-70"
                            >
                                {submitting ? "Đang xử lý..." : "Cập nhật nhân viên"}
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