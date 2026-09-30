"""Unit tests for Plant Infection Scan pipeline (Section C)."""

import io
import pytest
import numpy as np
from PIL import Image

from app.services import plant_scan as ps
from app.api.interop import _verify, InteropPacket, PACKET_STORE


def create_test_image(width=200, height=200, color=(100, 150, 80), format="JPEG", blur=False):
    """Helper to generate in-memory test image bytes."""
    if blur:
        # Uniform solid color has 0 laplacian variance -> blurred
        img = Image.new("RGB", (width, height), color)
    else:
        # High frequency pattern to create high laplacian variance
        arr = np.zeros((height, width, 3), dtype=np.uint8)
        arr[::4, :] = [200, 50, 50]
        arr[1::4, :] = [50, 200, 50]
        arr[2::4, :] = [50, 50, 200]
        arr[3::4, :] = [180, 180, 50]
        img = Image.fromarray(arr)

    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue(), img


class TestImageValidation:
    def test_valid_jpeg(self):
        raw, _ = create_test_image(format="JPEG")
        img, err = ps.validate_image_bytes(raw)
        assert err is None
        assert img is not None
        assert img.mode == "RGB"

    def test_valid_png(self):
        raw, _ = create_test_image(format="PNG")
        img, err = ps.validate_image_bytes(raw)
        assert err is None
        assert img is not None

    def test_exceeds_max_size(self):
        huge_bytes = b"\xFF\xD8\xFF" + b"\x00" * (9 * 1024 * 1024)
        img, err = ps.validate_image_bytes(huge_bytes)
        assert img is None
        assert "exceeds maximum size" in err

    def test_corrupted_too_small(self):
        tiny_bytes = b"\xFF\xD8\xFF"
        img, err = ps.validate_image_bytes(tiny_bytes)
        assert img is None
        assert "too small" in err

    def test_unsupported_format(self):
        random_bytes = b"NOT_AN_IMAGE_FILE_HEADER_XYZ_123456"
        img, err = ps.validate_image_bytes(random_bytes)
        assert img is None
        assert "Unsupported file format" in err


class TestQualityGate:
    def test_sharp_image_passes(self):
        _, img = create_test_image(width=150, height=150, blur=False)
        passed, reason = ps.quality_gate(img)
        assert passed is True
        assert "passed" in reason.lower()

    def test_low_resolution_fails(self):
        img = Image.new("RGB", (64, 64), (100, 120, 100))
        passed, reason = ps.quality_gate(img)
        assert passed is False
        assert "resolution too low" in reason

    def test_underexposed_fails(self):
        # Darkness mean < 32
        img = Image.new("RGB", (120, 120), (10, 10, 10))
        passed, reason = ps.quality_gate(img)
        assert passed is False
        assert "underexposed" in reason.lower()

    def test_overexposed_fails(self):
        # Brightness mean > 232
        img = Image.new("RGB", (120, 120), (250, 250, 250))
        passed, reason = ps.quality_gate(img)
        assert passed is False
        assert "overexposed" in reason.lower()

    def test_blurred_image_fails(self):
        # Solid flat color has zero edge variance -> blur gate triggers
        img = Image.new("RGB", (150, 150), (100, 140, 100))
        passed, reason = ps.quality_gate(img)
        assert passed is False
        assert "out of focus" in reason.lower() or "blurry" in reason.lower()


class TestDigitRejection:
    def test_reject_digits_replaces_numbers(self):
        raw = "Apply 2 sprays every 7 days with 50 percent water."
        cleaned = ps.reject_digits(raw)
        assert "2" not in cleaned
        assert "7" not in cleaned
        assert "50" not in cleaned
        assert "two" in cleaned
        assert "seven" in cleaned
        assert "fivezero" in cleaned


class TestFusionLogic:
    def test_not_a_plant(self):
        vlm = {"is_plant_photo": False}
        top3 = [{"label": "Tomato___Early_blight", "score": 0.85}]
        fused = ps.fuse_diagnosis(top3, vlm, "tomato")
        assert fused["status"] == "rejected"
        assert fused["is_plant"] is False

    def test_high_confidence_verified(self):
        vlm = {
            "is_plant_photo": True,
            "consistent_with_top1": "yes",
            "farmer_explanation": "Clear dark concentric lesions visible on leaf surface.",
            "next_step": "Isolate leaf and apply bio-fungicide.",
        }
        top3 = [
            {"label": "Tomato___Early_blight", "score": 0.88},
            {"label": "Tomato___Late_blight", "score": 0.08},
            {"label": "Tomato___healthy", "score": 0.04},
        ]
        fused = ps.fuse_diagnosis(top3, vlm, "tomato")
        assert fused["status"] == "success"
        assert fused["is_plant"] is True
        assert fused["disease_key"] == "Tomato___Early_blight"
        assert fused["confidence"] == 0.88
        assert fused["treatment"]["severity"] in ("Moderate", "High", "Critical", "Low")
        assert "organic_treatment" in fused["treatment"]
        assert "chemical_treatment" in fused["treatment"]

    def test_low_confidence_or_inconsistent_fallback(self):
        vlm = {
            "is_plant_photo": True,
            "consistent_with_top1": "no",
            "farmer_explanation": "Lesions do not match early blight.",
            "next_step": "Scout more leaves.",
        }
        top3 = [
            {"label": "Tomato___Early_blight", "score": 0.40},
            {"label": "Tomato___Late_blight", "score": 0.35},
            {"label": "Tomato___healthy", "score": 0.25},
        ]
        fused = ps.fuse_diagnosis(top3, vlm, "tomato")
        assert fused["disease_key"] == "General___Foliar_infection"
        assert fused["confidence"] <= 0.45

    def test_crop_not_in_catalog_flag(self):
        vlm = {"is_plant_photo": True, "consistent_with_top1": "yes"}
        top3 = [{"label": "Tomato___Early_blight", "score": 0.90}]
        # Crop hint is "Coffee", but classifier top1 is "Tomato"
        fused = ps.fuse_diagnosis(top3, vlm, "Coffee")
        assert "not in catalog" in fused["catalog_tag"]


class TestOutageMatrix:
    @pytest.mark.asyncio
    async def test_simulate_outage_cv(self, monkeypatch):
        monkeypatch.setattr(ps, "SIMULATE_OUTAGE", "cv")
        _, img = create_test_image(width=150, height=150)
        results, source = await ps.run_cv_classifier(img, crop_hint="wheat")
        assert len(results) == 3
        assert "LOCAL" in source or "outage" in source

    @pytest.mark.asyncio
    async def test_simulate_outage_vlm(self, monkeypatch):
        monkeypatch.setattr(ps, "SIMULATE_OUTAGE", "vision,llm")
        _, img = create_test_image(width=150, height=150)
        top3 = [{"label": "Potato___Late_blight", "score": 0.82}]
        review, source = await ps.run_vlm_review(img, top3, crop_hint="potato", language="en")
        assert review["is_plant_photo"] is True
        assert source == "DETERMINISTIC MODE"
        assert "farmer_explanation" in review


class TestInteropPacketQueue:
    @pytest.mark.asyncio
    async def test_queue_signed_packet(self):
        initial_count = len(PACKET_STORE)
        fused = {
            "display_name": "Tomato Early Blight",
            "confidence": 0.88,
            "treatment": {"severity": "Moderate"},
        }
        res = await ps.queue_scan_packet(fused, b"dummy_leaf_bytes_12345", farm_id="farm_karnataka_1")
        assert res["ack_stamp"] == "Shared via AgriN ✓ ack"
        assert "image_hash" in res
        assert len(PACKET_STORE) == initial_count + 1

        latest = PACKET_STORE[-1]
        assert latest["packet_id"] == res["packet_id"]
        assert latest["signature"] is not None
        # Verify cryptographic signature
        packet_obj = InteropPacket(**latest)
        assert _verify(packet_obj) is True


class TestDynamicScoringAndDifferentiation:
    """Verifies that plant scan computes genuine, dynamic scores across leaf specimens."""

    def _make_healthy_leaf(self):
        from PIL import ImageDraw
        img = Image.new("RGB", (250, 250), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.ellipse([35, 75, 215, 175], fill=(34, 197, 94))
        return img

    def _make_diseased_leaf(self, severe=False):
        from PIL import ImageDraw
        img = Image.new("RGB", (250, 250), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.ellipse([35, 75, 215, 175], fill=(34, 197, 94))
        draw.ellipse([80, 90, 120, 130], fill=(120, 53, 15), outline=(245, 158, 11), width=2)
        if severe:
            draw.ellipse([140, 110, 180, 150], fill=(120, 53, 15), outline=(245, 158, 11), width=2)
            draw.ellipse([60, 120, 95, 150], fill=(120, 53, 15), outline=(245, 158, 11), width=2)
        return img

    def test_healthy_rice_leaf_differs_from_fixed_score(self):
        img_healthy = self._make_healthy_leaf()
        results = ps._local_cv_classify(img_healthy, crop_hint="rice")
        top1 = results[0]
        # Should be diagnosed as healthy, NOT Rice___Blast
        assert top1["label"] == "Rice___healthy"
        # Dynamic score should be high and not 0.88
        assert top1["score"] >= 0.90
        assert top1["score"] != 0.88

    def test_different_lesions_produce_different_scores(self):
        img_moderate = self._make_diseased_leaf(severe=False)
        img_severe = self._make_diseased_leaf(severe=True)

        res_moderate = ps._local_cv_classify(img_moderate, crop_hint="rice")
        res_severe = ps._local_cv_classify(img_severe, crop_hint="rice")

        assert res_moderate[0]["label"] == "Rice___Blast"
        assert res_severe[0]["label"] == "Rice___Blast"

        score_mod = res_moderate[0]["score"]
        score_sev = res_severe[0]["score"]

        # Scores must be dynamic and different between moderate and severe
        assert score_mod != score_sev
        assert score_sev > score_mod
        assert score_mod != 0.88 or score_sev != 0.88

    def test_wheat_leaf_diagnosed_correctly(self):
        img_healthy = self._make_healthy_leaf()
        img_diseased = self._make_diseased_leaf()

        res_healthy = ps._local_cv_classify(img_healthy, crop_hint="wheat")
        res_diseased = ps._local_cv_classify(img_diseased, crop_hint="wheat")

        assert res_healthy[0]["label"] == "Wheat___healthy"
        assert res_healthy[0]["score"] >= 0.90

        assert res_diseased[0]["label"] == "Wheat___Leaf_rust"
        assert res_diseased[0]["score"] != res_healthy[0]["score"]
