"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Employee {
    _id: string;
    name: string;
    employeeId: string;
    email: string;
    department: string;
    position: string;
    status: string;
    joinDate: string;
}

export default function EmployeesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchEmployees();
        }
    }, [status, router]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/employees");
            setEmployees(response.data.employees || []);
            setDepartments(response.data.departments || []);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải danh sách nhân viên");
            console.error("Error fetching employees:", err);
        } finally {
            setLoading(false);
        }
    };

    // Hàm xóa nhân viên
    const handleDeleteEmployee = async (employeeId: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
            try {
                setDeleting(true);
                await axios.delete(`/api/employees/${employeeId}`);
                fetchEmployees();
            } catch (err: any) {
                setError(err.response?.data?.error || "Không thể xóa nhân viên");
                console.error("Error deleting employee:", err);
            } finally {
                setDeleting(false);
            }
        }
    };

    // Hàm xuất Excel danh sách nhân viên
    const exportToExcel = () => {
        // Tạo dữ liệu cho file Excel
        const data = filteredEmployees.map(employee => ({
            'Mã nhân viên': employee.employeeId,
            'Họ tên': employee.name,
            'Email': employee.email,
            'Phòng ban': employee.department,
            'Chức vụ': employee.position,
            'Trạng thái': statusLabels[employee.status] || employee.status,
            'Ngày vào làm': new Date(employee.joinDate).toLocaleDateString('vi-VN')
        }));

        // Tạo một workbook mới
        import('xlsx').then(XLSX => {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách nhân viên");

            // Tạo tên file với timestamp
            const fileName = `danh-sach-nhan-vien-${new Date().toISOString().slice(0, 10)}.xlsx`;

            // Xuất file Excel
            XLSX.writeFile(workbook, fileName);
        }).catch(err => {
            console.error("Không thể xuất Excel:", err);
            setError("Không thể xuất file Excel. Vui lòng thử lại sau!");
        });
    };

    const statusColors: Record<string, string> = {
        active: "bg-green-100 text-green-800",
        inactive: "bg-red-100 text-red-800",
        on_leave: "bg-yellow-100 text-yellow-800",
    };

    const statusLabels: Record<string, string> = {
        active: "Đang làm việc",
        inactive: "Đã nghỉ việc",
        on_leave: "Tạm nghỉ",
    };

    const filteredEmployees = employees.filter((employee) => {
        // Lọc theo phòng ban
        if (departmentFilter && employee.department !== departmentFilter) {
            return false;
        }

        // Lọc theo trạng thái
        if (statusFilter && employee.status !== statusFilter) {
            return false;
        }

        // Tìm kiếm
        if (searchQuery) {
            const searchTerms = searchQuery.toLowerCase();
            return (
                employee.name.toLowerCase().includes(searchTerms) ||
                employee.employeeId.toLowerCase().includes(searchTerms) ||
                employee.email.toLowerCase().includes(searchTerms) ||
                employee.department.toLowerCase().includes(searchTerms) ||
                employee.position.toLowerCase().includes(searchTerms)
            );
        }

        return true;
    });

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
                        <h1 className="text-xl font-bold">Quản lý Nhân viên</h1>
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold">Danh sách nhân viên</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="px-4 py-2 border rounded-md w-full sm:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <select
                            className="px-4 py-2 border rounded-md bg-background"
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                            <option value="">Tất cả phòng ban</option>
                            {departments.map((department) => (
                                <option key={department} value={department}>
                                    {department}
                                </option>
                            ))}
                        </select>

                        <select
                            className="px-4 py-2 border rounded-md bg-background"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Đang làm việc</option>
                            <option value="inactive">Đã nghỉ việc</option>
                            <option value="on_leave">Tạm nghỉ</option>
                        </select>

                        {filteredEmployees.length > 0 && (
                            <button
                                onClick={exportToExcel}
                                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-center"
                            >
                                Xuất Excel
                            </button>
                        )}

                        {session?.user?.role && ["admin", "manager"].includes(session.user.role) && (
                            <Link
                                href="/employees/create"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-center"
                            >
                                Thêm nhân viên
                            </Link>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10">
                        <p>Đang tải danh sách nhân viên...</p>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-10 bg-card border rounded-md">
                        <p className="text-muted-foreground">
                            {employees.length === 0
                                ? "Chưa có nhân viên nào trong hệ thống"
                                : "Không tìm thấy nhân viên nào phù hợp với bộ lọc"}
                        </p>
                        {session?.user?.role && ["admin", "manager"].includes(session.user.role) && employees.length === 0 && (
                            <Link
                                href="/employees/create"
                                className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Thêm nhân viên mới
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="px-4 py-2 text-left border-b">Mã nhân viên</th>
                                    <th className="px-4 py-2 text-left border-b">Họ tên</th>
                                    <th className="px-4 py-2 text-left border-b">Email</th>
                                    <th className="px-4 py-2 text-left border-b">Phòng ban</th>
                                    <th className="px-4 py-2 text-left border-b">Chức vụ</th>
                                    <th className="px-4 py-2 text-left border-b">Trạng thái</th>
                                    <th className="px-4 py-2 text-center border-b">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.map((employee) => (
                                    <tr key={employee._id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 border-b font-mono text-sm">
                                            {employee.employeeId}
                                        </td>
                                        <td className="px-4 py-3 border-b">{employee.name}</td>
                                        <td className="px-4 py-3 border-b">{employee.email}</td>
                                        <td className="px-4 py-3 border-b">{employee.department}</td>
                                        <td className="px-4 py-3 border-b">{employee.position}</td>
                                        <td className="px-4 py-3 border-b">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[employee.status] || "bg-gray-100"
                                                    }`}
                                            >
                                                {statusLabels[employee.status] || employee.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 border-b text-center">
                                            <div className="flex justify-center space-x-2">
                                                <Link
                                                    href={`/employees/${employee._id}`}
                                                    className="px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 text-sm"
                                                >
                                                    Chi tiết
                                                </Link>
                                                {session?.user?.role && ["admin", "manager"].includes(session.user.role) && (
                                                    <>
                                                        <Link
                                                            href={`/employees/${employee._id}/edit`}
                                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                                                        >
                                                            Sửa
                                                        </Link>
                                                        {session.user.role === "admin" && (
                                                            <button
                                                                className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                                                                onClick={() => handleDeleteEmployee(employee._id)}
                                                                disabled={deleting}
                                                            >
                                                                {deleting ? "Đang xóa..." : "Xóa"}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            <footer className="bg-muted py-4">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p>© {new Date().getFullYear()} Hệ thống Quản lý Thiết bị & Tài khoản</p>
                </div>
            </footer>
        </div>
    );
} 