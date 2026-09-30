# AgriN Interoperability Protocol (Node A ↔ Node B ↔ Node C)

The **AgriN Interoperability Protocol** specifies how independent edge/cloud nodes in the agricultural network securely federate telemetry, disease outbreak alerts, market demand requests, and advisory recommendations.

---

## 1. Network Topologies

```
┌────────────────┐          HMAC-SHA256 Signed          ┌────────────────┐
│     Node A     │ ────────────────────────────────────► │     Node B     │
│  (Hub / Cloud) │ ◄──────────────────────────────────── │ (Regional Edge)│
└───────┬────────┘                  ACK                  └───────┬────────┘
        │                                                        │
        │                       HMAC-SHA256                      │
        └───────────────────────────────► ┌──────────────────────┘
                                          │
                                          ▼
                                 ┌────────────────┐
                                 │     Node C     │
                                 │ (Field Station)│
                                 └────────────────┘
```

- **Node A (Primary Hub)**: Central coordination and external satellite/weather ingest.
- **Node B (Regional Edge)**: Regional cooperative aggregator handling localized farmer queues.
- **Node C (Field Station / Gateway)**: Low-power gateway serving offline or low-bandwidth farm clusters.

---

## 2. Packet Specification

Every packet exchanged follows the canonical schema:

```json
{
  "packet_id": "pkt_7d3b9e4a81f0",
  "source_node": "Node A",
  "target_node": "Node B",
  "timestamp": "2026-09-30T12:00:00Z",
  "packet_type": "ALERT | ADVISORY | TELEMETRY | SYNC",
  "payload": {
    "topic": "pest_outbreak",
    "crop": "wheat",
    "location": { "lat": 12.9716, "lon": 77.5946 },
    "severity": "HIGH",
    "details": "Leaf rust risk threshold exceeded."
  },
  "sequence_no": 1042,
  "signature": "3f8b912a...7c"
}
```

---

## 3. Cryptographic Verification (HMAC-SHA256)

1. The packet canonical JSON is computed over sorted keys, excluding the `signature` field itself.
2. The sender computes:
   $$\text{signature} = \text{HMAC-SHA256}(\text{INTEROP\_SECRET}, \text{canonical\_payload})$$
3. The recipient extracts the signature, recomputes the expected HMAC using the shared secret, and compares in constant time using `hmac.compare_digest`.
4. If the signature matches:
   - Packet is accepted.
   - An ACK receipt is generated and returned with status `200 OK`.
5. If the signature does not match or is absent:
   - Packet is rejected immediately with status `401 Unauthorized` / error `"Invalid or missing signature"`.
   - Tamper alert is logged in node audit logs.

---

## 4. Endpoints & Transcripts

### Generate New Packet Template
```bash
curl -s http://localhost:8000/api/interop/new-packet
```

### Sign Packet
```bash
curl -s -X POST http://localhost:8000/api/interop/sign \
  -H "Content-Type: application/json" \
  -d '{"packet_id":"pkt_demo","source_node":"Node A","target_node":"Node B","packet_type":"ALERT","payload":{"alert":"Drought alert"},"sequence_no":1}'
```

### Send Valid Signed Packet
```bash
# Returns {"status": "accepted", "ack": "ACK_pkt_demo", "received_by": "Node A"}
```

### Send Tampered Packet (Simulated Attack)
```bash
# Returns 400/401 {"detail": "Invalid or missing signature"}
```
