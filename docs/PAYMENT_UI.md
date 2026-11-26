# Phiếu thu cọc

Route: `/payments/deposit-receipts`. Menu **Phiếu thu cọc** có trên header và menu tài khoản cho OWNER/STAFF.
Dùng AuthService và authInterceptor hiện có; không nhập token thủ công.

## Chạy local

```powershell
npm ci
npx ng serve --proxy-config proxy.payment-local.json --port 4200
```

Đăng nhập OWNER tại http://localhost:4200/login, chọn Phiếu thu cọc.
Auth chạy 8081, Payment 8089, Property 8082. Payment cần trỏ PROPERTY_BASE_URL=http://localhost:8082
và cùng AUTH_INTERNAL_SERVICE_KEY với Auth. Property cũng phải xác thực qua cùng Auth.
Proxy local đưa Auth trực tiếp 8081 và Payment trực tiếp 8089; các API khác vẫn đi Gateway 8080.
Notification/Gateway có thể cần chạy để các chức năng header khác hoạt động.
`npm start` vẫn giữ cấu hình Gateway mặc định; khi dùng cấu hình đó Gateway cần bổ sung
`/api/deposit-receipts,/api/deposit-receipts/**` trỏ PAYMENT-SERVICE.

## Backend cần có

Nhánh BE `feature/quoc/deposit-receipts` phải chứa bản OWNER verification đã test trên máy Quốc
(57 tests PASS), không chỉ bản tạo phiếu ban đầu của PR #26.

- POST `/api/deposit-receipts`: OWNER/STAFF tạo phiếu bằng holdId, amount, paymentMethod, evidenceUrl.
- GET `/api/deposit-receipts/{receiptId}/rental-eligibility`: đọc phiếu và điều kiện hiện tại.
- POST `/api/deposit-receipts/{receiptId}/verify`: OWNER xác minh, body `{}`.

Backend kiểm tra quyền thực tế; FE chỉ hỗ trợ điều hướng/ẩn nút.
Không gửi customerId/propertyId/collectedBy từ form; Backend lấy từ Hold và JWT.

## Demo

1. Đăng nhập OWNER bằng tài khoản Auth đang dùng cho Property.
2. Nhập Hold ID hợp lệ, số tiền nguyên dương, phương thức, tùy chọn chứng từ. Bấm Tạo phiếu thu.
3. Receipt ID được tự điền. Bấm Kiểm tra cho Rental: REPORTED, verified=false, eligible=false.
4. Bấm OWNER xác minh phiếu; xem mã phiếu và số tiền tải từ Backend, xác nhận thực nhận tiền.
5. Bấm Kiểm tra cho Rental: OWNER_VERIFIED, verified=true; eligible=true nếu Hold còn hợp lệ.
6. STAFF có thể tạo/tra cứu theo phạm vi phân công, không có nút xác minh.

Không có API list phiếu/Hold trên contract Payment đang dùng, nên chưa có danh sách chọn Hold hay danh sách phiếu.
Có thể truyền `?holdId=UUID` hoặc `?receiptId=UUID` khi liên kết từ màn hình Property/Rental.
Không tự liên kết receipt với hợp đồng; Rental chịu trách nhiệm đối chiếu dữ liệu và unique receiptId.
