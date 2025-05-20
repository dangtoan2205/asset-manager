import mongoose from 'mongoose';

// Import tất cả các models
import './Account';
import './Component';
import './Device';
import './Employee';
import './Invoice';
import './User';

// Cấu hình Mongoose
mongoose.set('strictQuery', true);

// Export các model để có thể sử dụng trong toàn bộ ứng dụng
export { default as Account } from './Account';
export { default as Component } from './Component';
export { default as Device } from './Device';
export { default as Employee } from './Employee';
export { default as Invoice } from './Invoice';
export { default as User } from './User';