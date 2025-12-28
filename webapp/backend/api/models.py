"""Pydantic models for request/response validation."""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    """Request model for explanation generation."""
    dataset: str = Field(..., description="Dataset name")
    model: str = Field(..., description="Model name (without unsloth_ prefix)")
    factual: Dict[str, Any] = Field(..., description="Factual instance")
    counterfactual: Dict[str, Any] = Field(..., description="Counterfactual instance")
    use_refiner: bool = Field(default=False, description="Whether to use refiner")
    fine_tuned: bool = Field(default=True, description="Whether to use fine-tuned model with LoRA adapter")
    temperature: float = Field(default=0.6, ge=0.0, le=2.0, description="Generation temperature")
    top_p: float = Field(default=0.8, ge=0.0, le=1.0, description="Top-p sampling parameter")
    max_tokens: int = Field(default=4096, ge=1, le=8192, description="Maximum tokens to generate")


class MetricsResponse(BaseModel):
    """Metrics for the explanation generation."""
    json_parsing_success: bool = Field(default=False, description="Whether JSON parsing was successful")
    pff: bool = Field(default=False, description="Perfect Feature Field - all expected feature changes captured")
    tf: bool = Field(default=False, description="Target Field - target variable change captured correctly")
    avg_ff: Optional[float] = Field(default=None, description="Average Feature Field score")


class ExplainResponse(BaseModel):
    """Response model for explanation generation."""
    explanation: str = Field(..., description="Generated narrative explanation")
    raw_output: Optional[str] = Field(default=None, description="Full raw output from the SLM")
    parsed_json: Optional[Dict[str, Any]] = Field(default=None, description="Parsed JSON object from SLM response")
    feature_changes: Dict[str, Any] = Field(default_factory=dict, description="Feature changes")
    target_variable_change: Dict[str, Any] = Field(default_factory=dict, description="Target variable change")
    reasoning: Optional[str] = Field(default=None, description="Reasoning if available")
    metrics: Optional[MetricsResponse] = Field(default=None, description="Inference metrics")
    status: str = Field(default="success", description="Status of the request")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    status: str = Field(default="error", description="Status of the request")
