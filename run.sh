#!/usr/bin/env bash
# run.sh — arranque de desarrollo en un paso.
set -e
cd "$(dirname "$0")"
python3 -m venv .venv 2>/dev/null || true
source .venv/bin/activate
python -m pip install -q --upgrade pip
python -m pip install -q -e .
[ -f .env ] || { cp .env.example .env; echo "· Creado .env — edita EP_PASSWORD."; }
exec eamel serve --reload
