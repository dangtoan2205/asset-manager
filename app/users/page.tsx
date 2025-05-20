"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin?: string;
    provider?: string;
    employee?: {
        _id: string;
        name: string;
        employeeId: string;
    };
    createdAt: string;
}

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if (session?.user?.role !== "admin") {
                router.push("/dashboard");
            } else {
                fetchUsers();
            }
        }
    }, [status, router, session]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/users");
            setUsers(response.data.users);
            setError("");
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.response?.data?.error || "Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (user: User) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        try {
            await axios.delete(`/api/users/${userToDelete._id}`);
            setUsers(users.filter((user) => user._id !== userToDelete._id));
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (err: any) {
            console.error("Error deleting user:", err);
            setError(err.response?.data?.error || "Không thể xóa người dùng");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await axios.patch(`/api/users/${id}`, {
                isActive: !currentStatus
            });
            
            setUsers(users.map(user => 
                user._id === id ? { ...user, isActive: !currentStatus } : user
            ));
        } catch (err: any) {
            console.error("Error updating user status:", err);
            setError(err.response?.data?.error || "Không thể cập nhật trạng thái người dùng");
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        const matchesStatus = statusFilter === 'active' ? user.isActive : 
                            statusFilter === 'inactive' ? !user.isActive : true;
        
        return matchesSearch && matchesRole && matchesStatus;
    });

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Chưa đăng nhập";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

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
                        <h1 className="text-xl font-bold">Quản lý người dùng</h1>
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
                    <h2 className="text-2xl font-bold">Người dùng hệ thống</h2>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                            href="/users/create"
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Thêm người dùng
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
                        <p>{error}</p>
                    </div>
                )}

                <div className="bg-card border rounded-lg shadow-sm p-6 mb-6">
                    <h3 className="text-lg font-medium mb-4">Tìm kiếm & Lọc</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tìm kiếm</label>
                            <input
                                type="text"
                                className="w-full border rounded-md p-2"
                                placeholder="Tên, Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Vai trò</label>
                            <select
                                className="w-full border rounded-md p-2 bg-background"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="admin">Quản trị viên</option>
                                <option value="manager">Quản lý</option>
                                <option value="user">Người dùng</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Trạng thái</label>
                            <select
                                className="w-full border rounded-md p-2 bg-background"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Bị vô hiệu hóa</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Tên người dùng</th>
                                    <th className="px-4 py-3 text-left font-medium">Email</th>
                                    <th className="px-4 py-3 text-left font-medium">Vai trò</th>
                                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                                    <th className="px-4 py-3 text-left font-medium">Lần cuối đăng nhập</th>
                                    <th className="px-4 py-3 text-left font-medium">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    {user.employee && (
                                                        <p className="text-xs text-muted-foreground">
                                                            NV: {user.employee.name} ({user.employee.employeeId})
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{user.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    user.role === 'admin' 
                                                        ? 'bg-red-100 text-red-800' 
                                                        : user.role === 'manager'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {user.role === 'admin' 
                                                        ? 'Quản trị viên' 
                                                        : user.role === 'manager'
                                                        ? 'Quản lý'
                                                        : 'Người dùng'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    user.isActive 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {user.isActive ? 'Đang hoạt động' : 'Bị vô hiệu hóa'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {formatDate(user.lastLogin)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <Link href={`/users/${user._id}/edit`} className="text-primary hover:underline text-sm">
                                                        Chỉnh sửa
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleToggleStatus(user._id, user.isActive)} 
                                                        className="text-yellow-600 hover:underline text-sm"
                                                    >
                                                        {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                    </button>
                                                    {user._id !== session?.user?.id && (
                                                        <button 
                                                            onClick={() => confirmDelete(user)} 
                                                            className="text-destructive hover:underline text-sm"
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                                            Không tìm thấy người dùng nào phù hợp với bộ lọc
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-lg shadow-lg w-full max-w-md">
                        <div className="p-4 border-b">
                            <h3 className="text-lg font-semibold">Xác nhận xóa</h3>
                        </div>
                        <div className="p-4">
                            <p>Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{userToDelete.name}</span>?</p>
                            <p className="mt-2 text-sm text-muted-foreground">Hành động này không thể hoàn tác.</p>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-muted py-4">
                <div className="container mx-auto text-center text-muted-foreground text-sm">
                    <p>© {new Date().getFullYear()} Hệ thống Quản lý Thiết bị & Tài khoản</p>
                </div>
            </footer>
        </div>
    );
}
