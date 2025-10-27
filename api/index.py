"""
Vercel Serverless Function Entry Point for FastAPI Backend
"""
import sys
import os

# Get the absolute path to the backend directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, '..', 'backend')
backend_path = os.path.abspath(backend_path)

# Add backend directory to Python path
sys.path.insert(0, backend_path)

# Set environment variable for model path
os.environ['MODEL_PATH'] = backend_path

from main import app
from mangum import Mangum

# Vercel serverless function handler using Mangum adapter
handler = Mangum(app, lifespan="off")
