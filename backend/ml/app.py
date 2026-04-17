from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def home():
    return {"status": "ML running"}

@app.post("/predict")
def predict(data: dict):
    return {"message": "ML endpoint working"}   