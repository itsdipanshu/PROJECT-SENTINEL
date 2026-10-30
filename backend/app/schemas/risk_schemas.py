from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime


class RiskEvaluationRequest(BaseModel):
    disaster_type: str = Field(..., description="Flood, Heavy Rainfall, Landslide, Storm, Heatwave, Drought")
    location_name: str = Field(..., min_length=2)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    parameters: Dict[str, Any] = Field(..., description="Key-value pairs of hydrological/meteorological inputs")


class RiskAssessmentCreate(RiskEvaluationRequest):
    assessed_by: Optional[str] = "Sentinel EOC Operator"
    is_demo: Optional[bool] = False


class RiskAssessmentResponse(BaseModel):
    id: int
    assessment_id: str
    disaster_type: str
    location_name: str
    latitude: Optional[float]
    longitude: Optional[float]
    risk_score: float
    risk_category: str
    input_data: Dict[str, Any]
    contributing_factors: Dict[str, float]
    explanation: str
    suggested_precautions: List[str]
    data_quality: str
    assessment_type: str
    is_demo: bool
    assessed_by: str
    created_at: datetime

    class Config:
        from_attributes = True

