import mongoose, { Schema, models, model } from 'mongoose';

export interface IDevice {
    name: string;
    type: string; // Loại thiết bị chính (category)
    subType?: string; // Loại con (subcategory)
    category?: string; // Nhóm thiết bị (high-level category)
    serialNumber: string;
    manufacturer: string;
    model: string;
    purchaseDate: Date;
    warrantyExpiryDate?: Date;
    status: string; // 'in_use', 'available', 'under_repair', 'disposed'
    location?: string;
    assignedTo?: Schema.Types.ObjectId;
    specs?: {
        [key: string]: any; // Thông số kỹ thuật linh hoạt
    };
    notes?: string;
    lastMaintenanceDate?: Date;
    nextMaintenanceDate?: Date;
    maintenanceHistory?: {
        date: Date;
        description: string;
        technician: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const deviceSchema = new Schema<IDevice>(
    {
        name: { type: String, required: true },
        type: { type: String, required: true },
        subType: { type: String },
        category: { type: String },
        serialNumber: { type: String, required: true, unique: true },
        manufacturer: { type: String, required: true },
        model: { type: String, required: true },
        purchaseDate: { type: Date, required: true },
        warrantyExpiryDate: { type: Date },
        status: {
            type: String,
            enum: ['in_use', 'available', 'under_repair', 'disposed'],
            default: 'available',
            required: true
        },
        location: { type: String },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
        specs: { type: Object }, // Changed from Map to Object to match the frontend data structure
        notes: { type: String },
        lastMaintenanceDate: { type: Date },
        nextMaintenanceDate: { type: Date },
        maintenanceHistory: [{
            date: { type: Date, required: true },
            description: { type: String, required: true },
            technician: { type: String, required: true }
        }]
    },
    {
        timestamps: true,
    }
);

// Tạo index để tìm kiếm nhanh hơn
deviceSchema.index({ name: 'text', serialNumber: 'text', manufacturer: 'text', model: 'text', type: 'text', subType: 'text', category: 'text' });

// Sửa cách model được đăng ký
const Device = models.Device || model<IDevice>('Device', deviceSchema);

export default Device;