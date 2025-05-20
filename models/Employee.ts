import mongoose, { Schema, models, model } from 'mongoose';

export interface IEmployee {
    name: string;
    employeeId: string;
    email: string;
    department: string;
    position: string;
    phone?: string;
    status: string; // 'active', 'inactive', 'on_leave'
    joinDate: Date;
    leaveDate?: Date;
    manager?: Schema.Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
    {
        name: { type: String, required: true },
        employeeId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        department: { type: String, required: true },
        position: { type: String, required: true },
        phone: { type: String },
        status: {
            type: String,
            enum: ['active', 'inactive', 'on_leave'],
            default: 'active',
            required: true
        },
        joinDate: { type: Date, required: true },
        leaveDate: { type: Date },
        manager: { type: Schema.Types.ObjectId, ref: 'Employee' },
        notes: { type: String },
    },
    {
        timestamps: true,
    }
);

// Tạo index để tìm kiếm nhân viên nhanh hơn
employeeSchema.index({ name: 'text', employeeId: 'text', email: 'text' });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

// Sửa cách model được đăng ký để đảm bảo model không được đăng ký lại
const Employee = models.Employee || model<IEmployee>('Employee', employeeSchema);

export default Employee;