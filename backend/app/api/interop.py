"""Module A↔B Interop router – signed packet relay with signature verification."""

from __future__ import annotations
import hashlib, hmac, json, os, uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.schemas.models import InteropPacket, InteropAck

router = APIRouter(tags=["interop"])

PACKET_STORE: list[dict] = []

# Shared secret for HMAC-SHA256 signatures (set in .env)
INTEROP_SECRET = os.environ.get("INTEROP_SECRET", "agrin-dev-secret-change-in-prod")



def _sign(packet: InteropPacket) -> str:
    payload = json.dumps({
        "packet_id": packet.packet_id,
        "source_node": packet.source_node,
        "target_node": packet.target_node,
        "payload_type": packet.payload_type,
        "timestamp": packet.timestamp.isoformat(),
    }, sort_keys=True)
    return hmac.new(INTEROP_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()


sign_packet_obj = _sign


def _verify(packet: InteropPacket) -> bool:
    expected = _sign(packet)
    if not packet.signature:
        return False
    return hmac.compare_digest(expected, packet.signature)


@router.post("/send", response_model=InteropAck)
async def send_packet(packet: InteropPacket):
    """Module A receives a packet, verifies signature, logs it."""
    if not _verify(packet):
        return InteropAck(
            packet_id=packet.packet_id,
            accepted=False,
            reason="Invalid or missing signature",
            timestamp=datetime.utcnow(),
        )
    # In production: forward to Module B via HTTP
    return InteropAck(
        packet_id=packet.packet_id,
        accepted=True,
        reason="Packet accepted by Node A",
        timestamp=datetime.utcnow(),
    )


@router.post("/sign")
async def sign_packet(packet: InteropPacket):
    """Helper: sign a packet (Node A issues signature)."""
    sig = _sign(packet)
    return {"packet_id": packet.packet_id, "signature": sig}


@router.get("/new-packet")
async def new_packet_template():
    """Generate a new packet template for testing."""
    pid = str(uuid.uuid4())
    return InteropPacket(
        packet_id=pid,
        source_node="A",
        target_node="B",
        payload_type="farm_alert",
        payload={"message": "Test alert", "severity": "info"},
    )
