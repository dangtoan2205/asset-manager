"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Component {
    _id: string;
    name: string;
    type: string;
    serialNumber: string;
    status: string;
    assignedTo?: any;
}

interface ComponentAssignmentManagerProps {
    employeeId: string;
    onAssign: (component: Component) => void;
    onDismiss: () => void;
}

export default function ComponentAssignmentManager({ employeeId, onAssign, onDismiss }: ComponentAssignmentManagerProps) {
    const [availableComponents, setAvailableComponents] = useState<Component[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedComponent, setSelectedComponent] = useState("");

    useEffect(() => {
        fetchAvailableComponents();
    }, []);

    const fetchAvailableComponents = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/components?status=available");
            setAvailableComponents(response.data.components || []);
        } catch (err) {
            console.error("Error fetching available components:", err);
            setError("Không thể tải danh sách linh kiện khả dụng");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedComponent) {
            setError("Vui lòng chọn linh kiện");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`/api/employees/${employeeId}/assign`, {
                action: "assign",
                assetType: "component",
                assetId: selectedComponent
            });

            if (response.data.success) {
                onAssign(response.data.data);
                onDismiss();
            }
        } catch (err: any) {
            console.error("Error assigning component:", err);
            setError(err.response?.data?.error || "Không thể gán linh kiện");
        } finally {
            setLoading(false);
        }
    };

    const filteredComponents = availableComponents.filter(component =>
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col flex-1 max-h-[calc(90vh-100px)] overflow-hidden">
            <div className="p-4 flex-shrink-0">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm linh kiện..."
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
                ) : filteredComponents.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                        {searchQuery ? "Không tìm thấy linh kiện phù hợp" : "Không có linh kiện khả dụng"}
                    </div>
                ) : (
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="w-10 px-4 py-2 text-left font-medium"></th>
                                    <th className="px-4 py-2 text-left font-medium">Tên linh kiện</th>
                                    <th className="px-4 py-2 text-left font-medium">Loại</th>
                                    <th className="px-4 py-2 text-left font-medium">Số serial</th>
                                    <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredComponents.map((component) => (
                                    <tr 
                                        key={component._id} 
                                        className={`hover:bg-muted/30 ${selectedComponent === component._id ? 'bg-muted/40' : ''}`}
                                        onClick={() => setSelectedComponent(component._id)}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="radio"
                                                name="selectedComponent"
                                                checked={selectedComponent === component._id}
                                                onChange={() => setSelectedComponent(component._id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">{component.name}</td>
                                        <td className="px-4 py-3 capitalize">{component.type}</td>
                                        <td className="px-4 py-3">{component.serialNumber}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                Khả dụng
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
                    disabled={!selectedComponent || loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading ? "Đang xử lý..." : "Gán linh kiện"}
                </button>
            </div>
        </div>
    );
}