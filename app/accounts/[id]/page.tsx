"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
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
    notes?: string;
    lastPasswordChangeDate?: string;
}

// Cấu trúc phân loại tài khoản theo cấp bậc
const accountTypesHierarchy = [
    // Tài khoản phát triển
    { value: "development", label: "Tài khoản phát triển", category: "development", subOptions: [
        { value: "github", label: "GitHub" },
        { value: "gitlab", label: "GitLab" },
        { value: "bitbucket", label: "Bitbucket" },
        { value: "npm", label: "NPM" },
        { value: "docker", label: "Docker Hub" }
    ]},
    
    // Tài khoản quản lý dự án
    { value: "project_management", label: "Tài khoản quản lý dự án", category: "management", subOptions: [
        { value: "jira", label: "Jira" },
        { value: "trello", label: "Trello" },
        { value: "asana", label: "Asana" },
        { value: "confluence", label: "Confluence" },
        { value: "notion", label: "Notion" }
    ]},
    
    // Tài khoản Cloud
    { value: "cloud_service", label: "Tài khoản dịch vụ Cloud", category: "infrastructure", subOptions: [
        { value: "aws", label: "Amazon Web Services" },
        { value: "azure", label: "Microsoft Azure" },
        { value: "gcp", label: "Google Cloud Platform" },
        { value: "digitalocean", label: "DigitalOcean" },
        { value: "heroku", label: "Heroku" }
    ]},
    
    // Tài khoản truy cập mạng
    { value: "network_access", label: "Tài khoản truy cập mạng", category: "security", subOptions: [
        { value: "vpn", label: "VPN" },
        { value: "ssh", label: "SSH" },
        { value: "rdp", label: "Remote Desktop" },
        { value: "sftp", label: "SFTP" }
    ]},
    
    // Tài khoản email và liên lạc
    { value: "communication", label: "Tài khoản liên lạc", category: "communication", subOptions: [
        { value: "email", label: "Email" },
        { value: "slack", label: "Slack" },
        { value: "teams", label: "Microsoft Teams" },
        { value: "discord", label: "Discord" }
    ]},
    
    // Tài khoản khác
    { value: "other", label: "Tài khoản khác", category: "other" }
];

// Hàm helper để lấy nhãn hiển thị cho loại tài khoản
const getDetailedAccountTypeLabel = (type: string, subType?: string) => {
    if (!type) return "-";
    
    const mainType = accountTypesHierarchy.find(t => t.value === type);
    if (!mainType) return getAccountTypeLabel(type);
    
    // Nếu có subType, tìm nhãn tương ứng
    if (subType) {
        const subTypeOption = mainType.subOptions?.find(sub => sub.value === subType);
        if (subTypeOption) {
            return `${mainType.label} - ${subTypeOption.label}`;
        }
    }
    
    return mainType.label;
};

export default function AccountDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const accountId = params.id as string;

    const [account, setAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            // Kiểm tra quyền hạn
            if (!session.user.role || !["admin", "manager"].includes(session.user.role)) {
                router.push("/dashboard");
                return;
            }

            fetchAccountDetails();
        }
    }, [status, session, router, accountId]);

    const fetchAccountDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/accounts/${accountId}`);
            setAccount(response.data);
            setError("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể tải thông tin tài khoản");
            console.error("Error fetching account details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await axios.delete(`/api/accounts/${accountId}`);
            router.push("/accounts");
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể xóa tài khoản");
            console.error("Error deleting account:", err);
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const getAccountTypeLabel = (type: string) => {
        const accountTypes: Record<string, string> = {
            vpn: "VPN",
            github: "GitHub",
            bitbucket: "Bitbucket",
            jira: "Jira",
            confluence: "Confluence",
            aws: "AWS",
            azure: "Azure",
            gcp: "GCP",
            other: "Khác",
        };
        return accountTypes[type] || type;
    };

    const getStatusLabel = (status: string) => {
        const statusMap: Record<string, string> = {
            active: "Hoạt động",
            inactive: "Không hoạt động",
            expired: "Hết hạn",
        };
        return statusMap[status] || status;
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

    const getSecurityLevelLabel = (level?: string) => {
        if (!level) return "Không xác định";
        const securityMap: Record<string, string> = {
            low: "Thấp",
            medium: "Trung bình",
            high: "Cao",
        };
        return securityMap[level] || level;
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

    const isAdmin = session?.user?.role === "admin";

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
                        <Link href="/accounts" className="text-primary-foreground hover:underline">
                            Quản lý tài khoản
                        </Link>
                        <span>/</span>
                        <h1 className="text-xl font-bold">Chi tiết tài khoản</h1>
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
                    {error && (
                        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
                            {error}
                        </div>
                    )}

                    {account && (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{account.name}</h2>
                                <div className="flex space-x-2">
                                    <Link
                                        href={`/accounts/${accountId}/edit`}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                    >
                                        Chỉnh sửa
                                    </Link>
                                    {isAdmin && (
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                        >
                                            Xóa
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="bg-card border rounded-lg overflow-hidden mb-6">
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-lg font-medium mb-4">Thông tin cơ bản</h3>
                                            <dl className="space-y-2">
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Tên tài khoản:</dt>
                                                    <dd className="font-medium">{account.name}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Loại tài khoản:</dt>
                                                    <dd>{getDetailedAccountTypeLabel(account.type, account.subType)}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Tên người dùng:</dt>
                                                    <dd>{account.username}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Trạng thái:</dt>
                                                    <dd>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(account.status)}`}>
                                                            {getStatusLabel(account.status)}
                                                        </span>
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Mức bảo mật:</dt>
                                                    <dd>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${getSecurityLevelColor(account.securityLevel)}`}>
                                                            {getSecurityLevelLabel(account.securityLevel)}
                                                        </span>
                                                    </dd>
                                                </div>
                                                {account.url && (
                                                    <div className="flex justify-between">
                                                        <dt className="text-muted-foreground">URL:</dt>
                                                        <dd>
                                                            <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                                {account.url}
                                                            </a>
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-medium mb-4">Thông tin bổ sung</h3>
                                            <dl className="space-y-2">
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Ngày hết hạn:</dt>
                                                    <dd>{formatDate(account.expiryDate)}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Ngày thay đổi mật khẩu gần nhất:</dt>
                                                    <dd>{formatDate(account.lastPasswordChangeDate)}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Tổ chức:</dt>
                                                    <dd>{account.organization || "N/A"}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Phòng ban:</dt>
                                                    <dd>{account.department || "N/A"}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Mã dự án:</dt>
                                                    <dd>{account.projectId || "N/A"}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Gán cho nhân viên:</dt>
                                                    <dd>{account.assignedTo ? account.assignedTo.name : "Không có"}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </div>

                                    {account.notes && (
                                        <div className="mt-6">
                                            <h3 className="text-lg font-medium mb-2">Ghi chú</h3>
                                            <div className="p-4 bg-muted rounded-md">
                                                <p className="whitespace-pre-line">{account.notes}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-6 border-t pt-4">
                                        <h3 className="text-lg font-medium mb-2">Thông tin hệ thống</h3>
                                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Ngày tạo:</dt>
                                                <dd>{formatDate(account.createdAt)}</dd>
                                            </div>
                                            <div className="flex justify-between">
                                                <dt className="text-muted-foreground">Cập nhật lần cuối:</dt>
                                                <dd>{formatDate(account.updatedAt)}</dd>
                                            </div>
                                        </dl>
                                    </div>
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

            {/* Modal xác nhận xóa */}
            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-background p-6 rounded-lg max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Xác nhận xóa</h3>
                        <p>Bạn có chắc chắn muốn xóa tài khoản <strong>{account?.name}</strong>? Hành động này không thể hoàn tác.</p>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border rounded-md hover:bg-muted"
                                disabled={deleting}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-70"
                                disabled={deleting}
                            >
                                {deleting ? "Đang xử lý..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}