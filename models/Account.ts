import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IAccount extends Document {
    name: string;
    type: string;  // Loại tài khoản (primary category)
    subType?: string; // Loại con của tài khoản (subcategory)
    category?: string; // Nhóm tài khoản (high-level category)
    username: string;
    password?: string;
    url?: string;
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: Date;
    assignedTo?: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    lastPasswordChangeDate?: Date;
    status: string; // active, inactive, expired
    securityLevel?: string; // low, medium, high
    organization?: string;
    department?: string;
    projectId?: string;
    assignmentStatus?: string; // available, assigned
}

const AccountSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        type: {
            type: String,
            required: true,
            enum: [
                // Tài khoản mạng và VPN
                'network_access', 'vpn', 'network_device', 'wifi',
                
                // Tài khoản quản lý mã nguồn
                'code_repository', 'github', 'gitlab', 'bitbucket', 'azure_devops',
                
                // Tài khoản quản lý dự án
                'project_management', 'jira', 'confluence', 'trello', 'asana', 'notion',
                
                // Tài khoản đám mây
                'cloud_service', 'aws', 'azure', 'gcp', 'alibaba_cloud', 'digital_ocean',
                
                // Tài khoản giao tiếp và cộng tác
                'communication', 'slack', 'microsoft_teams', 'zoom', 'google_workspace',
                
                // Tài khoản hệ thống nội bộ và khác
                'internal_system', 'other'
            ]
        },
        subType: { type: String },
        category: { type: String },
        username: { type: String, required: true },
        password: { type: String },
        url: { type: String },
        apiKey: { type: String },
        accessToken: { type: String },
        refreshToken: { type: String },
        expiryDate: { type: Date },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
        notes: { type: String },
        lastPasswordChangeDate: { type: Date },
        status: {
            type: String,
            required: true,
            default: 'active',
            enum: ['active', 'inactive', 'expired']
        },
        securityLevel: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        organization: { type: String },
        department: { type: String },
        projectId: { type: String },
        assignmentStatus: {
            type: String,
            default: 'available',
            enum: ['available', 'assigned']
        }
    },
    { timestamps: true }
);

// Đảm bảo không trả về password và các thông tin nhạy cảm trong JSON
AccountSchema.set('toJSON', {
    transform: function (doc, ret, opt) {
        delete ret.password;
        delete ret.apiKey;
        delete ret.accessToken;
        delete ret.refreshToken;
        return ret;
    }
});

// Middleware để tự động cập nhật assignmentStatus dựa trên assignedTo
AccountSchema.pre('save', function(next) {
    if (this.isModified('assignedTo')) {
        this.assignmentStatus = this.assignedTo ? 'assigned' : 'available';
    }
    next();
});

// Sửa cách model được đăng ký
const Account = models.Account || model<IAccount>('Account', AccountSchema);

export default Account;