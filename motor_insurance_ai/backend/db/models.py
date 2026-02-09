from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, func
# Use SQLAlchemy's JSON type (PostgreSQL-only deployment required)
from sqlalchemy import JSON as JSONType
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    company = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claims = relationship("Claim", back_populates="user")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    company = Column(String, nullable=False)
    policy_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    final_decision = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="claims")
    surveys = relationship("ClaimSurvey", back_populates="claim", cascade="all, delete-orphan")
    images = relationship("ClaimImage", back_populates="claim", cascade="all, delete-orphan")
    explanations = relationship("ClaimExplanation", back_populates="claim", cascade="all, delete-orphan")


class ClaimSurvey(Base):
    __tablename__ = "claim_survey"

    id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    survey_payload = Column(JSONType, nullable=True)
    survey_prediction = Column(String, nullable=True)
    survey_probability = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="surveys")


class ClaimImage(Base):
    __tablename__ = "claim_images"

    id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    image_result = Column(JSONType, nullable=True)
    filename = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="images")


class ClaimExplanation(Base):
    __tablename__ = "claim_explanations"

    id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=False)
    extracted_keywords = Column(JSONType, nullable=True)
    clauses_used = Column(JSONType, nullable=True)
    explanation_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    claim = relationship("Claim", back_populates="explanations")