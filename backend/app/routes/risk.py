import json
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.database.session import get_db
from backend.app.models.models import DisasterAssessment, RiskFactor
from backend.app.schemas.risk_schemas import (
    RiskEvaluationRequest, RiskAssessmentCreate, RiskAssessmentResponse
)
from backend.app.services.risk_engine import evaluate_disaster_risk

router = APIRouter(prefix="/api/risk", tags=["Disaster Risk Intelligence"])


@router.post("/evaluate")
def evaluate_risk_preview(req: RiskEvaluationRequest):
    """
    Preview disaster risk assessment without saving.
    Useful for interactive UI sliders and preliminary screening.
    """
    eval_result = evaluate_disaster_risk(req.disaster_type, req.parameters)
    return {
        "location_name": req.location_name,
        "disaster_type": req.disaster_type,
        **eval_result
    }


@router.post("/assessments", response_model=RiskAssessmentResponse)
def create_assessment(req: RiskAssessmentCreate, db: Session = Depends(get_db)):
    """
    Calculate and persist an official disaster risk assessment in the SQLite database.
    Stores breakdown factors into relational risk_factors table.
    """
    eval_result = evaluate_disaster_risk(req.disaster_type, req.parameters)

    # Generate unique ID
    count = db.query(DisasterAssessment).count()
    assessment_id = f"ASM-{datetime.datetime.utcnow().strftime('%Y%m')}-{count + 1:04d}"

    assessment = DisasterAssessment(
        assessment_id=assessment_id,
        disaster_type=req.disaster_type,
        location_name=req.location_name,
        latitude=req.latitude,
        longitude=req.longitude,
        risk_score=eval_result["risk_score"],
        risk_category=eval_result["risk_category"],
        input_data_json=json.dumps(req.parameters),
        contributing_factors_json=json.dumps(eval_result["contributing_factors"]),
        explanation=eval_result["explanation"],
        suggested_precautions_json=json.dumps(eval_result["suggested_precautions"]),
        data_quality=eval_result["data_quality"],
        assessment_type="Rule-Based",
        is_demo=req.is_demo or False,
        assessed_by=req.assessed_by or "Sentinel Operator",
        created_at=datetime.datetime.utcnow()
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Save breakdown factors into risk_factors table
    for factor_name, score in eval_result["contributing_factors"].items():
        rf = RiskFactor(
            assessment_id=assessment.id,
            factor_name=factor_name,
            factor_value=str(score),
            weight=1.0,
            contribution_score=float(score)
        )
        db.add(rf)
    db.commit()

    return RiskAssessmentResponse(
        id=assessment.id,
        assessment_id=assessment.assessment_id,
        disaster_type=assessment.disaster_type,
        location_name=assessment.location_name,
        latitude=assessment.latitude,
        longitude=assessment.longitude,
        risk_score=assessment.risk_score,
        risk_category=assessment.risk_category,
        input_data=json.loads(assessment.input_data_json),
        contributing_factors=json.loads(assessment.contributing_factors_json),
        explanation=assessment.explanation,
        suggested_precautions=json.loads(assessment.suggested_precautions_json),
        data_quality=assessment.data_quality,
        assessment_type=assessment.assessment_type,
        is_demo=assessment.is_demo,
        assessed_by=assessment.assessed_by,
        created_at=assessment.created_at
    )


@router.get("/assessments", response_model=List[RiskAssessmentResponse])
def get_assessments(
    disaster_type: Optional[str] = None,
    risk_category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve historical disaster assessments with optional category filtering."""
    query = db.query(DisasterAssessment)
    if disaster_type and disaster_type != "All":
        query = query.filter(DisasterAssessment.disaster_type == disaster_type)
    if risk_category and risk_category != "All":
        query = query.filter(DisasterAssessment.risk_category == risk_category)

    assessments = query.order_by(DisasterAssessment.created_at.desc()).limit(limit).all()

    result = []
    for a in assessments:
        try:
            in_data = json.loads(a.input_data_json) if a.input_data_json else {}
        except Exception:
            in_data = {}
        try:
            factors = json.loads(a.contributing_factors_json) if a.contributing_factors_json else {}
        except Exception:
            factors = {}
        try:
            precautions = json.loads(a.suggested_precautions_json) if a.suggested_precautions_json else []
        except Exception:
            precautions = []

        result.append(RiskAssessmentResponse(
            id=a.id,
            assessment_id=a.assessment_id,
            disaster_type=a.disaster_type,
            location_name=a.location_name,
            latitude=a.latitude,
            longitude=a.longitude,
            risk_score=a.risk_score,
            risk_category=a.risk_category,
            input_data=in_data,
            contributing_factors=factors,
            explanation=a.explanation,
            suggested_precautions=precautions,
            data_quality=a.data_quality,
            assessment_type=a.assessment_type,
            is_demo=a.is_demo,
            assessed_by=a.assessed_by,
            created_at=a.created_at
        ))
    return result


@router.get("/assessments/{assessment_id}", response_model=RiskAssessmentResponse)
def get_assessment_detail(assessment_id: int, db: Session = Depends(get_db)):
    """Fetch complete details of a specific assessment."""
    a = db.query(DisasterAssessment).filter(DisasterAssessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return RiskAssessmentResponse(
        id=a.id,
        assessment_id=a.assessment_id,
        disaster_type=a.disaster_type,
        location_name=a.location_name,
        latitude=a.latitude,
        longitude=a.longitude,
        risk_score=a.risk_score,
        risk_category=a.risk_category,
        input_data=json.loads(a.input_data_json) if a.input_data_json else {},
        contributing_factors=json.loads(a.contributing_factors_json) if a.contributing_factors_json else {},
        explanation=a.explanation,
        suggested_precautions=json.loads(a.suggested_precautions_json) if a.suggested_precautions_json else [],
        data_quality=a.data_quality,
        assessment_type=a.assessment_type,
        is_demo=a.is_demo,
        assessed_by=a.assessed_by,
        created_at=a.created_at
    )


@router.delete("/assessments/{assessment_id}")
def delete_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Delete a disaster risk assessment."""
    a = db.query(DisasterAssessment).filter(DisasterAssessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    db.delete(a)
    db.commit()
    return {"status": "deleted", "id": assessment_id}

