"""
Vercel Serverless Function Entry Point for FastAPI Backend
"""
import sys
import os

# Add backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_path)

# Set working directory to backend for model loading
os.chdir(backend_path)

from main import app
from mangum import Mangum

# Vercel serverless function handler using Mangum adapter
handler = Mangum(app, lifespan="off")
