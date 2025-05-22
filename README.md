# Hệ thống Quản lý Thiết bị & Tài khoản

Hệ thống quản lý thiết bị CNTT và tài khoản cho doanh nghiệp, giúp theo dõi, phân bổ và bảo trì thiết bị cũng như quản lý các tài khoản dịch vụ.

## Tính năng

- **Quản lý Thiết bị**: Máy tính, máy in, màn hình, v.v.
- **Quản lý Linh kiện**: Linh kiện máy tính, tai nghe, USB, thiết bị ngoại vi, v.v.
- **Quản lý Tài khoản**: VPN, email, cloud, GitHub, Jira, access key, v.v.
- **Quản lý Nhân viên**: Thông tin nhân viên và phân bổ tài sản
- **Báo cáo và Thống kê**: Tổng quan về thiết bị và tài khoản

## Yêu cầu hệ thống

- Node.js 18.0 trở lên
- MongoDB 4.4 trở lên

## Cài đặt

1. Clone repository:
   ```bash
   git clone <repository-url>
   cd device-management
   ```

2. Cài đặt các dependencies:
   ```bash
   npm install
   ```

3. Tạo file `.env.local` với nội dung sau:
   ```
   MONGODB_URI=mongodb://localhost:27017/device-management
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. Khởi động ứng dụng ở môi trường phát triển:
   ```bash
   npm run dev
   ```

5. Truy cập ứng dụng tại http://localhost:3000

## Sơ đồ Database

### Device (Thiết bị)
- name: Tên thiết bị
- type: Loại thiết bị (computer, printer, monitor, v.v.)
- serialNumber: Số sê-ri
- manufacturer: Nhà sản xuất
- model: Model
- purchaseDate: Ngày mua
- warrantyExpiryDate: Ngày hết hạn bảo hành
- status: Trạng thái (in_use, available, under_repair, disposed)
- location: Vị trí
- assignedTo: Nhân viên được gán
- specs: Thông số kỹ thuật
- notes: Ghi chú

### Component (Linh kiện)
- name: Tên linh kiện
- type: Loại linh kiện (ram, storage, cpu, gpu, headphone, usb, v.v.)
- serialNumber: Số sê-ri
- manufacturer: Nhà sản xuất
- model: Model
- purchaseDate: Ngày mua
- warrantyExpiryDate: Ngày hết hạn bảo hành
- status: Trạng thái (in_use, available, under_repair, disposed)
- location: Vị trí
- assignedTo: Nhân viên được gán
- installedIn: Thiết bị được lắp vào
- specs: Thông số kỹ thuật
- notes: Ghi chú

### Account (Tài khoản)
- name: Tên tài khoản
- type: Loại tài khoản (email, vpn, cloud, github, jira, access_key, v.v.)
- username: Tên đăng nhập
- password: Mật khẩu (được mã hóa)
- serviceProvider: Nhà cung cấp dịch vụ
- url: URL dịch vụ
- expiryDate: Ngày hết hạn
- status: Trạng thái (active, inactive, expired)
- assignedTo: Nhân viên được gán
- accessLevel: Cấp độ truy cập
- notes: Ghi chú

### Employee (Nhân viên)
- name: Tên nhân viên
- employeeId: Mã nhân viên
- email: Email
- department: Phòng ban
- position: Chức vụ
- hireDate: Ngày tuyển dụng
- status: Trạng thái (active, inactive, on_leave)
- contactNumber: Số điện thoại
- assignedDevices: Danh sách thiết bị được gán
- assignedAccounts: Danh sách tài khoản được gán

### User (Người dùng hệ thống)
- name: Tên người dùng
- email: Email
- password: Mật khẩu (được mã hóa)
- role: Vai trò (admin, manager, user)
- employee: Liên kết với nhân viên
- isActive: Trạng thái hoạt động
- lastLogin: Lần đăng nhập cuối

## License

MIT # Add your Azure AD credentials here
# AZURE_AD_CLIENT_ID=your-azure-client-id
# AZURE_AD_CLIENT_SECRET=your-azure-client-secret
# AZURE_AD_TENANT_ID=your-azure-tenant-id


```
.env.local
```

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/device-management

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ITfK4TxeK5aFJN8TSOZbYFNr6jJBOCaGDN9zHEPsRdQ=

# Add your Azure AD credentials here if needed
# AZURE_AD_CLIENT_ID=your-azure-client-id
# AZURE_AD_CLIENT_SECRET=your-azure-client-secret
# AZURE_AD_TENANT_ID=your-azure-tenant-id

# OpenAI API Configuration
OPENAI_API_KEY=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
```
