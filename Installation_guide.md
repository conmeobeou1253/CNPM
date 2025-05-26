Dưới đây là **Installation Guide** (Hướng dẫn cài đặt) cho cả frontend và backend của hệ thống chấm điểm bài luận tự động:

---

## 🚀 **Installation Guide**

### 1. **Backend (Flask + Python)**

#### **Yêu cầu:**
- Python 3.8+
- pip

#### **Các bước cài đặt:**

```bash
# 1. Di chuyển vào thư mục backend
cd "Code backend"

# 2. Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# 3. Tải mô hình ngôn ngữ cho spaCy (chỉ cần chạy 1 lần)
python -m spacy download en_core_web_sm

# 4. Chạy server backend
python app.py
```

- **Server backend** sẽ chạy ở địa chỉ: `http://localhost:5050`

---

### 2. **Frontend (Next.js + React)**

#### **Yêu cầu:**
- Node.js (khuyên dùng bản LTS, ví dụ 18.x hoặc 20.x)
- npm hoặc yarn

#### **Các bước cài đặt:**

```bash
# 1. Di chuyển vào thư mục frontend
cd essay-grading-automator

# 1.2. Tạo file .env với tham số :
NEXT_PUBLIC_API_URL="http://localhost:5000"
# 2. Cài đặt các package cần thiết
npm install next@latest react@latest react-dom@latest --force
# hoặc nếu dùng yarn:
# yarn install

# 3. Chạy ứng dụng frontend (dev mode)
npm run build && npm run dev
# hoặc
# yarn dev
```

- **Frontend** sẽ chạy ở địa chỉ: `http://localhost:3000`  
- Có thể cấu hình lại endpoint API backend trong file cấu hình (nếu cần).

---

### 3. **Lưu ý chung**
- Đảm bảo backend chạy trước, frontend sẽ gọi API backend.
- Nếu frontend và backend chạy trên các port khác nhau, có thể cần cấu hình CORS (đã bật sẵn trong Flask).
- Nếu deploy lên server, cần cấu hình biến môi trường cho endpoint backend.

---

### 4. **Tóm tắt thư mục**
| Thư mục                  | Chức năng                |
|--------------------------|--------------------------|
| `Code backend/`          | Backend Flask (Python)   |
| `essay-grading-automator/` | Frontend Next.js (React) |

---


