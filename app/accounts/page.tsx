"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

interface Account {
    _id: string;
    name: string;
    type: string;
    subType?: string;
    category?: string;
    username: string;
    url?: string;
    expiryDate?: string;
    assignedTo?: {
        _id: string;
        name: string;
        employeeId: string;
        email: string;
        department: string;
    };
    status: string;
    securityLevel?: string;
    organization?: string;
    department?: string;
    projectId?: string;
    createdAt: string;
    updatedAt: string;
}

export default function AccountsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalAccounts, setTotalAccounts] = useState(0);

    // Danh sách các loại tài khoản với cấu trúc phân loại mới
    const accountTypes = [
        { value: "", label: "Tất cả" },
        // Tài khoản mạng và VPN
        { value: "network_access", label: "Tài khoản truy cập mạng", category: "network", subOptions: [
            { value: "vpn", label: "VPN" },
            { value: "network_device", label: "Thiết bị mạng" },
            { value: "wifi", label: "WiFi/Mạng không dây" }
        ]},
        
        // Tài khoản quản lý mã nguồn
        { value: "code_repository", label: "Quản lý mã nguồn", category: "development", subOptions: [
            { value: "github", label: "GitHub" },
            { value: "gitlab", label: "GitLab" },
            { value: "bitbucket", label: "Bitbucket" },
            { value: "azure_devops", label: "Azure DevOps" }
        ]},
        
        // Tài khoản quản lý dự án
        { value: "project_management", label: "Quản lý dự án", category: "management", subOptions: [
            { value: "jira", label: "Jira" },
            { value: "confluence", label: "Confluence" },
            { value: "trello", label: "Trello" },
            { value: "asana", label: "Asana" },
            { value: "notion", label: "Notion" }
        ]},
        
        // Tài khoản đám mây
        { value: "cloud_service", label: "Dịch vụ đám mây", category: "cloud", subOptions: [
            { value: "aws", label: "Amazon Web Services" },
            { value: "azure", label: "Microsoft Azure" },
            { value: "gcp", label: "Google Cloud Platform" },
            { value: "alibaba_cloud", label: "Alibaba Cloud" },
            { value: "digital_ocean", label: "Digital Ocean" }
        ]},
        
        // Tài khoản giao tiếp và cộng tác
        { value: "communication", label: "Giao tiếp & cộng tác", category: "collaboration", subOptions: [
            { value: "slack", label: "Slack" },
            { value: "microsoft_teams", label: "Microsoft Teams" },
            { value: "zoom", label: "Zoom" },
            { value: "google_workspace", label: "Google Workspace" }
        ]},
        
        // Tài khoản hệ thống nội bộ
        { value: "internal_system", label: "Hệ thống nội bộ", category: "internal" },
        
        // Tài khoản khác
        { value: "other", label: "Khác", category: "other" }
    ];

    // Danh sách trạng thái
    const statusOptions = [
        { value: "", label: "Tất cả" },
        { value: "active", label: "Hoạt động" },
        { value: "inactive", label: "Không hoạt động" },
        { value: "expired", label: "Hết hạn" },
    ];

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Kiểm tra quyền hạn
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }

            fetchAccounts();
        }
    }, [status, session, router, selectedType, selectedStatus, currentPage]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);

            // Xây dựng query parameters
            const params = new URLSearchParams();
            if (selectedType) params.append("type", selectedType);
            if (selectedStatus) params.append("status", selectedStatus);
            if (searchTerm) params.append("search", searchTerm);
            params.append("page", currentPage.toString());
            params.append("limit", "10");

            const response = await axios.get(`/api/accounts?${params.toString()}`);
            const data = response.data;

            setAccounts(data.accounts);
            setTotalPages(data.pagination.pages);
            setTotalAccounts(data.pagination.total);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải danh sách tài khoản");
            console.error("Error fetching accounts:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchAccounts();
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setSelectedType("");
        setSelectedStatus("");
        setCurrentPage(1);
    };

    const getAccountTypeLabel = (account: Account) => {
        // Danh sách các loại tài khoản con
        const allSubOptions: Record<string, string> = {};
        
        // Tạo bảng tra cứu các loại tài khoản con
        accountTypes.forEach(type => {
            if (type.subOptions) {
                type.subOptions.forEach(subOption => {
                    allSubOptions[subOption.value] = subOption.label;
                });
            }
        });
        
        // Nếu có subType và có trong danh sách, ưu tiên hiển thị subType
        if (account.subType && allSubOptions[account.subType]) {
            return allSubOptions[account.subType];
        }
        
        // Nếu không có subType, hiển thị type
        const accountType = accountTypes.find(t => t.value === account.type);
        return accountType ? accountType.label : account.type;
    };

    const getStatusLabel = (status: string) => {
        const statusOption = statusOptions.find(s => s.value === status);
        return statusOption ? statusOption.label : status;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "inactive":
                return "bg-gray-100 text-gray-800";
            case "expired":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getSecurityLevelColor = (level?: string) => {
        switch (level) {
            case "high":
                return "bg-red-100 text-red-800";
            case "medium":
                return "bg-yellow-100 text-yellow-800";
            case "low":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN");
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-primary text-primary-foreground shadow-md">
                <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-primary-foreground hover:underline">
                            Dashboard
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Quản lý tài khoản</h1>
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
                    <h2 className="text-2xl font-bold">Quản lý tài khoản</h2>
                    <Link
                        href="/accounts/create"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Thêm tài khoản mới
                    </Link>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                        {error}
                    </div>
                )}

                <div className="bg-card border rounded-lg p-6 mb-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label htmlFor="searchTerm" className="block text-sm font-medium mb-1">
                                    Tìm kiếm
                                </label>
                                <input
                                    type="text"
                                    id="searchTerm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tên, tên người dùng, tổ chức..."
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                />
                            </div>

                            <div>
                                <label htmlFor="type" className="block text-sm font-medium mb-1">
                                    Loại tài khoản
                                </label>
                                <select
                                    id="type"
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    {accountTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium mb-1">
                                    Trạng thái
                                </label>
                                <select
                                    id="status"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-background"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end space-x-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    Tìm kiếm
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="px-4 py-2 border rounded-md hover:bg-muted"
                                >
                                    Đặt lại
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-card border rounded-lg overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <p className="text-lg">Đang tải...</p>
                        </div>
                    ) : accounts.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-lg">Không tìm thấy tài khoản nào</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Tên</th>
                                            <th className="px-4 py-3 text-left">Loại</th>
                                            <th className="px-4 py-3 text-left">Tên người dùng</th>
                                            <th className="px-4 py-3 text-left">Trạng thái</th>
                                            <th className="px-4 py-3 text-left">Mức bảo mật</th>
                                            <th className="px-4 py-3 text-left">Ngày hết hạn</th>
                                            <th className="px-4 py-3 text-left">Gán cho</th>
                                            <th className="px-4 py-3 text-left">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {accounts.map((account) => (
                                            <tr key={account._id} className="hover:bg-muted/50">
                                                <td className="px-4 py-3">
                                                    <Link href={`/accounts/${account._id}`} className="hover:underline font-medium">
                                                        {account.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3">{getAccountTypeLabel(account)}</td>
                                                <td className="px-4 py-3">{account.username}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(account.status)}`}>
                                                        {getStatusLabel(account.status)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {account.securityLevel ? (
                                                        <span className={`px-2 py-1 rounded-full text-xs ${getSecurityLevelColor(account.securityLevel)}`}>
                                                            {account.securityLevel === "high" ? "Cao" : account.securityLevel === "medium" ? "Trung bình" : "Thấp"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Không có</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{formatDate(account.expiryDate)}</td>
                                                <td className="px-4 py-3">
                                                    {account.assignedTo ? (
                                                        <span>{account.assignedTo.name}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">Không có</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex space-x-2">
                                                        <Link
                                                            href={`/accounts/${account._id}`}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs hover:bg-blue-200"
                                                        >
                                                            Xem
                                                        </Link>
                                                        <Link
                                                            href={`/accounts/${account._id}/edit`}
                                                            className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs hover:bg-amber-200"
                                                        >
                                                            Sửa
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 flex items-center justify-between bg-muted/50">
                                <div className="text-sm text-muted-foreground">
                                    Hiển thị {accounts.length} trong tổng số {totalAccounts} tài khoản
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-2 py-1 rounded-md border hover:bg-muted disabled:opacity-50"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-sm">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-2 py-1 rounded-md border hover:bg-muted disabled:opacity-50"
                                    >
                                        Tiếp
                                    </button>
                                </div>
                            </div>
                        </>
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