"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Invoice {
    _id: string;
    invoiceNumber: string;
    vendor: string;
    purchaseDate: string;
    totalAmount: number;
    currency: string;
    status: string;
    items: Array<{
        type: string;
        name: string;
        quantity: number;
        unitPrice: number;
        processed?: boolean;
    }>;
    notes?: string;
    createdBy: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
    updatedAt: string;
}

export default function InvoicesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Status labels for display
    const statusLabels: Record<string, string> = {
        pending: "Chờ xử lý",
        processed: "Đã xử lý",
        cancelled: "Đã hủy",
    };

    // Status colors for display
    const statusColors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800",
        processed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            fetchInvoices();
        }
    }, [status, router, searchQuery, filterStatus, currentPage]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            let url = `/api/invoices?page=${currentPage}`;

            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }

            if (filterStatus) {
                url += `&status=${encodeURIComponent(filterStatus)}`;
            }

            const response = await axios.get(url);
            setInvoices(response.data.invoices || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page on new search
        fetchInvoices();
    };

    // Format currency with thousand separators
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString("vi-VN");
    };

    // Get the count of processed and total items
    const getProcessedItemCount = (invoice: Invoice) => {
        const processed = invoice.items.filter((item) => item.processed).length;
        const total = invoice.items.length;
        return `${processed}/${total}`;
    };

    // Calculate the total quantity of devices and components
    const getDeviceComponentCounts = (invoice: Invoice) => {
        const counts = { device: 0, component: 0 };
        invoice.items.forEach((item) => {
            if (item.type === "device") {
                counts.device += item.quantity;
            } else if (item.type === "component") {
                counts.component += item.quantity;
            }
        });
        return counts;
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard"
                            className="text-primary-foreground hover:underline"
                        >
                            Dashboard
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Hóa đơn mua hàng</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/devices"
                            className="text-primary-foreground hover:underline"
                        >
                            Thiết bị
                        </Link>
                        <Link
                            href="/components"
                            className="text-primary-foreground hover:underline"
                        >
                            Linh kiện
                        </Link>
                        {session?.user?.name && <span>Xin chào, {session.user.name}</span>}
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
                    <div>
                        <h2 className="text-2xl font-bold">Hóa đơn mua hàng</h2>
                        <p className="text-muted-foreground">
                            Quản lý và xử lý hóa đơn mua thiết bị và linh kiện
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {(session?.user?.role === "admin" ||
                            session?.user?.role === "manager") && (
                                <>
                                    <Link
                                        href="/invoices/import"
                                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm font-medium"
                                    >
                                        Import từ file
                                    </Link>
                                    <Link
                                        href="/invoices/create"
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
                                    >
                                        Thêm hóa đơn mới
                                    </Link>
                                </>
                            )}
                    </div>
                </div>

                <div className="bg-card border rounded-lg overflow-hidden">
                    <div className="p-4 border-b">
                        <form
                            onSubmit={handleSearch}
                            className="flex flex-col md:flex-row gap-3 items-end"
                        >
                            <div className="flex-1">
                                <label htmlFor="search" className="block text-sm font-medium mb-1">
                                    Tìm kiếm
                                </label>
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Số hóa đơn, nhà cung cấp..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div className="w-full md:w-48">
                                <label
                                    htmlFor="status"
                                    className="block text-sm font-medium mb-1"
                                >
                                    Trạng thái
                                </label>
                                <select
                                    id="status"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    <option value="">Tất cả</option>
                                    <option value="pending">Chờ xử lý</option>
                                    <option value="processed">Đã xử lý</option>
                                    <option value="cancelled">Đã hủy</option>
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
                    ) : invoices.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-muted-foreground">
                                Không tìm thấy hóa đơn nào.
                            </p>
                            {(session?.user?.role === "admin" ||
                                session?.user?.role === "manager") && (
                                    <Link
                                        href="/invoices/create"
                                        className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                    >
                                        Thêm hóa đơn mới
                                    </Link>
                                )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-sm">
                                            Hóa đơn
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">
                                            Nhà cung cấp
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">
                                            Ngày mua
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">
                                            Tổng tiền
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">
                                            Thiết bị/Linh kiện
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-sm">
                                            Trạng thái
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium text-sm">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {invoices.map((invoice) => {
                                        const counts = getDeviceComponentCounts(invoice);
                                        return (
                                            <tr key={invoice._id} className="hover:bg-muted/50">
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/invoices/${invoice._id}`}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {invoice.invoiceNumber}
                                                    </Link>
                                                    <div className="text-xs text-muted-foreground">
                                                        Xử lý: {getProcessedItemCount(invoice)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{invoice.vendor}</td>
                                                <td className="px-4 py-3">
                                                    {new Date(invoice.purchaseDate).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {formatCurrency(invoice.totalAmount)}{" "}
                                                    {invoice.currency}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        {counts.device > 0 && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                {counts.device} Thiết bị
                                                            </span>
                                                        )}
                                                        {counts.component > 0 && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                                                {counts.component} Linh kiện
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${statusColors[invoice.status] || "bg-gray-100"
                                                            }`}
                                                    >
                                                        {statusLabels[invoice.status] || invoice.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <Link
                                                            href={`/invoices/${invoice._id}`}
                                                            className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                                                        >
                                                            Chi tiết
                                                        </Link>
                                                        {(session?.user?.role === "admin" ||
                                                            session?.user?.role === "manager") &&
                                                            invoice.status === "pending" && (
                                                                <Link
                                                                    href={`/invoices/${invoice._id}/process`}
                                                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                                                >
                                                                    Xử lý
                                                                </Link>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                    (page) => (
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
                                    )
                                )}

                                <button
                                    onClick={() =>
                                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                    }
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