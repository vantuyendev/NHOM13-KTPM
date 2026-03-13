#!/usr/bin/env bash
# =============================================================
# NHOM13-KTPM — Chạy toàn bộ hệ thống với 1 lệnh duy nhất
# =============================================================
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/src/Nhom13.ProjectStorage.Api"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── Màu sắc terminal ─────────────────────────────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║        NHOM13-KTPM  —  Khởi động hệ thống           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Kiểm tra điều kiện tiên quyết ────────────────────────────
command -v dotnet >/dev/null 2>&1 || { echo -e "${RED}[LỖI] Chưa cài .NET SDK. Tải tại: https://dotnet.microsoft.com/download${NC}"; exit 1; }
command -v node  >/dev/null 2>&1 || { echo -e "${RED}[LỖI] Chưa cài Node.js. Tải tại: https://nodejs.org${NC}"; exit 1; }
command -v npm   >/dev/null 2>&1 || { echo -e "${RED}[LỖI] Chưa cài npm.${NC}"; exit 1; }

# ── Cài thư viện frontend nếu chưa có ─────────────────────────
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}[INFO] Đang cài đặt frontend dependencies...${NC}"
  (cd "$FRONTEND_DIR" && npm install --silent)
fi

# ── Dọn dẹp khi thoát (Ctrl+C) ────────────────────────────────
cleanup() {
  echo -e "\n${YELLOW}[INFO] Đang dừng hệ thống...${NC}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${GREEN}[OK] Đã dừng toàn bộ tiến trình.${NC}"
  exit 0
}
trap cleanup INT TERM

# ── Khởi động Backend ─────────────────────────────────────────
echo -e "${CYAN}[1/2] Khởi động Backend (.NET API) → http://localhost:5175${NC}"
LOG_BACKEND="$ROOT_DIR/.backend.log"
(cd "$BACKEND_DIR" && dotnet run --launch-profile http 2>&1) > "$LOG_BACKEND" &
BACKEND_PID=$!

# Chờ backend sẵn sàng (tối đa 30 giây)
echo -n "      Đang chờ backend khởi động"
for i in $(seq 1 30); do
  sleep 1
  echo -n "."
  if curl -s http://localhost:5175/ >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC}"
    break
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo -e "\n${RED}[LỖI] Backend thoát sớm. Xem log: $LOG_BACKEND${NC}"
    cat "$LOG_BACKEND" | tail -20
    exit 1
  fi
  if [ "$i" -eq 30 ]; then
    echo -e "\n${YELLOW}[WARN] Backend chưa phản hồi sau 30s — tiếp tục khởi động frontend.${NC}"
  fi
done

# ── Khởi động Frontend ────────────────────────────────────────
echo -e "${CYAN}[2/2] Khởi động Frontend (Vite)     → http://localhost:3000${NC}"
LOG_FRONTEND="$ROOT_DIR/.frontend.log"
(cd "$FRONTEND_DIR" && npm run dev 2>&1) > "$LOG_FRONTEND" &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅  Hệ thống đã khởi động thành công!               ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Frontend  →  http://localhost:3000                  ║${NC}"
echo -e "${GREEN}║  Backend   →  http://localhost:5175                  ║${NC}"
echo -e "${GREEN}║  API Docs  →  http://localhost:5175/swagger          ║${NC}"
echo -e "${GREEN}║                                                      ║${NC}"
echo -e "${GREEN}║  Nhấn Ctrl+C để dừng toàn bộ hệ thống               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Giữ script sống & in log realtime
tail -f "$LOG_BACKEND" "$LOG_FRONTEND" &
TAIL_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
kill "$TAIL_PID" 2>/dev/null || true
