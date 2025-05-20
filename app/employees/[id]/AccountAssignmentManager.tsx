"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Account {
    _id: string;
    name: string;
    type: string;
    username: string;
    status: string;
    assignedTo?: any;
}

interface AccountAssignmentManagerProps {
    employeeId: string;
    onAssign: (account: Account) => void;
    onDismiss: () => void;
}

export default function AccountAssignmentManager({ employeeId, onAssign, onDismiss }: AccountAssignmentManagerProps) {
    const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAccount, setSelectedAccount] = useState("");

    useEffect(() => {
        fetchAvailableAccounts();
    }, []);

    const fetchAvailableAccounts = async () => {
        try {
            setLoading(true);
            // Tìm tài khoản chưa được gán
            const response = await axios.get("/api/accounts?unassigned=true");
            setAvailableAccounts(response.data.accounts || []);
        } catch (err) {
            console.error("Error fetching available accounts:", err);
            setError("Không thể tải danh sách tài khoản khả dụng");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedAccount) {
            setError("Vui lòng chọn tài khoản");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`/api/employees/${employeeId}/assign`, {
                action: "assign",
                assetType: "account",
                assetId: selectedAccount
            });

            if (response.data.success) {
                onAssign(response.data.data);
                onDismiss();
            }
        } catch (err: any) {
            console.error("Error assigning account:", err);
            setError(err.response?.data?.error || "Không thể gán tài khoản");
        } finally {
            setLoading(false);
        }
    };

    const filteredAccounts = availableAccounts.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col flex-1 max-h-[calc(90vh-100px)] overflow-hidden">
            <div className="p-4 flex-shrink-0">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm tài khoản..."
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                        {error}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto p-4 pt-0">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <p>Đang tải...</p>
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                        {searchQuery ? "Không tìm thấy tài khoản phù hợp" : "Không có tài khoản khả dụng"}
                    </div>
                ) : (
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="w-10 px-4 py-2 text-left font-medium"></th>
                                    <th className="px-4 py-2 text-left font-medium">Tên tài khoản</th>
                                    <th className="px-4 py-2 text-left font-medium">Loại</th>
                                    <th className="px-4 py-2 text-left font-medium">Tên người dùng</th>
                                    <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredAccounts.map((account) => (
                                    <tr 
                                        key={account._id} 
                                        className={`hover:bg-muted/30 ${selectedAccount === account._id ? 'bg-muted/40' : ''}`}
                                        onClick={() => setSelectedAccount(account._id)}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="radio"
                                                name="selectedAccount"
                                                checked={selectedAccount === account._id}
                                                onChange={() => setSelectedAccount(account._id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">{account.name}</td>
                                        <td className="px-4 py-3 capitalize">{account.type}</td>
                                        <td className="px-4 py-3">{account.username}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                account.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : account.status === 'inactive'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {account.status === 'active' 
                                                    ? 'Hoạt động' 
                                                    : account.status === 'inactive'
                                                    ? 'Không hoạt động'
                                                    : 'Hết hạn'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="p-4 border-t flex justify-end gap-2 flex-shrink-0">
                <button
                    onClick={onDismiss}
                    className="px-4 py-2 border rounded-md hover:bg-muted"
                >
                    Hủy
                </button>
                <button
                    onClick={handleAssign}
                    disabled={!selectedAccount || loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading ? "Đang xử lý..." : "Gán tài khoản"}
                </button>
            </div>
        </div>
    );
}