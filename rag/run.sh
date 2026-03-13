#!/bin/bash
# Assuming the virtual environment is built and active.
# To activate manually: source venv/bin/activate
cd /home/bhavshank/code/smvit/ClickToSelect/rag
uvicorn main:app --reload --host 0.0.0.0 --port 8000
