# Aiwaste

## Smart Waste Management System

This project uses AI to detect waste in images and manage waste reporting.

### Setup

1.  **Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Data & Models

The dataset and trained models are not included in this repository due to size constraints.

*   **Dataset**: Please contact the maintainers for access to the dataset or use `ai_service/generate_dummy_data.py` to generate synthetic data for testing.
*   **Model**: The `waste_model.h5` file is tracked using Git LFS (or download instructions provided here).

### License

[MIT License](LICENSE)
