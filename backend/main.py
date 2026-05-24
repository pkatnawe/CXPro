from fastapi import FastAPI

app = FastAPI(title="CXPro Backend", version="0.1.0")


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "ok"}


@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "CXPro Backend API", "version": "0.1.0"}