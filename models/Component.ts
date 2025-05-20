import mongoose, { Schema, models, model } from 'mongoose';

export interface IComponent {
    name: string;
    type: string; // Loại linh kiện chính (category)
    subType?: string; // Loại con của linh kiện (subcategory)
    category?: string; // Nhóm linh kiện (high-level category)
    serialNumber?: string;
    manufacturer: string;
    model: string;
    purchaseDate: Date;
    warrantyExpiryDate?: Date;
    status: string; // 'in_use', 'available', 'under_repair', 'disposed'
    location?: string;
    assignedTo?: Schema.Types.ObjectId;
    installedIn?: Schema.Types.ObjectId; // Reference to Device
    specs?: {
        [key: string]: any; // Thông số kỹ thuật linh hoạt
    };
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const componentSchema = new Schema<IComponent>(
    {
        name: { type: String, required: true },
        type: { type: String, required: true },
        subType: { type: String },
        category: { type: String },
        serialNumber: { type: String },
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
        installedIn: { type: Schema.Types.ObjectId, ref: 'Device' },
        specs: { type: Map, of: Schema.Types.Mixed },
        notes: { type: String },
    },
    {
        timestamps: true,
    }
);

// Tạo index để tìm kiếm nhanh hơn
componentSchema.index({ name: 'text', serialNumber: 'text', manufacturer: 'text', model: 'text', type: 'text', subType: 'text', category: 'text' });

// Sửa cách model được đăng ký
const Component = models.Component || model<IComponent>('Component', componentSchema);

export default Component;