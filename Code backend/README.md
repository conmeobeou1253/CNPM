# Automated Essay Grading Tool - Backend

## Cài đặt

```bash
cd "Code backend"
pip install -r requirements.txt
python -m spacy download en_core_web_sm  # Nếu dùng spaCy
```

## Chạy server

```bash
python app.py
```

## Mô tả API chính

- `POST /register` — Đăng ký tài khoản (username, password, role)
- `POST /login` — Đăng nhập (username, password)
- `POST /essays` — (Teacher) Tạo bài luận mới (question, criteria)
- `GET /essays` — Lấy danh sách bài luận
- `POST /essays/<essay_id>/submissions` — (Student) Nộp bài
- `GET /essays/<essay_id>/submissions` — (Teacher) Xem bài nộp
- `POST /submissions/<id>/grade` — Chấm điểm tự động
- `POST /submissions/<id>/feedback` — Gửi feedback & điểm cuối
- `GET /submissions/<id>` — Xem chi tiết bài nộp

## Ghi chú
- DB: SQLite, file `essay_grading.db` sẽ tự tạo khi chạy lần đầu
- Grading engine: Dùng spaCy/NLTK kiểm tra tiêu chí cơ bản 