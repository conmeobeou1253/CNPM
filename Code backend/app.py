from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models import db, User, Essay, Submission, Assignment, EssayDraft
from grading import grade_essay
import os
from werkzeug.security import generate_password_hash, check_password_hash
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Config SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///essay_grading.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

def require_role(*roles):
    def decorator(f):
        def wrapper(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                data = request.get_json(silent=True) or {}
                user_id = data.get('user_id')
            else:
                user_id = request.args.get('user_id')
            user = User.query.get(user_id)
            if not user or user.role not in roles:
                return jsonify({'error': 'Permission denied'}), 403
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# Đăng ký
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password', 'role')):
        return jsonify({'error': 'Missing information'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    user = User(
        username=data['username'],
        password=generate_password_hash(data['password']),
        role=data['role']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Registration successful'})

# Đăng nhập
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        return jsonify({'id': user.id, 'username': user.username, 'role': user.role})
    return jsonify({'error': 'Invalid login information'}), 401

# CRUD ngân hàng đề cho exam_creator và teacher
@app.route('/essays', methods=['POST'])
@require_role('exam_creator', 'teacher')
def create_essay():
    data = request.json
    def normalize_criteria(criteria):
        new_criteria = []
        for c in criteria:
            ctype = c.get('type')
            deduct = float(c.get('deduct', 0.5))
            if ctype == 'contains':
                phrase = c.get('phrase') or c.get('value')
                new_criteria.append({'type': 'contains', 'phrase': phrase, 'deduct': deduct})
            elif ctype == 'min_words':
                count = c.get('count') or c.get('value')
                try:
                    count = int(count)
                except:
                    count = 0
                new_criteria.append({'type': 'min_words', 'count': count, 'deduct': deduct})
            elif ctype == 'has_calculation':
                new_criteria.append({'type': 'has_calculation', 'deduct': deduct})
            else:
                new_criteria.append(c)
        return new_criteria
    norm_criteria = normalize_criteria(data['criteria'])
    essay = Essay(
        question=data['question'],
        criteria=json.dumps(norm_criteria),
        teacher_id=data['user_id'] # id của người tạo (exam_creator hoặc teacher)
    )
    db.session.add(essay)
    db.session.commit()
    return jsonify({'message': 'Essay created successfully', 'essay_id': essay.id})

# Lấy danh sách bài luận
@app.route('/essays', methods=['GET'])
def list_essays():
    essays = Essay.query.all()
    return jsonify([
        {'id': e.id, 'question': e.question, 'criteria': json.loads(e.criteria), 'teacher_id': e.teacher_id}
        for e in essays
    ])

# Lưu nháp bài luận
@app.route('/essays/<int:essay_id>/drafts', methods=['POST'])
def save_draft(essay_id):
    data = request.json
    if not data or not all(k in data for k in ('student_id', 'content')):
        return jsonify({'error': 'Missing information'}), 400
    draft = EssayDraft.query.filter_by(essay_id=essay_id, student_id=data['student_id']).first()
    if not draft:
        draft = EssayDraft(essay_id=essay_id, student_id=data['student_id'])
        db.session.add(draft)
    draft.content = data['content']
    draft.last_saved = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'Draft saved', 'draft_id': draft.id, 'last_saved': draft.last_saved.isoformat()})

# Lấy nháp bài luận
@app.route('/essays/<int:essay_id>/drafts', methods=['GET'])
def get_draft(essay_id):
    student_id = request.args.get('student_id')
    draft = EssayDraft.query.filter_by(essay_id=essay_id, student_id=student_id).first()
    if not draft:
        return jsonify({})
    return jsonify({'draft_id': draft.id, 'content': draft.content, 'last_saved': draft.last_saved.isoformat()})

# Xóa nháp bài luận
@app.route('/essays/<int:essay_id>/drafts', methods=['DELETE'])
def delete_draft(essay_id):
    student_id = request.args.get('student_id')
    draft = EssayDraft.query.filter_by(essay_id=essay_id, student_id=student_id).first()
    if draft:
        db.session.delete(draft)
        db.session.commit()
    return jsonify({'message': 'Draft deleted'})

# Nộp bài (student) - tự động chấm điểm khi nộp, kiểm tra deadline
@app.route('/essays/<int:essay_id>/submissions', methods=['POST'])
def submit_essay(essay_id):
    data = request.json
    if not data or not all(k in data for k in ('student_id', 'content')):
        return jsonify({'error': 'Missing information'}), 400
    # Kiểm tra deadline (nếu có assignment)
    assignment = Assignment.query.filter_by(essay_id=essay_id).first()
    if assignment and assignment.deadline:
        if datetime.utcnow() > assignment.deadline:
            return jsonify({'error': 'Submission is past the deadline'}), 400
    # Tự động grading
    essay = Essay.query.get(essay_id)
    score, reasons = grade_essay(data['content'], essay.criteria)
    auto_feedback = "; ".join(reasons) if reasons else "Good job!"
    submission = Submission(
        essay_id=essay_id,
        student_id=data['student_id'],
        content=data['content'],
        suggested_score=score,
        final_score=None,
        feedback=None,
    )
    submission.feedback = auto_feedback
    db.session.add(submission)
    # Xóa nháp nếu có
    draft = EssayDraft.query.filter_by(essay_id=essay_id, student_id=data['student_id']).first()
    if draft:
        db.session.delete(draft)
    db.session.commit()
    return jsonify({
        'message': 'Submission successful',
        'submission_id': submission.id,
        'suggested_score': score,
        'reasons': reasons,
        'auto_feedback': auto_feedback
    })

# Lấy chi tiết 1 đề
@app.route('/essays/<int:essay_id>', methods=['GET'])
def get_essay(essay_id):
    essay = Essay.query.get(essay_id)
    if not essay:
        return jsonify({'error': 'Essay not found'}), 404
    return jsonify({
        'id': essay.id,
        'question': essay.question,
        'criteria': json.loads(essay.criteria),
        'teacher_id': essay.teacher_id
    })

# Lấy bài nộp của học sinh cho 1 đề (nếu có)
@app.route('/essays/<int:essay_id>/submissions', methods=['GET'])
def list_submissions(essay_id):
    student_id = request.args.get('student_id')
    if student_id:
        submission = Submission.query.filter_by(essay_id=essay_id, student_id=student_id).first()
        if not submission:
            return jsonify({})
        return jsonify({
            'id': submission.id,
            'essay_id': submission.essay_id,
            'student_id': submission.student_id,
            'student_name': submission.student.username,
            'content': submission.content,
            'suggested_score': submission.suggested_score,
            'final_score': submission.final_score,
            'feedback': submission.feedback
        })
    # Nếu không có student_id, trả về tất cả bài nộp như cũ
    submissions = Submission.query.filter_by(essay_id=essay_id).all()
    return jsonify([
        {
            'id': s.id,
            'student_id': s.student_id,
            'student_name': s.student.username,
            'content': s.content,
            'suggested_score': s.suggested_score,
            'final_score': s.final_score,
            'feedback': s.feedback
        }
        for s in submissions
    ])

# Cập nhật bài nộp (cho phép sửa bài)
@app.route('/submissions/<int:submission_id>', methods=['PUT'])
def update_submission(submission_id):
    data = request.json
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    submission.content = data.get('content', submission.content)
    db.session.commit()
    return jsonify({'message': 'Submission updated'})

# Chấm điểm tự động
@app.route('/submissions/<int:submission_id>/grade', methods=['POST'])
def auto_grade(submission_id):
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    essay = Essay.query.get(submission.essay_id)
    score, reasons = grade_essay(submission.content, essay.criteria)
    submission.suggested_score = score
    db.session.commit()
    return jsonify({'suggested_score': score, 'reasons': reasons})

# Gửi feedback & điểm cuối (teacher)
@app.route('/submissions/<int:submission_id>/feedback', methods=['POST'])
def give_feedback(submission_id):
    data = request.json
    submission = Submission.query.get(submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    submission.final_score = data.get('final_score', submission.suggested_score)
    submission.feedback = data.get('feedback', '')
    db.session.commit()
    return jsonify({'message': 'Feedback and final score submitted'})

# Xem chi tiết bài nộp
@app.route('/submissions/<int:submission_id>', methods=['GET'])
def get_submission(submission_id):
    s = Submission.query.get(submission_id)
    if not s:
        return jsonify({'error': 'Submission not found'}), 404
    return jsonify({
        'id': s.id,
        'essay_id': s.essay_id,
        'student_id': s.student_id,
        'student_name': s.student.username,
        'content': s.content,
        'suggested_score': s.suggested_score,
        'final_score': s.final_score,
        'feedback': s.feedback
    })

# Sửa đề bài (exam_creator hoặc teacher)
@app.route('/essays/<int:essay_id>', methods=['PUT'])
@require_role('exam_creator', 'teacher')
def update_essay(essay_id):
    data = request.json
    essay = Essay.query.get(essay_id)
    if not essay:
        return jsonify({'error': 'Essay not found'}), 404
    essay.question = data.get('question', essay.question)
    if 'criteria' in data:
        def normalize_criteria(criteria):
            new_criteria = []
            for c in criteria:
                ctype = c.get('type')
                deduct = float(c.get('deduct', 0.5))
                if ctype == 'contains':
                    phrase = c.get('phrase') or c.get('value')
                    new_criteria.append({'type': 'contains', 'phrase': phrase, 'deduct': deduct})
                elif ctype == 'min_words':
                    count = c.get('count') or c.get('value')
                    try:
                        count = int(count)
                    except:
                        count = 0
                    new_criteria.append({'type': 'min_words', 'count': count, 'deduct': deduct})
                elif ctype == 'has_calculation':
                    new_criteria.append({'type': 'has_calculation', 'deduct': deduct})
                else:
                    new_criteria.append(c)
            return new_criteria
        essay.criteria = json.dumps(normalize_criteria(data['criteria']))
    db.session.commit()
    return jsonify({'message': 'Essay updated', 'id': essay.id})

# Xóa đề bài (exam_creator hoặc teacher)
@app.route('/essays/<int:essay_id>', methods=['DELETE'])
@require_role('exam_creator', 'teacher')
def delete_essay(essay_id):
    essay = Essay.query.get(essay_id)
    if not essay:
        return jsonify({'error': 'Essay not found'}), 404
    db.session.delete(essay)
    db.session.commit()
    return jsonify({'message': 'Essay deleted', 'id': essay_id})

# Teacher tạo assignment (giao đề cho học sinh/lớp)
@app.route('/assignments', methods=['POST'])
@require_role('teacher')
def create_assignment():
    data = request.json
    deadline = None
    if 'deadline' in data:
        try:
            deadline = datetime.fromisoformat(data['deadline'])
        except Exception:
            return jsonify({'error': 'Invalid deadline format'}), 400
    assignment = Assignment(
        essay_id=data['essay_id'],
        teacher_id=data['user_id'],
        deadline=deadline
    )
    db.session.add(assignment)
    db.session.commit()
    return jsonify({'message': 'Assignment created', 'assignment_id': assignment.id})

# Lấy danh sách assignment của teacher
@app.route('/assignments', methods=['GET'])
@require_role('teacher')
def list_assignments():
    teacher_id = request.args.get('user_id')
    assignments = Assignment.query.filter_by(teacher_id=teacher_id).all()
    return jsonify([
        {
            'id': a.id,
            'essay_id': a.essay_id,
            'question': a.essay.question,
            'teacher_id': a.teacher_id,
            'teacher_name': a.teacher.username
        } for a in assignments
    ])

# Admin xem danh sách user
@app.route('/users', methods=['GET'])
@require_role('admin')
def list_users():
    users = User.query.all()
    return jsonify([
        {'id': u.id, 'username': u.username, 'role': u.role} for u in users
    ])

# Admin xóa user
@app.route('/users/<int:user_id>', methods=['DELETE'])
@require_role('admin')
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted', 'id': user_id})

# Admin tạo user mới
@app.route('/users', methods=['POST'])
@require_role('admin')
def create_user():
    data = request.json
    if not data or not all(k in data for k in ('username', 'password', 'role')):
        return jsonify({'error': 'Missing information'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    user = User(
        username=data['username'],
        password=generate_password_hash(data['password']),
        role=data['role']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created', 'id': user.id})

# Admin sửa thông tin user
@app.route('/users/<int:user_id>', methods=['PUT'])
@require_role('admin')
def update_user(user_id):
    data = request.json
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if 'username' in data:
        user.username = data['username']
    if 'role' in data:
        user.role = data['role']
    if 'password' in data:
        user.password = generate_password_hash(data['password'])
    db.session.commit()
    return jsonify({'message': 'User updated', 'id': user.id})

# Sửa assignment (teacher)
@app.route('/assignments/<int:assignment_id>', methods=['PUT'])
@require_role('teacher')
def update_assignment(assignment_id):
    data = request.json
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    if 'essay_id' in data:
        assignment.essay_id = data['essay_id']
    db.session.commit()
    return jsonify({'message': 'Assignment updated', 'id': assignment.id})

# Xóa assignment (teacher)
@app.route('/assignments/<int:assignment_id>', methods=['DELETE'])
@require_role('teacher')
def delete_assignment(assignment_id):
    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'error': 'Assignment not found'}), 404
    db.session.delete(assignment)
    db.session.commit()
    return jsonify({'message': 'Assignment deleted', 'id': assignment_id})

# Student xem assignment được giao
@app.route('/assignments/for_student', methods=['GET'])
def assignments_for_student():
    student_id = request.args.get('student_id')
    # Hiện tại: trả về tất cả assignment (có thể mở rộng theo class/group sau)
    assignments = Assignment.query.all()
    return jsonify([
        {
            'id': a.id,
            'essay_id': a.essay_id,
            'question': a.essay.question,
            'teacher_id': a.teacher_id,
            'teacher_name': a.teacher.username
        } for a in assignments
    ])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 