"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Component {
    _id: string;
    name: string;
    type: string;
    serialNumber?: string;
    manufacturer: string;
    model: string;
    status: string;
    assignedTo?: {
        _id: string;
        name: string;
        employeeId: string;
        email: string;
    };
    installedIn?: {
        _id: string;
        name: string;
        serialNumber: string;
        type: string;
    };
}

export default function ComponentsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [components, setComponents] = useState<Component[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Loại linh kiện
    const componentTypes = [
        { value: 'ram', label: 'RAM' },
        { value: 'storage', label: 'Ổ cứng / SSD' },
        { value: 'cpu', label: 'CPU' },
        { value: 'gpu', label: 'Card đồ họa' },
        { value: 'motherboard', label: 'Bo mạch chủ' },
        { value: 'power_supply', label: 'Nguồn' },
        { value: 'cooling', label: 'Tản nhiệt' },
        { value: 'peripheral', label: 'Thiết bị ngoại vi' },
        { value: 'cable', label: 'Cáp / Adapter' },
        { value: 'network', label: 'Thiết bị mạng' },
        { value: 'other', label: 'Khác' },
    ];

    // Trạng thái linh kiện
    const componentStatuses = [
        { value: 'in_use', label: 'Đang sử dụng' },
        { value: 'available', label: 'Khả dụng' },
        { value: 'under_repair', label: 'Đang sửa chữa' },
        { value: 'disposed', label: 'Đã thanh lý' },
    ];

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchComponents();
        }
    }, [status, searchQuery, filterType, filterStatus, currentPage]);

    const fetchComponents = async () => {
        try {
            setLoading(true);
            let url = `/api/components?page=${currentPage}`;

            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }

            if (filterType) {
                url += `&type=${encodeURIComponent(filterType)}`;
            }

            if (filterStatus) {
                url += `&status=${encodeURIComponent(filterStatus)}`;
            }

            const response = await axios.get(url);
            setComponents(response.data.components || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error("Error fetching components:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page on new search
        fetchComponents();
    };

    const getComponentTypeName = (type: string) => {
        const foundType = componentTypes.find(t => t.value === type);
        return foundType ? foundType.label : type;
    };

    const getStatusName = (status: string) => {
        const foundStatus = componentStatuses.find(s => s.value === status);
        return foundStatus ? foundStatus.label : status;
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'in_use':
                return 'bg-blue-100 text-blue-800';
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'under_repair':
                return 'bg-yellow-100 text-yellow-800';
            case 'disposed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-primary-foreground hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Quản lý linh kiện</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/devices" className="text-primary-foreground hover:underline">
                            Thiết bị
                        </Link>
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
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-2xl font-bold">Danh sách linh kiện</h2>

                    <div className="flex gap-2">
                        {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
                            <Link
                                href="/components/create"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
                            >
                                Thêm linh kiện mới
                            </Link>
                        )}
                    </div>
                </div>

                <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="p-4 border-b">
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex-1">
                                <label htmlFor="search" className="block text-sm font-medium mb-1">
                                    Tìm kiếm
                                </label>
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Tên, serial, nhà sản xuất..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="w-full md:w-48">
                                <label htmlFor="type" className="block text-sm font-medium mb-1">
                                    Loại linh kiện
                                </label>
                                <select
                                    id="type"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    <option value="">Tất cả</option>
                                    {componentTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full md:w-48">
                                <label htmlFor="status" className="block text-sm font-medium mb-1">
                                    Trạng thái
                                </label>
                                <select
                                    id="status"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    <option value="">Tất cả</option>
                                    {componentStatuses.map((status) => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                                Tìm kiếm
                            </button>
                        </form>
                    </div>

                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <p className="text-muted-foreground">Đang tải...</p>
                        </div>
                    ) : components.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">Không tìm thấy linh kiện nào.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-sm">Tên linh kiện</th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">Loại</th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">Serial / Model</th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">Nhà sản xuất</th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">Trạng thái</th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">Gán cho / Lắp vào</th>
                                        <th className="px-4 py-3 text-center font-medium text-sm">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {components.map((component) => (
                                        <tr key={component._id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <Link href={`/components/${component._id}`} className="font-medium hover:underline">
                                                    {component.name}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">{getComponentTypeName(component.type)}</td>
                                            <td className="px-4 py-3">
                                                {component.serialNumber ? (
                                                    <>
                                                        <div>{component.serialNumber}</div>
                                                        <div className="text-xs text-muted-foreground">{component.model}</div>
                                                    </>
                                                ) : (
                                                    <div>{component.model}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">{component.manufacturer}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(component.status)}`}>
                                                    {getStatusName(component.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {component.assignedTo ? (
                                                    <Link href={`/employees/${component.assignedTo._id}`} className="hover:underline">
                                                        {component.assignedTo.name}
                                                    </Link>
                                                ) : component.installedIn ? (
                                                    <Link href={`/devices/${component.installedIn._id}`} className="hover:underline">
                                                        {component.installedIn.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <Link
                                                        href={`/components/${component._id}`}
                                                        className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                                                    >
                                                        Chi tiết
                                                    </Link>
                                                    {(session?.user?.role === 'admin' || session?.user?.role === 'manager') && (
                                                        <Link
                                                            href={`/components/${component._id}/edit`}
                                                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/80"
                                                        >
                                                            Sửa
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t flex justify-center">
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded border disabled:opacity-50"
                                >
                                    &lt;
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 rounded border ${currentPage === page
                                            ? "bg-primary text-primary-foreground"
                                            : "hover:bg-muted"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded border disabled:opacity-50"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    )}
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