"""
Flask API for Academic Outcome Prediction
==========================================
Place ebm_model.joblib, target_encoder.joblib, and feature_info.joblib
in the same directory as this file.

Install dependencies:
    pip install flask flask-cors joblib scikit-learn interpret numpy pandas

Run:
    python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# -- Load model and artifacts --

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
ebm = joblib.load(os.path.join(MODEL_DIR, "ebm_model.joblib"))
encoder = joblib.load(os.path.join(MODEL_DIR, "target_encoder.joblib"))
feat_info = joblib.load(os.path.join(MODEL_DIR, "feature_info.joblib"))

FEATURE_NAMES = feat_info["feature_names"]
CATEGORICAL = feat_info["categorical_cols"]
NUMERICAL = feat_info["numerical_cols"]

# Classes that contribute to the "at-risk" score
RISK_CLASSES = {"Fail", "Withdrawn"}

print(f"Model loaded: {len(FEATURE_NAMES)} features, {list(encoder.classes_)} classes")


def build_input(data: dict) -> pd.DataFrame:
    """Convert raw form data into the DataFrame the model expects."""
    row = {}
    for col in FEATURE_NAMES:
        if col == "ExamScore":
            row["ExamScore"] = float(data.get("ExamScore", 50))
        elif col in CATEGORICAL:
            row[col] = str(data.get(col, "0"))
        else:
            row[col] = float(data.get(col, 0))

    df = pd.DataFrame([row])
    for c in CATEGORICAL:
        df[c] = df[c].astype(str)
    for c in NUMERICAL:
        df[c] = df[c].astype(np.float64)
    return df


# -- Plain-language explanation helpers --

def _describe_feature_value(feature: str, raw_value) -> str:
    """Return a plain-English phrase describing a feature and its current value."""
    v = raw_value

    if "Attendance" in feature:
        try:
            pct = float(v)
            qualifier = "critically low" if pct < 50 else "low" if pct < 70 else "adequate" if pct < 85 else "strong"
            return f"attendance rate is {qualifier} at {pct:.0f}%"
        except (TypeError, ValueError):
            return f"attendance rate is {v}"

    if "Assignment" in feature or "Homework" in feature:
        try:
            pct = float(v)
            qualifier = "very few" if pct < 40 else "fewer than half of" if pct < 60 else "most"
            return f"{qualifier} assignments completed ({pct:.0f}%)"
        except (TypeError, ValueError):
            return f"assignment completion is {v}"

    if "StudyHour" in feature or "Study" in feature:
        try:
            hrs = float(v)
            qualifier = "very little" if hrs < 3 else "limited" if hrs < 7 else "moderate" if hrs < 14 else "substantial"
            return f"{qualifier} weekly study time ({hrs:.0f} h/week)"
        except (TypeError, ValueError):
            return f"study hours are {v}"

    if "Stress" in feature:
        # Frontend sends 0=Low, 1=Medium, 2=High
        level_map = {"0": "low", "1": "moderate", "2": "high"}
        label = level_map.get(str(v), str(v))
        return f"{label} stress level reported"

    if "ExamScore" in feature:
        # ExamScore is now a raw numeric value (0-100)
        try:
            score = float(v)
            qualifier = (
                "very low" if score < 40
                else "below-average" if score < 55
                else "average" if score < 70
                else "above-average" if score < 85
                else "strong"
            )
            return f"{qualifier} exam performance ({score:.0f}/100)"
        except (TypeError, ValueError):
            return f"exam score: {v}"

    if "Online" in feature or "Engagement" in feature:
        try:
            pct = float(v)
            qualifier = "minimal" if pct < 30 else "limited" if pct < 60 else "good"
            return f"{qualifier} online course engagement ({pct:.0f}%)"
        except (TypeError, ValueError):
            level_map = {"0": "no", "1": "low", "2": "moderate", "3": "high"}
            label = level_map.get(str(v), str(v))
            return f"{label} online engagement"

    if "Discussion" in feature or "Participation" in feature:
        level_map = {"0": "no", "1": "low", "2": "moderate", "3": "high"}
        label = level_map.get(str(v), str(v))
        return f"{label} discussion participation"

    if "Motivation" in feature:
        level_map = {"0": "low", "1": "moderate", "2": "high"}
        label = level_map.get(str(v), str(v))
        return f"{label} motivation level"

    if "Age" in feature:
        try:
            return f"student age {int(float(v))}"
        except (TypeError, ValueError):
            return f"age: {v}"

    if "Gender" in feature:
        label = "male" if str(v) == "0" else "female" if str(v) == "1" else str(v)
        return f"gender: {label}"

    if "Department" in feature or "Major" in feature or "Course" in feature:
        return f"enrolled in {v}"

    if "Income" in feature or "Socio" in feature or "SES" in feature:
        level_map = {"0": "low", "1": "middle", "2": "high"}
        label = level_map.get(str(v), str(v))
        return f"{label} socioeconomic background"

    if "Disability" in feature or "Support" in feature:
        val = str(v)
        if val in ("1", "Yes", "True"):
            return "has a reported learning disability or support need"
        return "no reported learning disability"

    if "Scholarship" in feature or "Financial" in feature or "Aid" in feature:
        val = str(v)
        if val in ("1", "Yes", "True"):
            return "receiving financial aid or scholarship"
        return "not receiving financial aid"

    if "Extracurricular" in feature:
        return "participates in extracurricular activities" if str(v) == "1" else "no extracurricular involvement"

    if "Internet" in feature:
        return "has internet access" if str(v) == "1" else "no internet access"

    if "EduTech" in feature:
        return "uses educational technology tools" if str(v) == "1" else "does not use educational technology"

    if "Resources" in feature:
        level_map = {"0": "no", "1": "some", "2": "full"}
        label = level_map.get(str(v), str(v))
        return f"{label} access to learning resources"

    if "LearningStyle" in feature:
        style_map = {"0": "visual", "1": "auditory", "2": "kinesthetic", "3": "reading/writing"}
        label = style_map.get(str(v), str(v))
        return f"{label} learning style"

    return f"{feature.replace('_', ' ')}: {v}"


def _generate_recommendation(feature: str, impact: float) -> dict:
    """Return a prioritized recommendation dict for a risk-direction feature."""
    priority = "high" if abs(impact) > 0.1 else "medium" if abs(impact) > 0.04 else "low"

    if "Attendance" in feature:
        return {
            "priority": priority,
            "action": "Increase class attendance - skipping classes is the single strongest driver of academic failure in this model.",
            "target_feature": feature,
        }
    if "Assignment" in feature or "Homework" in feature:
        return {
            "priority": priority,
            "action": "Submit outstanding assignments and maintain a consistent submission routine; incomplete coursework compounds risk quickly.",
            "target_feature": feature,
        }
    if "StudyHour" in feature or "Study" in feature:
        return {
            "priority": priority,
            "action": "Increase dedicated study time - aim for at least 2 hours per course per week outside of class.",
            "target_feature": feature,
        }
    if "Stress" in feature:
        return {
            "priority": priority,
            "action": "Connect the student with counseling or stress-management resources; sustained high stress significantly impairs learning.",
            "target_feature": feature,
        }
    if "ExamScore" in feature:
        return {
            "priority": priority,
            "action": "Arrange targeted exam preparation support such as tutoring, past paper practice, or office-hours review sessions.",
            "target_feature": feature,
        }
    if "Online" in feature or "Engagement" in feature:
        return {
            "priority": priority,
            "action": "Encourage active use of online course materials including videos, quizzes, and supplemental readings.",
            "target_feature": feature,
        }
    if "Discussion" in feature or "Participation" in feature:
        return {
            "priority": priority,
            "action": "Encourage participation in class discussions and study groups to deepen engagement with course content.",
            "target_feature": feature,
        }
    if "Motivation" in feature:
        return {
            "priority": priority,
            "action": "Work with the student to identify motivational barriers and set short-term achievable goals to rebuild academic confidence.",
            "target_feature": feature,
        }
    if "Age" in feature:
        return {
            "priority": "low",
            "action": "Consider age-appropriate academic support and flexible scheduling options.",
            "target_feature": feature,
        }
    return {
        "priority": priority,
        "action": f"Monitor and actively support improvement in: {feature.replace('_', ' ')}.",
        "target_feature": feature,
    }


def generate_explanation(
    predicted_class: str,
    risk_level: str,
    risk_score: float,
    contributions: list,
    input_data: dict,
) -> dict:
    """
    Build a structured plain-language explanation from EBM contributions.
    Returns summary, risk_factors, protective_factors, and recommendations.
    """
    risk_factors = []
    protective_factors = []
    recommendations = []

    for c in contributions:
        feature = c["feature"]
        direction = c["direction"]
        impact = c["impact"]
        raw_value = input_data.get(feature)

        phrase = _describe_feature_value(feature, raw_value)

        if direction == "risk":
            risk_factors.append(phrase.capitalize())
            rec = _generate_recommendation(feature, impact)
            recommendations.append(rec)
        else:
            protective_factors.append(phrase.capitalize())

    # Deduplicate recommendations by action text
    seen_actions = set()
    unique_recs = []
    for r in recommendations:
        if r["action"] not in seen_actions:
            seen_actions.add(r["action"])
            unique_recs.append(r)

    # Sort: high -> medium -> low priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    unique_recs.sort(key=lambda r: priority_order.get(r["priority"], 9))

    # Build summary sentence
    outcome_phrase = {
        "Fail": "failing the course",
        "Pass": "passing the course",
        "Withdrawn": "withdrawing from the course",
        "Distinction": "achieving a distinction",
        "Credit": "achieving a credit",
        "High Distinction": "achieving a high distinction",
    }.get(predicted_class, predicted_class.lower())

    if risk_factors:
        top_reasons = "; ".join(rf.lower() for rf in risk_factors[:3])
        summary = (
            f"This student is predicted to be {outcome_phrase} with a {risk_level.lower()} risk profile "
            f"(risk score {risk_score:.0f}%). "
            f"The primary contributing factors are: {top_reasons}."
        )
    elif protective_factors:
        top_strengths = "; ".join(pf.lower() for pf in protective_factors[:2])
        summary = (
            f"This student is on track for {outcome_phrase}. "
            f"Key strengths supporting this outcome include: {top_strengths}."
        )
    else:
        summary = f"This student is predicted to be {outcome_phrase} based on their current academic profile."

    return {
        "summary": summary,
        "risk_factors": risk_factors,
        "protective_factors": protective_factors,
        "recommendations": unique_recs,
    }


# -- Routes --

@app.route("/api/predict", methods=["POST"])
def predict():
    """Return prediction, probabilities, feature contributions, and plain-language explanation."""
    data = request.json
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        X = build_input(data)

        # Prediction & probabilities
        pred_result = ebm.predict(X)
        pred_idx = pred_result[0] if hasattr(pred_result, "__getitem__") else pred_result
        probs_result = ebm.predict_proba(X)
        probs = probs_result[0] if hasattr(probs_result, "__getitem__") else probs_result
        predicted_class = encoder.classes_[pred_idx]

        prob_breakdown = {
            cls: round(float(probs[i]) * 100, 2)
            for i, cls in enumerate(encoder.classes_)
        }

        # Local explanation from EBM
        local = ebm.explain_local(X)
        local_data = local.data(0)
        names = list(local_data.get("names", [])) if local_data is not None else []
        scores = list(local_data.get("scores", [])) if local_data is not None else []

        contributions = []
        if names and scores:
            for name, score_arr in zip(names, scores):
                score = float(score_arr[pred_idx])
                if abs(score) < 0.001:
                    continue
                contributions.append({
                    "feature": name,
                    "impact": round(score, 4),
                    "direction": "risk" if score > 0 else "protective",
                })
            contributions = sorted(contributions, key=lambda x: abs(x["impact"]), reverse=True)

        # Risk score: sum of probabilities for all risk-class outcomes
        classes = list(encoder.classes_)
        risk_score = sum(
            float(probs[i])
            for i, cls in enumerate(classes)
            if cls in RISK_CLASSES
        )

        if risk_score >= 0.7:
            risk_level = "Critical"
        elif risk_score >= 0.4:
            risk_level = "Moderate"
        else:
            risk_level = "Low"

        exam_score = float(X["ExamScore"].iloc[0])

        # Plain-language explanation
        explanation = generate_explanation(
            predicted_class=predicted_class,
            risk_level=risk_level,
            risk_score=risk_score * 100,
            contributions=contributions[:10],
            input_data=data,
        )

        return jsonify({
            "prediction": predicted_class,
            "probabilities": prob_breakdown,
            "risk_score": round(risk_score * 100, 2),
            "risk_level": risk_level,
            "contributions": contributions[:10],
            "explanation": explanation,
            "exam_score": exam_score,
            "input_summary": {k: str(v) for k, v in data.items()},
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "EBM Academic Outcome Predictor",
        "classes": list(encoder.classes_),
        "features": FEATURE_NAMES,
    })


import os
port = int(os.environ.get("PORT", 10000))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, debug=False)
