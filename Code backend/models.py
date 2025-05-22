from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # 'teacher' hoặc 'student'

class Essay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text, nullable=False)
    criteria = db.Column(db.Text, nullable=False)  # JSON string
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    teacher = db.relationship('User', backref=db.backref('essays', lazy=True))

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    essay_id = db.Column(db.Integer, db.ForeignKey('essay.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    suggested_score = db.Column(db.Float)
    final_score = db.Column(db.Float)
    feedback = db.Column(db.Text)
    essay = db.relationship('Essay', backref=db.backref('submissions', lazy=True))
    student = db.relationship('User', backref=db.backref('submissions', lazy=True), foreign_keys=[student_id])

class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    essay_id = db.Column(db.Integer, db.ForeignKey('essay.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    deadline = db.Column(db.DateTime, nullable=True)  # Thêm trường deadline
    essay = db.relationship('Essay', backref=db.backref('assignments', lazy=True))
    teacher = db.relationship('User', backref=db.backref('assignments', lazy=True), foreign_keys=[teacher_id])

class EssayDraft(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    essay_id = db.Column(db.Integer, db.ForeignKey('essay.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=True)
    last_saved = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    essay = db.relationship('Essay', backref=db.backref('drafts', lazy=True))
    student = db.relationship('User', backref=db.backref('drafts', lazy=True), foreign_keys=[student_id]) 