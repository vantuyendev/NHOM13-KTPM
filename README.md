# Hệ Thống Lưu Trữ Dự Án (Nhóm 13 - Công ty X)

## Mục Lục
- [1. Tổng Quan Dự Án](#1-tổng-quan-dự-án)
- [2. Công Nghệ Sử Dụng](#2-công-nghệ-sử-dụng)
- [3. Tính Năng Chính](#3-tính-năng-chính)
- [4. Điều Kiện Tiên Quyết](#4-điều-kiện-tiên-quyết)
- [5. Cài Đặt Và Thiết Lập](#5-cài-đặt-và-thiết-lập)
- [6. Cách Chạy Hệ Thống](#6-cách-chạy-hệ-thống)
- [7. Chạy Kiểm Thử Tự Động](#7-chạy-kiểm-thử-tự-động)
- [8. Tài Khoản Mặc Định / Tài Khoản Demo](#8-tài-khoản-mặc-định--tài-khoản-demo)
- [9. Cấu Trúc Thư Mục](#9-cấu-trúc-thư-mục)
- [10. Ghi Chú Bàn Giao](#10-ghi-chú-bàn-giao)

## 1. Tổng Quan Dự Án
Hệ thống hỗ trợ quản lý dự án nội bộ cho Công ty X, tập trung vào lưu trữ tài liệu, quản lý tác vụ, phân quyền theo vai trò và cộng tác thời gian thực.

Hai tác nhân chính:
- Manager: quản trị dự án, thành viên, phòng ban, nhân sự và toàn bộ nghiệp vụ quản lý.
- Member: tham gia dự án được mời, cập nhật tác vụ, bình luận, quản lý tài liệu trong phạm vi được cấp quyền.

Hệ thống được xây dựng theo mô hình Backend API + Frontend SPA:
- Backend cung cấp JWT auth, RBAC, nghiệp vụ dự án, SignalR realtime.
- Frontend cung cấp giao diện phong cách GitLab, tối ưu cho luồng công việc vận hành hàng ngày.

## 2. Công Nghệ Sử Dụng
- Backend:
	- .NET 10 Web API (tương thích định hướng .NET 8)
	- Entity Framework Core + SQL Server
	- JWT Bearer Authentication
	- SignalR (realtime)
	- MailKit (email reset password)
- Frontend:
	- React + TypeScript
	- Vite
	- Tailwind CSS
	- Axios
- Testing:
	- Backend: xUnit, Moq, EF Core InMemory
	- Frontend: Vitest, Testing Library, jsdom

## 3. Tính Năng Chính
Tổng hợp từ tài liệu yêu cầu trong [tailieu.md](tailieu.md):

- Xác thực và bảo mật:
	- Đăng nhập bằng tài khoản nội bộ công ty.
	- Bắt buộc đổi mật khẩu ở lần đăng nhập đầu.
	- Quên mật khẩu qua email công ty.
- Phân quyền RBAC theo vai trò (Manager/Member):
	- Member chỉ truy cập các dự án được mời.
	- Manager có quyền quản trị dự án, nhân sự, phòng ban.
- Quản lý dự án và tác vụ:
	- CRUD dự án, tác vụ, thành viên dự án.
	- Theo dõi trạng thái tác vụ, deadline, lịch sử cập nhật.
- Quản lý tài liệu với ràng buộc dung lượng 20MB:
	- File <= 20MB: lưu nội bộ (Internal Storage).
	- File > 20MB: bắt buộc cung cấp Cloud URL (fallback cloud storage).
- Cộng tác thời gian thực:
	- Bình luận tác vụ cập nhật realtime qua SignalR, không cần tải lại trang.
	- Sự kiện thay đổi trạng thái task được đẩy theo project group.
- Tìm kiếm toàn cục:
	- Tìm kiếm dự án, người dùng, tài liệu từ top navbar.
- Giao diện:
	- UI phong cách GitLab, sidebar + topbar rõ ràng, phù hợp workflow quản lý dự án.

Các chỉ tiêu phi chức năng nổi bật:
- Thời gian phản hồi thao tác trung bình <= 1s.
- Tải file < 20MB mục tiêu <= 2s.
- Hệ thống hướng tới cập nhật trạng thái và bình luận gần thời gian thực.

## 4. Điều Kiện Tiên Quyết
Cần cài đặt các thành phần sau:
- .NET SDK 10.x (hoặc 8.x nếu bạn điều chỉnh package/framework tương ứng)
- SQL Server (hoặc SQL Server Express)
- Node.js >= 18
- npm >= 9
- EF Core CLI:

```bash
dotnet tool install --global dotnet-ef
```

## 5. Cài Đặt Và Thiết Lập

### 5.1 Thiết Lập Database
1. Cập nhật chuỗi kết nối trong [src/Nhom13.ProjectStorage.Api/appsettings.json](src/Nhom13.ProjectStorage.Api/appsettings.json):

```json
"ConnectionStrings": {
	"DefaultConnection": "Server=localhost;Database=Nhom13ProjectStorage;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
}
```

2. Áp dụng migration:

```bash
cd src/Nhom13.ProjectStorage.Api
dotnet ef database update
```

3. (Khuyến nghị) cập nhật SMTP trong cùng file để dùng chức năng quên mật khẩu.

### 5.2 Thiết Lập Backend
```bash
cd src/Nhom13.ProjectStorage.Api
dotnet restore
dotnet build
```

### 5.3 Thiết Lập Frontend
```bash
cd frontend
npm install
```

## 6. Cách Chạy Hệ Thống

### Cách 1: Chạy đồng thời từ thư mục gốc bằng `npm run dev` (concurrently)
Tạo file `package.json` ở thư mục gốc nếu chưa có:

```json
{
	"name": "nhom13-ktpm-root",
	"private": true,
	"scripts": {
		"dev": "concurrently \"npm:dev:api\" \"npm:dev:web\"",
		"dev:api": "cd src/Nhom13.ProjectStorage.Api && dotnet run",
		"dev:web": "cd frontend && npm run dev"
	},
	"devDependencies": {
		"concurrently": "^9.0.1"
	}
}
```

Sau đó:

```bash
cd /workspaces/NHOM13-KTPM
npm install
npm run dev
```

Kết quả mong đợi:
- Backend chạy mặc định tại `https://localhost:5001` (hoặc theo profile).
- Frontend chạy tại `http://localhost:3000`.

### Cách 2: Chạy thủ công bằng 2 terminal
Terminal 1:

```bash
cd src/Nhom13.ProjectStorage.Api
dotnet run
```

Terminal 2:

```bash
cd frontend
npm run dev
```

## 7. Chạy Kiểm Thử Tự Động

### Backend (xUnit)
```bash
cd src/Nhom13.ProjectStorage.Tests
dotnet test
```

Các test nghiệp vụ quan trọng hiện có:
- [src/Nhom13.ProjectStorage.Tests/Services/DocumentServiceTests.cs](src/Nhom13.ProjectStorage.Tests/Services/DocumentServiceTests.cs): kiểm tra rule file > 20MB phải dùng Cloud URL.
- [src/Nhom13.ProjectStorage.Tests/Services/TaskServiceTests.cs](src/Nhom13.ProjectStorage.Tests/Services/TaskServiceTests.cs): kiểm tra user ngoài project không được sửa task.

### Frontend (Vitest)
```bash
cd frontend
npm test
```

Test UI logic hiện có:
- [frontend/src/components/__tests__/DocumentUploadModal.test.tsx](frontend/src/components/__tests__/DocumentUploadModal.test.tsx): kiểm tra hiển thị cảnh báo và ô Cloud URL khi upload file > 20MB.

## 8. Tài Khoản Mặc Định / Tài Khoản Demo
Hiện tại migration chỉ seed vai trò (`Manager`, `Member`), chưa seed sẵn user đăng nhập.

Để demo nhanh, tạo 2 tài khoản mẫu qua API quản lý user hoặc SQL seeding:
- Manager demo:
	- Email: `manager@company.com`
	- Password: `Manager@123`
	- Role: `Manager`
- Member demo:
	- Email: `member@company.com`
	- Password: `Member@123`
	- Role: `Member`

Lưu ý:
- User mới tạo mặc định có thể bị yêu cầu đổi mật khẩu ở lần đăng nhập đầu.
- Nếu tạo bằng SQL trực tiếp, cần lưu mật khẩu dưới dạng BCrypt hash đúng chuẩn của backend.

## 9. Cấu Trúc Thư Mục
```text
NHOM13-KTPM/
|-- src/
|   |-- Nhom13.ProjectStorage.Api/        # Backend .NET API
|   |-- Nhom13.ProjectStorage.Tests/      # Backend tests xUnit
|   `-- Nhom13.ProjectStorage.slnx        # Solution backend
|-- frontend/                             # React + Vite + Tailwind
|-- images/                               # Tài nguyên hình ảnh tài liệu
|-- tailieu.md                            # Tài liệu đặc tả yêu cầu
`-- README.md                             # Tài liệu bàn giao
```

## 10. Ghi Chú Bàn Giao
- Nếu đổi domain/port backend, cập nhật `baseURL` trong frontend API client.
- Với môi trường production, cần:
	- Thay JWT SecretKey mạnh và quản lý qua biến môi trường.
	- Cấu hình CORS, HTTPS certificate, SMTP thật.
	- Triển khai logging + backup/restore dữ liệu theo quy trình vận hành.
- Khuyến nghị bổ sung CI pipeline chạy:
	- `dotnet test` cho backend.
	- `npm test` và `npm run build` cho frontend.