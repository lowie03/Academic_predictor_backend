# Academic Outcome Predictor — Setup Guide

## Overview

This project has two parts:
1. **Backend** (Flask API) — loads the trained EBM model and serves predictions
2. **Frontend** (React) — the user interface where students/advisors input data and see results

---

## Step 1: Export Model Files from Colab

Add this cell to your Colab notebook and run it:

```python
import joblib
from google.colab import files

# Save model artifacts
joblib.dump(ebm, 'ebm_model.joblib')
joblib.dump(target_encoder, 'target_encoder.joblib')

feature_info = {
    'feature_names': list(X.columns),
    'categorical_cols': categorical_cols,
    'numerical_cols': numerical_cols,
    'exam_score_bins': [0, 48, 59, 67, 76, 88, 100],
    'exam_score_labels': ['Band1', 'Band2', 'Band3', 'Band4', 'Band5', 'Band6'],
}
joblib.dump(feature_info, 'feature_info.joblib')

# Download all three
files.download('ebm_model.joblib')
files.download('target_encoder.joblib')
files.download('feature_info.joblib')
```

You will download 3 files.

---

## Step 2: Set Up the Backend

### Folder structure:

```
backend/
├── app.py                  (provided)
├── requirements.txt        (provided)
├── ebm_model.joblib        (from Colab)
├── target_encoder.joblib   (from Colab)
└── feature_info.joblib     (from Colab)
```

### Install and run:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The API will start at `http://localhost:5000`.

### Test it:

```bash
curl -X POST http://localhost:5000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"StudyHours": 15, "Attendance": 80, "ExamScore": 72, "AssignmentCompletion": 75, "Age": 20, "Gender": "0", "Internet": "1", "EduTech": "1", "Resources": "1", "LearningStyle": "0", "StressLevel": "1", "Motivation": "1", "Extracurricular": "0", "OnlineCourses": 5, "Discussions": 2}'
```

You should get a JSON response with prediction, probabilities, and contributions.

---

## Step 3: Set Up the Frontend

### Option A: Quick setup with Vite + React

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

Replace `src/App.jsx` with the provided `AcademicPredictor.jsx` file.

Then run:

```bash
npm run dev
```

Frontend will be at `http://localhost:5173`.

### Option B: Add to an existing React project

Just copy `AcademicPredictor.jsx` into your components folder and import it.

---

## Step 4: Connect Frontend to Backend

The frontend is configured to call `http://localhost:5000/api`. 
Make sure:
1. Backend is running (`python app.py`)
2. Frontend is running (`npm run dev`)
3. Both are on the same machine

If deploying to different servers, update the `API_URL` variable at the top of `AcademicPredictor.jsx`.

---

## API Endpoints

### POST /api/predict

**Request body** (JSON):
```json
{
  "StudyHours": 15,
  "Attendance": 80,
  "ExamScore": 72,
  "AssignmentCompletion": 75,
  "Age": 20,
  "Gender": "0",
  "Internet": "1",
  "EduTech": "1",
  "Resources": "1",
  "LearningStyle": "0",
  "StressLevel": "1",
  "Motivation": "1",
  "Extracurricular": "0",
  "OnlineCourses": 5,
  "Discussions": 2
}
```

**Response** (JSON):
```json
{
  "prediction": "Pass",
  "probabilities": {
    "Distinction": 15.2,
    "Pass": 60.5,
    "Fail": 18.1,
    "Withdrawn": 6.2
  },
  "risk_score": 24.3,
  "risk_level": "Low",
  "contributions": [
    {"feature": "ExamScore", "impact": -0.0378, "direction": "protective"},
    {"feature": "Attendance", "impact": 0.0137, "direction": "risk"}
  ],
  "interventions": [],
  "exam_band": "Band4"
}
```

### GET /api/health

Returns model info and status.

---

## Troubleshooting

- **CORS errors**: Make sure `flask-cors` is installed and `CORS(app)` is in app.py
- **Model not loading**: Ensure the 3 `.joblib` files are in the same folder as `app.py`
- **Version mismatch**: Use the same scikit-learn and interpret versions as in Colab
- **Port conflict**: Change the port in `app.py` (`app.run(port=5001)`) and update `API_URL` in the frontend
