from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import datetime

from backend.app.database.session import get_db
from backend.app.models.models import (
    AIConversation, AIMessage, Incident, DisasterAssessment
)
from backend.app.schemas.ai_schemas import (
    MessageCreate, MessageResponse,
    ConversationCreate, ConversationResponse, ConversationDetailResponse,
    IncidentAnalysisRequest, RiskExplanationRequest
)
from backend.app.services.ollama_service import (
    get_ollama_status, query_ollama_chat, list_installed_models
)
from backend.app.services.ai_prompts import (
    INCIDENT_ANALYSIS_PROMPT, RISK_EXPLANATION_PROMPT
)

router = APIRouter(prefix="/api/ai", tags=["Sentinel AI"])


@router.get("/status")
def ai_status():
    """Return local Ollama CLI status, running model, and detected models."""
    return get_ollama_status()


@router.get("/models")
def ai_models():
    """List all detected models dynamically from ollama list."""
    return {"models": list_installed_models()}


@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(db: Session = Depends(get_db)):
    """Fetch all saved local AI conversations."""
    conversations = db.query(AIConversation).order_by(AIConversation.updated_at.desc()).all()
    result = []
    for conv in conversations:
        count = db.query(AIMessage).filter(AIMessage.conversation_id == conv.id).count()
        result.append(ConversationResponse(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=count
        ))
    return result


@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(req: ConversationCreate, db: Session = Depends(get_db)):
    """Create a new consultation session."""
    conv = AIConversation(
        title=req.title or "Emergency AI Consultation",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=0
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation_detail(conversation_id: int, db: Session = Depends(get_db)):
    """Get all messages for a specific consultation."""
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(AIMessage).filter(
        AIMessage.conversation_id == conversation_id
    ).order_by(AIMessage.created_at.asc()).all()

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages
    )


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    """Delete a conversation and all its associated messages."""
    conv = db.query(AIConversation).filter(AIConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conv)
    db.commit()
    return {"status": "deleted", "id": conversation_id}


@router.post("/chat", response_model=MessageResponse)
def chat_with_sentinel(req: MessageCreate, db: Session = Depends(get_db)):
    """
    Main AI chat endpoint.
    Invokes local Ollama CLI with prompt, stores user and assistant messages in SQLite.
    """
    # 1. Resolve or create conversation
    conv = None
    if req.conversation_id:
        conv = db.query(AIConversation).filter(AIConversation.id == req.conversation_id).first()

    if not conv:
        # Generate initial title from prompt
        title = (req.prompt[:40] + "...") if len(req.prompt) > 40 else req.prompt
        conv = AIConversation(
            title=title,
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow()
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # 2. Save user message to database
    user_msg = AIMessage(
        conversation_id=conv.id,
        role="user",
        content=req.prompt,
        model_name=req.model_name or "gemma4:e4b",
        execution_time_seconds=0.0,
        created_at=datetime.datetime.utcnow()
    )
    db.add(user_msg)
    db.commit()

    # 3. Retrieve recent history for conversational continuity
    previous_messages = db.query(AIMessage).filter(
        AIMessage.conversation_id == conv.id
    ).order_by(AIMessage.created_at.asc()).all()

    history = [
        {"role": m.role, "content": m.content}
        for m in previous_messages
    ]

    # 4. Invoke local Ollama CLI via safe subprocess
    result = query_ollama_chat(
        prompt=req.prompt,
        history=history,
        model_name=req.model_name or "gemma4:e4b"
    )

    if not result["success"]:
        response_text = f"⚠️ [Local AI Service Notice]: {result['error']}\nPlease ensure Ollama service is active."
    else:
        response_text = result["response"]

    # 5. Save assistant response to database
    assistant_msg = AIMessage(
        conversation_id=conv.id,
        role="assistant",
        content=response_text,
        model_name=result.get("model_used", req.model_name or "gemma4:e4b"),
        execution_time_seconds=result.get("execution_time", 0.0),
        created_at=datetime.datetime.utcnow()
    )
    db.add(assistant_msg)

    # Update conversation timestamp
    conv.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg


@router.post("/analyze-incident")
def analyze_incident(req: IncidentAnalysisRequest, db: Session = Depends(get_db)):
    """Specialized AI endpoint to analyze a registered incident."""
    incident = db.query(Incident).filter(Incident.id == req.incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    prompt = INCIDENT_ANALYSIS_PROMPT.format(
        title=incident.title,
        category=incident.disaster_category,
        location=incident.location_name,
        severity=incident.severity,
        description=incident.description,
        affected_population=incident.affected_population
    )

    result = query_ollama_chat(
        prompt=prompt,
        model_name=req.model_name or "gemma4:e4b"
    )

    return {
        "incident_id": incident.id,
        "title": incident.title,
        "analysis": result["response"] if result["success"] else f"Error: {result['error']}",
        "execution_time": result.get("execution_time", 0.0),
        "model_used": result.get("model_used", req.model_name or "gemma4:e4b")
    }


@router.post("/explain-risk")
def explain_risk(req: RiskExplanationRequest, db: Session = Depends(get_db)):
    """Specialized AI endpoint to explain a disaster risk score."""
    assessment = db.query(DisasterAssessment).filter(DisasterAssessment.id == req.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    prompt = RISK_EXPLANATION_PROMPT.format(
        disaster_type=assessment.disaster_type,
        location=assessment.location_name,
        risk_score=assessment.risk_score,
        risk_category=assessment.risk_category,
        input_data=assessment.input_data_json,
        contributing_factors=assessment.contributing_factors_json
    )

    result = query_ollama_chat(
        prompt=prompt,
        model_name=req.model_name or "gemma4:e4b"
    )

    return {
        "assessment_id": assessment.id,
        "disaster_type": assessment.disaster_type,
        "explanation": result["response"] if result["success"] else f"Error: {result['error']}",
        "execution_time": result.get("execution_time", 0.0),
        "model_used": result.get("model_used", req.model_name or "gemma4:e4b")
    }

