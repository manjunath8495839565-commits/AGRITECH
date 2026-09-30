.PHONY: install dev test smoke seed verify conformance

install:
	pip3 install -q -r backend/requirements.txt
	pip3 install -q greenlet
	cd frontend && npm install --legacy-peer-deps

dev:
	@echo "Starting AgriN Connect v2..."
	@(cd backend && python3 -m uvicorn main:app --port 8000 --reload &)
	@sleep 2
	@(cd frontend && npm run dev)

smoke:
	python3 scripts/smoke_live.py

test:
	cd backend && python3 -m pytest tests/ -v

seed:
	cd backend && python3 seed.py

verify:
	python3 scripts/verify.py

conformance:
	python3 scripts/verify.py

