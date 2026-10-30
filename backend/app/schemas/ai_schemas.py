from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MessageBase(BaseModel):
    role: str
    content: str


class MessageCreate(BaseModel):
    conversation_id: Optional[int] = None
    prompt: str = Field(..., min_length=1)
    model_name: Optional[str] = "gemma4:e4b"


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    model_name: str
    execution_time_seconds: float
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    title: Optional[str] = "Emergency Consultation"


class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class IncidentAnalysisRequest(BaseModel):
    incident_id: int
    model_name: Optional[str] = "gemma4:e4b"


class RiskExplanationRequest(BaseModel):
    assessment_id: int
    model_name: Optional[str] = "gemma4:e4b"

