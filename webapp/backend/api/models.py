"""Pydantic models for request/response validation."""
from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    """Request model for explanation generation."""
    dataset: str = Field(..., description="Dataset name")
    model: str = Field(..., description="Model name (without unsloth_ prefix)")
    factual: Dict[str, Any] = Field(..., description="Factual instance")
    counterfactual: Dict[str, Any] = Field(..., description="Counterfactual instance")
    generation_type: Literal["one-shot", "self-refinement"] = Field(default="one-shot", description="Generation type: one-shot or self-refinement")
    use_refiner: bool = Field(default=False, description="Whether to use refiner (deprecated, use generation_type)")
    fine_tuned: bool = Field(default=True, description="Whether to use fine-tuned model with LoRA adapter")
    num_narratives: int = Field(default=5, ge=1, le=5, description="Number of draft narratives to generate (self-refinement only, min 1, max 5)")
    temperature: float = Field(default=0.6, ge=0.0, le=2.0, description="Generation temperature")
    top_p: float = Field(default=0.8, ge=0.0, le=1.0, description="Top-p sampling parameter")
    max_tokens: int = Field(default=5000, ge=1, le=8192, description="Maximum tokens to generate")


class DraftStatus(BaseModel):
    """Status of a draft narrative."""
    index: int = Field(..., description="Draft index (0-4)")
    status: Literal["pending", "loading", "success", "failed"] = Field(..., description="Draft status")
    ranking: Optional[Dict[str, int]] = Field(default=None, description="Feature importance ranking from this draft")
    explanation: Optional[str] = Field(default=None, description="Draft narrative explanation text")
    explanation_extracted: Optional[bool] = Field(default=True, description="False when 'explanation' was not extracted from JSON")


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
    drafts: Optional[List[DraftStatus]] = Field(default=None, description="Draft statuses for self-refinement mode")
    nss: Optional[float] = Field(default=None, description="Narrative Stability Score for self-refinement mode")
    status: str = Field(default="success", description="Status of the request")
    warning: Optional[str] = Field(default=None, description="Warning message if this is a demo/example")
    explanation_extraction_warning: Optional[bool] = Field(default=False, description="True when 'explanation' was not extracted from JSON")
    prompt: Optional[str] = Field(default=None, description="The prompt sent to the model (worker or refiner)")


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str = Field(..., description="Error message")
    status: str = Field(default="error", description="Status of the request")
