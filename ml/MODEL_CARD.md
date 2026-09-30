# AgriN Plant Infection Scan — Model Card & Provenance

## Primary Vision Classifier (CV)
- **Model Identifier**: `dima806/plant_disease_detection`
- **Architecture**: Vision Transformer (ViT) fine-tuned for Plant Disease Classification
- **Dataset**: PlantVillage (54,305 curated agricultural leaf images across 38 crop-disease classes)
- **License**: MIT License
- **Input Resolution**: 224x224 RGB
- **Classes**: 38 classes covering Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato (healthy & pathological variants).
- **Inference Mode Chain**:
  1. Hugging Face Inference Providers endpoint (`https://api-inference.huggingface.co/models/dima806/plant_disease_detection` or router)
  2. Local classifier fallback (`agrin_local_cv_classifier` with feature extraction)
  3. DEMO mock (only enabled when `DEMO_MODE=true` with an explicit red DEMO badge)

## Vision-Language Model Review (VLM)
- **Model Identifier**: `Qwen/Qwen2.5-VL-7B-Instruct`
- **Provider Router**: `https://router.huggingface.co/v1/chat/completions` (OpenAI-compatible chat completions)
- **Role**: Visual pathologist review explaining symptoms, checking plant part, and validating candidate classifier top-1 (without inventing numbers or drug dosages).
- **License**: Apache 2.0
