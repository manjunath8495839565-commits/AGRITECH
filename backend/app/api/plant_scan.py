"""Plant scan API router – Section C."""

from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException

from app.services import plant_scan as svc

router = APIRouter(tags=["plant-scan"])


@router.post("/plant-scan")
async def scan_plant_infection(
    image: UploadFile = File(..., description="Crop leaf photo"),
    crop: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    lat: Optional[float] = Form(12.97),
    lon: Optional[float] = Form(77.59),
):
    """Analyze crop leaf photo with CV classifier, VLM review, fusion, and live weather risk."""
    raw_bytes = await image.read()

    # Step 0: Validate format & quality gate
    img, err = svc.validate_image_bytes(raw_bytes)
    if err or img is None:
        raise HTTPException(status_code=400, detail=f"Image validation failed: {err}")

    passed, quality_reason = svc.quality_gate(img)
    if not passed:
        # Prompt requirement: Return "Retake photo: {reason}" without a diagnosis
        return {
            "status": "retake_required",
            "error": f"Retake photo: {quality_reason}",
            "quality_passed": False,
            "reason": quality_reason,
        }

    # Step 1: CV Classifier
    top3, cv_source = await svc.run_cv_classifier(img, crop_hint=crop)

    # Step 2: Vision-LLM Review
    vlm_review, vlm_source = await svc.run_vlm_review(img, top3, crop_hint=crop, language=language)

    # Step 3 & 4: Fusion & Treatment
    fused = svc.fuse_diagnosis(top3, vlm_review, crop_hint=crop)
    if not fused.get("is_plant"):
        return {
            "status": "not_a_plant",
            "is_plant": False,
            "error": "The uploaded photo is not a plant or leaf specimen. Please retake with a clear crop photo.",
            "vlm_review": vlm_review,
        }

    # Step 5: Live Weather Risk Correlation
    weather_risk = await svc.correlate_weather_risk(crop or "wheat", fused.get("display_name", ""), lat, lon)

    # Step 6: Queue Interop Packet
    interop_receipt = await svc.queue_scan_packet(fused, raw_bytes)

    # Assemble response
    return {
        "status": "success",
        "diagnosis": {
            "disease_name": fused["display_name"],
            "disease_key": fused["disease_key"],
            "is_healthy": fused["is_healthy"],
            "confidence": fused["confidence"],  # ONLY classifier probability
            "catalog_tag": fused["catalog_tag"],
            "top_3": fused["top_3"],
            "symptoms": vlm_review.get("visible_symptoms", []),
            "explanation": vlm_review.get("farmer_explanation", ""),
            "next_step": vlm_review.get("next_step", ""),
            "treatment": fused["treatment"],
            "weather_risk": weather_risk,
            "interop": interop_receipt,
            "sources": {
                "classifier": cv_source,
                "vlm": vlm_source,
                "treatment": "ml/disease_treatments.json",
                "weather": "Open-Meteo Live API",
            },
        }
    }
