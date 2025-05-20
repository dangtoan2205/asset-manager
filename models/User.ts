import mongoose, { Schema, models, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
    name: string;
    email: string;
    password?: string; // Optional for OAuth users
    role: string; // 'admin', 'manager', 'user'
    employee?: Schema.Types.ObjectId; // Liên kết với nhân viên (nếu có)
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    provider?: string; // 'credentials' or 'azure-ad'
    providerAccountId?: string; // For Azure AD, this would be the ObjectID from Azure
}

const userSchema = new Schema<IUser & { comparePassword(candidatePassword: string): Promise<boolean> }>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false }, // Not required for OAuth users
        role: {
            type: String,
            enum: ['admin', 'manager', 'user'],
            default: 'user',
            required: true
        },
        employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
        provider: { type: String, enum: ['credentials', 'azure-ad'] },
        providerAccountId: { type: String },
    },
    {
        timestamps: true,
    }
);

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
    // Only hash the password if it exists and has been modified
    if (!this.password || !this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (candidatePassword: string) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

// Sửa cách model được đăng ký
const User = models.User || model<IUser & { comparePassword(candidatePassword: string): Promise<boolean> }>('User', userSchema);

export default User;