# Property Management · Thiện · Phase 1

Các file trong thư mục này chỉ sử dụng API thật của Property Service:

- `GET /api/properties`
- `GET /api/properties/{id}`
- `POST /api/properties`

Các API này được chuyển qua Angular proxy đến API Gateway `http://localhost:8080`, không gọi trực tiếp `8082` từ trình duyệt. `ownerGuard` bảo vệ route; Auth interceptor của nhóm gắn JWT.

Chức năng: danh sách khu trọ, tìm kiếm, phân trang, chi tiết, tạo khu trọ, trạng thái loading/error, Unit Test. Không có nút sửa/xóa vì Backend chưa có API update/delete.

Chạy `apply-property-ui.ps1` ở thư mục gốc để bổ sung route và link vào Header. File script chỉ thêm route/link theo chuỗi đã kiểm tra, không sửa Auth/Service của Quân.
