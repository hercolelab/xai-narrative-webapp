"""FastAPI application for counterfactual narrative explanations."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict, Any
import sys
import json
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from api.models import ExplainRequest, ExplainResponse, ErrorResponse
from services.pipeline_service import pipeline_service

app = FastAPI(
    title="Counterfactual Narrative Explainer API",
    description="API for generating counterfactual narrative explanations using LLM pipeline",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Counterfactual Narrative Explainer API", "version": "1.0.0"}


@app.get("/api/datasets")
async def get_datasets():
    """Get available datasets with their display names."""
    try:
        datasets = pipeline_service.get_available_datasets()
        # Return both API keys and display names
        dataset_info = []
        for dataset in datasets:
            display_name = pipeline_service.dataset_display_names.get(dataset, dataset.title())
            dataset_info.append({
                "key": dataset,
                "name": display_name
            })
        return {"datasets": datasets, "dataset_info": dataset_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models")
async def get_all_models():
    """Get all available models (legacy endpoint for backwards compatibility)."""
    try:
        models = pipeline_service.get_available_models()
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/models/{dataset}")
async def get_models_for_dataset(dataset: str):
    """
    Get available fine-tuned models for a specific dataset.
    Scans the outputs_unsloth folder for available model checkpoints.
    Includes demo model if CUDA is not available or no models found.
    """
    try:
        # Validate dataset
        available_datasets = pipeline_service.get_available_datasets()
        if dataset not in available_datasets:
            raise HTTPException(
                status_code=404,
                detail=f"Dataset '{dataset}' not found. Available: {available_datasets}"
            )
        
        # Get models available for this dataset
        models = pipeline_service.get_available_models_for_dataset(dataset)
        
        # Check CUDA availability
        try:
            import torch
            CUDA_AVAILABLE = torch.cuda.is_available()
        except ImportError:
            CUDA_AVAILABLE = False
        
        # Add demo model if CUDA is not available or no models found
        warning = None
        if not CUDA_AVAILABLE or not models:
            if "demo" not in models:
                models.append("demo")
            if not CUDA_AVAILABLE:
                warning = "CUDA is not available. Demo model is available for testing."
            elif not models or len(models) == 1:  # Only demo model
                warning = f"No fine-tuned models found for dataset: {dataset}. Demo model is available for testing."
        
        response = {"models": models, "dataset": dataset}
        if warning:
            response["warning"] = warning
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/examples/{dataset}")
async def get_example(dataset: str):
    """Get a random factual/counterfactual pair for a dataset."""
    try:
        example = pipeline_service.get_example(dataset)
        if example is None:
            raise HTTPException(
                status_code=404,
                detail=f"No examples found for dataset: {dataset}"
            )
        return example
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/examples/{dataset}/new-counterfactual")
async def get_new_counterfactual(dataset: str, factual: Dict[str, Any]):
    """Get a new random counterfactual for a given factual instance."""
    try:
        result = pipeline_service.get_new_counterfactual(dataset, factual)
        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"No counterfactuals found for dataset: {dataset}"
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain", response_model=ExplainResponse)
async def explain(request: ExplainRequest):
    """Generate a narrative explanation for a factual/counterfactual pair."""
    try:
        result = pipeline_service.generate_explanation(
            dataset=request.dataset,
            model=request.model,
            factual=request.factual,
            counterfactual=request.counterfactual,
            use_refiner=request.use_refiner,
            fine_tuned=request.fine_tuned,
            temperature=request.temperature,
            top_p=request.top_p,
            max_tokens=request.max_tokens
        )
        return ExplainResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/explain/stream")
async def explain_stream(request: ExplainRequest):
    """
    Generate a narrative explanation with streaming updates (Server-Sent Events).
    
    For self-refinement mode, streams progress updates as each draft completes.
    """
    def generate_sse():
        """Generator for Server-Sent Events."""
        try:
            if request.generation_type == "self-refinement":
                # Use the streaming generator
                for event in pipeline_service.generate_self_refinement(
                    dataset=request.dataset,
                    model=request.model,
                    factual=request.factual,
                    counterfactual=request.counterfactual,
                    fine_tuned=request.fine_tuned,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    max_tokens=request.max_tokens
                ):
                    yield f"data: {json.dumps(event)}\n\n"
            else:
                # One-shot mode - just generate normally and return as complete event
                result = pipeline_service.generate_explanation(
                    dataset=request.dataset,
                    model=request.model,
                    factual=request.factual,
                    counterfactual=request.counterfactual,
                    use_refiner=request.use_refiner,
                    fine_tuned=request.fine_tuned,
                    temperature=request.temperature,
                    top_p=request.top_p,
                    max_tokens=request.max_tokens
                )
                # Convert metrics object to dict if needed
                if result.get("metrics") and hasattr(result["metrics"], "model_dump"):
                    result["metrics"] = result["metrics"].model_dump()
                
                yield f"data: {json.dumps({'type': 'complete', **result})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
