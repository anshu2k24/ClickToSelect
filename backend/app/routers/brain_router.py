# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# import requests

# router = APIRouter(prefix="/brain", tags=["AI Brain"])

# BRAIN_SERVICE_URL = "http://localhost:5001/brain"


# class BrainRequest(BaseModel):
#     question: str
#     answer: str
#     candidate_id: str


# @router.post("/")
# def brain(data: BrainRequest):

#     try:
#         response = requests.post(
#             BRAIN_SERVICE_URL,
#             json=data.dict(),
#             timeout=20
#         )
#         response.raise_for_status()
#         return response.json()
#     except requests.RequestException:
#         raise HTTPException(
#             status_code=502,
#             detail="Brain service is unavailable"
#         )