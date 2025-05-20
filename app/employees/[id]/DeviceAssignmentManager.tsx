"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface Device {
    _id: string;
    name: string;
    type: string;
    serialNumber: string;
    status: string;
    assignedTo?: any;
}

interface DeviceAssignmentManagerProps {
    employeeId: string;
    onAssign: (device: Device) => void;
    onDismiss: () => void;
}

export default function DeviceAssignmentManager({ employeeId, onAssign, onDismiss }: DeviceAssignmentManagerProps) {
    const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDevice, setSelectedDevice] = useState("");

    useEffect(() => {
        fetchAvailableDevices();
    }, []);

    const fetchAvailableDevices = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/devices?status=available");
            setAvailableDevices(response.data.devices || []);
        } catch (err) {
            console.error("Error fetching available devices:", err);
            setError("Không thể tải danh sách thiết bị khả dụng");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedDevice) {
            setError("Vui lòng chọn thiết bị");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`/api/employees/${employeeId}/assign`, {
                action: "assign",
                assetType: "device",
                assetId: selectedDevice
            });

            if (response.data.success) {
                onAssign(response.data.data);
                onDismiss();
            }
        } catch (err: any) {
            console.error("Error assigning device:", err);
            setError(err.response?.data?.error || "Không thể gán thiết bị");
        } finally {
            setLoading(false);
        }
    };

    const filteredDevices = availableDevices.filter(device =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col flex-1 max-h-[calc(90vh-100px)] overflow-hidden">
            <div className="p-4 flex-shrink-0">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tìm kiếm thiết bị..."
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
                ) : filteredDevices.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                        {searchQuery ? "Không tìm thấy thiết bị phù hợp" : "Không có thiết bị khả dụng"}
                    </div>
                ) : (
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="w-10 px-4 py-2 text-left font-medium"></th>
                                    <th className="px-4 py-2 text-left font-medium">Tên thiết bị</th>
                                    <th className="px-4 py-2 text-left font-medium">Loại</th>
                                    <th className="px-4 py-2 text-left font-medium">Số serial</th>
                                    <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredDevices.map((device) => (
                                    <tr 
                                        key={device._id} 
                                        className={`hover:bg-muted/30 ${selectedDevice === device._id ? 'bg-muted/40' : ''}`}
                                        onClick={() => setSelectedDevice(device._id)}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="radio"
                                                name="selectedDevice"
                                                checked={selectedDevice === device._id}
                                                onChange={() => setSelectedDevice(device._id)}
                                            />
                                        </td>
                                        <td className="px-4 py-3">{device.name}</td>
                                        <td className="px-4 py-3 capitalize">{device.type}</td>
                                        <td className="px-4 py-3">{device.serialNumber}</td>
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
                    disabled={!selectedDevice || loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading ? "Đang xử lý..." : "Gán thiết bị"}
                </button>
            </div>
        </div>
    );
}