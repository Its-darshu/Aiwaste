FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (often needed for image processing libraries)
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Source Code (Preserving Directory Structure)
COPY backend/ backend/
COPY ai_service/ ai_service/
COPY frontend/dist/ frontend/dist/

# Create uploads directory
RUN mkdir -p uploads

# Set Python Path
ENV PYTHONPATH=/app

# Expose port 80
EXPOSE 80

# Run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "80"]
