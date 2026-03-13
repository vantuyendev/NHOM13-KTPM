# Hệ Thống Lưu Trữ Dự Án (Nhóm 13 - KTPM)

> Hệ thống quản lý dự án nội bộ cho Công ty X — Backend .NET 10 + Frontend React/Vite + SQLite (zero-config).

---

## Mục Lục

- [🚀 Chạy Nhanh (1 Lệnh Duy Nhất)](#-chạy-nhanh-1-lệnh-duy-nhất)
- [1. Tổng Quan Dự Án](#1-tổng-quan-dự-án)
- [2. Công Nghệ Sử Dụng](#2-công-nghệ-sử-dụng)
- [3. Tính Năng Chính](#3-tính-năng-chính)
- [4. Điều Kiện Tiên Quyết](#4-điều-kiện-tiên-quyết)
- [5. Cách Chạy Hệ Thống](#5-cách-chạy-hệ-thống)
- [6. Chạy Kiểm Thử Tự Động](#6-chạy-kiểm-thử-tự-động)
- [7. Tài Khoản Demo](#7-tài-khoản-demo)
- [8. Cấu Trúc Thư Mục](#8-cấu-trúc-thư-mục)
- [9. Ghi Chú Bàn Giao](#9-ghi-chú-bàn-giao)

---

## 🚀 Chạy Nhanh (1 Lệnh Duy Nhất)

> **Yêu cầu tối thiểu:** [.NET SDK 10](https://dotnet.microsoft.com/download) và [Node.js ≥ 18](https://nodejs.org) đã được cài đặt.

```bash
bash start.sh
```

Script tự động:
1. Kiểm tra `.NET SDK` và `Node.js`.
2. Cài đặt frontend dependencies nếu chưa có (`npm install`).
3. Khởi động **Backend API** tại `http://localhost:5175`.
4. Khởi động **Frontend** tại `http://localhost:3000`.
5. In log realtime của cả hai dịch vụ.
6. Nhấn **Ctrl+C** để dừng toàn bộ hệ thống.

| Dịch vụ | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:5175 |
| **Swagger API Docs** | http://localhost:5175/swagger |

> **Database:** SQLite — tự động tạo file `nhom13_project_storage.db` ngay khi backend khởi động lần đầu. Không cần cấu hình thêm.

---

## 1. Tổng Quan Dự Án

Hệ thống hỗ trợ quản lý dự án nội bộ cho Công ty X, tập trung vào lưu trữ tài liệu, quản lý tác vụ, phân quyền theo vai trò và cộng tác thời gian thực.

**Hai tác nhân chính:**
- **Manager:** quản trị dự án, thành viên, phòng ban, nhân sự và toàn bộ nghiệp vụ quản lý.
- **Member:** tham gia dự án được mời, cập nhật tác vụ, bình luận, quản lý tài liệu trong phạm vi được cấp quyền.

**Kiến trúc:** Backend REST API + Frontend SPA, giao tiếp qua Axios + SignalR realtime.

---

## 2. Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|---|---|
| **Backend** | .NET 10 Web API, Entity Framework Core, SQLite |
| **Auth** | JWT Bearer, RBAC (Manager / Member) |
| **Realtime** | SignalR |
| **Email** | MailKit (SMTP — cấu hình tuỳ chọn) |
| **Frontend** | React 19 + TypeScript, Vite 7, Tailwind CSS 4 |
| **HTTP Client** | Axios |
| **Test Backend** | xUnit, Moq, EF Core InMemory |
| **Test Frontend** | Vitest, Testing Library, jsdom |

---

## 3. Tính Năng Chính

**Xác thực & Bảo mật**
- Đăng nhập bằng tài khoản nội bộ công ty.
- Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.
- Quên mật khẩu qua email công ty.

**Phân quyền RBAC**
- Member chỉ truy cập các dự án được mời.
- Manager có toàn quyền quản trị dự án, nhân sự, phòng ban.

**Quản lý Dự Án & Tác Vụ**
- CRUD dự án, tác vụ, thành viên dự án.
- Theo dõi trạng thái tác vụ, deadline, lịch sử cập nhật.

**Quản lý Tài Liệu (giới hạn 20 MB)**
- File ≤ 20 MB: lưu nội bộ (Internal Storage).
- File > 20 MB: bắt buộc cung cấp Cloud URL.

**Cộng tác Thời Gian Thực**
- Bình luận tác vụ cập nhật realtime qua SignalR, không cần tải lại trang.
- Sự kiện thay đổi trạng thái task được đẩy theo project group.

**Tìm Kiếm Toàn Cục**
- Tìm kiếm dự án, người dùng, tài liệu từ top navbar.

**Chỉ tiêu phi chức năng:** thời gian phản hồi trung bình ≤ 1s; tải file < 20 MB mục tiêu ≤ 2s.

---

## 4. Điều Kiện Tiên Quyết

| Phần mềm | Phiên bản tối thiểu | Tải về |
|---|---|---|
| .NET SDK | 10.x | https://dotnet.microsoft.com/download |
| Node.js | 18.x | https://nodejs.org |
| npm | 9.x | đi kèm Node.js |

> **Không cần SQL Server, không cần Docker.** Database SQLite được tạo tự động.

---

## 5. Cách Chạy Hệ Thống

### ✅ Cách khuyến nghị — 1 lệnh duy nhất

```bash
# Clone dự án (nếu chưa có)
git clone https://github.com/vantuyendev/NHOM13-KTPM.git
cd NHOM13-KTPM

# Chạy toàn bộ hệ thống
bash start.sh
```

Sau vài giây, mở trình duyệt tại **http://localhost:3000**.

---

### Cách thủ công — 2 terminal riêng

**Terminal 1 — Backend:**
```bash
cd src/Nhom13.ProjectStorage.Api
dotnet run --launch-profile http
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install   # chỉ cần lần đầu
npm run dev
```

---

## 6. Chạy Kiểm Thử Tự Động

### Backend (xUnit)
```bash
cd src/Nhom13.ProjectStorage.Tests
dotnet test
```

Các test nghiệp vụ quan trọng:
- [src/Nhom13.ProjectStorage.Tests/Services/DocumentServiceTests.cs](src/Nhom13.ProjectStorage.Tests/Services/DocumentServiceTests.cs) — kiểm tra rule file > 20 MB phải dùng Cloud URL.
- [src/Nhom13.ProjectStorage.Tests/Services/TaskServiceTests.cs](src/Nhom13.ProjectStorage.Tests/Services/TaskServiceTests.cs) — kiểm tra user ngoài project không được sửa task.

### Frontend (Vitest)
```bash
cd frontend
npm test
```

Test UI logic:
- [frontend/src/components/__tests__/DocumentUploadModal.test.tsx](frontend/src/components/__tests__/DocumentUploadModal.test.tsx) — kiểm tra hiển thị cảnh báo và ô Cloud URL khi upload file > 20 MB.

---

## 7. Tài Khoản Demo

Tạo tài khoản demo qua API `/api/users` sau khi hệ thống khởi động:

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Manager | `manager@company.com` | `Manager@123` |
| Member | `member@company.com` | `Member@123` |

> User mới tạo sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên.

---

## 8. Cấu Trúc Thư Mục

```text
NHOM13-KTPM/
├── start.sh                              # ← Script chạy 1 lệnh duy nhất
├── src/
│   ├── Nhom13.ProjectStorage.Api/        # Backend .NET 10 Web API
│   │   ├── API/Controllers/              # REST Controllers
│   │   ├── API/Hubs/                     # SignalR Hub
│   │   ├── Application/DTOs/             # Data Transfer Objects
│   │   ├── Application/Services/         # JWT, Email services
│   │   ├── Domain/Entities/              # Domain models
│   │   └── Infrastructure/               # EF Core, Repositories
│   ├── Nhom13.ProjectStorage.Tests/      # Backend tests xUnit
│   └── Nhom13.ProjectStorage.slnx        # Solution file
├── frontend/                             # React + Vite + Tailwind CSS
│   ├── src/components/                   # UI components
│   ├── src/pages/                        # Trang Dashboard, Project, ...
│   ├── src/services/api.ts               # Axios API client
│   └── src/types/                        # TypeScript types
├── Dockerfile                            # Docker build backend
├── render.yaml                           # Cấu hình deploy Render.com
└── README.md
```

---

## 9. Ghi Chú Bàn Giao

- **Database:** SQLite (`nhom13_project_storage.db`) được tạo tự động tại thư mục backend. Để reset dữ liệu, xoá file `.db` rồi chạy lại.
- **Frontend proxy:** Vite proxy `/api` và `/hubs` sang `http://localhost:5175`. Nếu đổi port backend, cập nhật `vite.config.ts`.
- **Môi trường production:**
  - Thay `JwtSettings.SecretKey` bằng chuỗi mạnh, quản lý qua biến môi trường.
  - Cấu hình CORS, HTTPS và SMTP thật trong `appsettings.json`.
  - Triển khai backup định kỳ cho file SQLite.
- **CI/CD khuyến nghị:** chạy `dotnet test` và `npm test && npm run build` trước mỗi lần merge.