import pytest

from app.schemas.interview import (
    InterviewQuestion,
    InterviewSessionStartRequest,
    InterviewTurnRequest,
)
from app.services.interview_service import evaluate_interview_turn, start_interview
from app.services.llm_service import llm_service


def test_interview_turn_request_accepts_twenty_question_sessions():
    request = InterviewTurnRequest(
        role="Backend Engineer",
        experience_level="mid",
        interview_type="technical",
        difficulty="medium",
        question_count=20,
        current_question={
            "question": "Describe a system design decision.",
            "category": "Architecture",
            "difficulty": "medium",
            "what_it_assesses": "Technical judgment",
        },
        answer="I chose an approach based on the requirements.",
        completed_count=16,
    )
    assert request.question_count == 20


def test_full_interview_turn_request_accepts_time_limit_fields():
    request = InterviewTurnRequest(
        role="Backend Engineer",
        experience_level="mid",
        interview_type="technical",
        difficulty="hard",
        question_count=5,
        full_interview=True,
        elapsed_minutes=40,
        time_limit_reached=True,
        current_question={
            "question": "Describe a system design decision.",
            "category": "Architecture",
            "difficulty": "hard",
            "what_it_assesses": "Technical judgment",
        },
        answer="I chose an approach based on the requirements.",
        completed_count=16,
    )
    assert request.full_interview is True
    assert request.time_limit_reached is True


@pytest.mark.asyncio
async def test_start_interview_generates_personalized_opening_question(monkeypatch):
    async def fake_complete_json(**kwargs):
        assert "resume evidence" in kwargs["user"].lower()
        assert "Cloud migration" in kwargs["user"]
        assert "no planned question count" in kwargs["user"]
        assert "introduce themself" in kwargs["user"]
        return {
            "question": {
                "question": "Tell me about the cloud migration you led.",
                "category": "Experience",
                "difficulty": "medium",
                "what_it_assesses": "Ownership and impact",
                "evaluation_criteria": ["Specific outcomes"],
            }
        }

    monkeypatch.setattr(llm_service, "complete_json", fake_complete_json)
    result = await start_interview(
        InterviewSessionStartRequest(
            role="Backend Engineer",
            experience_level="senior",
            interview_type="technical",
            difficulty="medium",
            question_count=5,
            full_interview=True,
            resume_context="Cloud migration project",
        )
    )

    assert isinstance(result["question"], InterviewQuestion)
    assert result["question"].question.startswith("Tell me")
    assert result["question"].response_mode == "voice"


def test_code_interview_question_and_answer_fields():
    question = InterviewQuestion(
        question="Implement a function to merge sorted arrays.",
        category="Coding",
        difficulty="medium",
        what_it_assesses="Algorithmic problem solving",
        response_mode="code",
        code_language="python",
    )
    request = InterviewTurnRequest(
        role="Backend Engineer",
        experience_level="mid",
        interview_type="technical",
        difficulty="medium",
        question_count=5,
        current_question=question,
        answer="def merge(left, right):\n    return sorted(left + right)",
        answer_mode="code",
        code_language="python",
        completed_count=1,
    )
    assert request.current_question.response_mode == "code"
    assert request.answer_mode == "code"
    assert request.code_language == "python"


@pytest.mark.asyncio
async def test_interview_turn_adapts_and_scores_answer(monkeypatch):
    async def fake_complete_json(**kwargs):
        assert "Candidate responses completed including this answer: 2" in kwargs["user"]
        assert "What trade-off did you make?" in kwargs["user"]
        assert "Include one practical, role-appropriate coding exercise" in kwargs["user"]
        return {
            "evaluation": {
                "score": 4,
                "feedback": "Clear reasoning with a useful example.",
                "strengths": ["Explained a concrete trade-off"],
                "improvements": ["Quantify the impact"],
            },
            "is_complete": False,
            "next_question": {
                "question": "How did you measure the result?",
                "category": "Impact",
                "difficulty": "medium",
                "what_it_assesses": "Outcome measurement",
                "response_mode": "code",
                "code_language": "python",
                "evaluation_criteria": ["Uses measurable outcomes"],
            },
            "final_report": None,
        }

    monkeypatch.setattr(llm_service, "complete_json", fake_complete_json)
    result = await evaluate_interview_turn(
        InterviewTurnRequest(
            role="Backend Engineer",
            experience_level="senior",
            interview_type="technical",
            difficulty="medium",
            question_count=5,
            completed_turns=[
                {
                    "question": "What trade-off did you make?",
                    "category": "Architecture",
                    "answer": "I chose the simpler design.",
                }
            ],
            current_question={
                "question": "Describe a difficult system decision.",
                "category": "Architecture",
                "difficulty": "medium",
                "what_it_assesses": "Technical judgment",
            },
            answer="I chose an event queue to decouple processing.",
            completed_count=2,
        )
    )

    assert result.evaluation.score == 4
    assert result.next_question.question == "How did you measure the result?"
    assert result.next_question.response_mode == "code"
    assert result.next_question.code_language == "python"
    assert result.is_complete is False


@pytest.mark.asyncio
async def test_interview_turn_requires_final_report_at_response_limit(monkeypatch):
    async def fake_complete_json(**kwargs):
        return {
            "evaluation": {
                "score": 3,
                "feedback": "Reasonable answer.",
                "strengths": [],
                "improvements": [],
            },
            "is_complete": False,
            "next_question": {
                "question": "Continue?",
                "category": "General",
                "difficulty": "medium",
                "what_it_assesses": "Depth",
                "evaluation_criteria": [],
            },
            "final_report": None,
        }

    monkeypatch.setattr(llm_service, "complete_json", fake_complete_json)
    request = InterviewTurnRequest(
        role="Backend Engineer",
        experience_level="mid",
        interview_type="technical",
        difficulty="medium",
        question_count=2,
        current_question={
            "question": "Explain a design choice.",
            "category": "Architecture",
            "difficulty": "medium",
            "what_it_assesses": "Judgment",
        },
        answer="I evaluated the trade-offs.",
        completed_count=2,
    )

    with pytest.raises(RuntimeError, match="configured limit"):
        await evaluate_interview_turn(request)


@pytest.mark.asyncio
async def test_last_interview_turn_returns_a_final_report(monkeypatch):
    async def fake_complete_json(**kwargs):
        assert "Last allowed response: True" in kwargs["user"]
        return {
            "evaluation": {
                "score": 4,
                "feedback": "Strong answer supported by evidence.",
                "strengths": ["Clear ownership"],
                "improvements": ["Add metrics"],
            },
            "is_complete": True,
            "next_question": None,
            "final_report": {
                "overall_score": 4,
                "summary": "Strong technical judgment.",
                "strengths": ["Clear ownership"],
                "areas_to_improve": ["Quantify outcomes"],
                "recommendations": ["Practice concise impact statements"],
            },
        }

    monkeypatch.setattr(llm_service, "complete_json", fake_complete_json)
    result = await evaluate_interview_turn(
        InterviewTurnRequest(
            role="Backend Engineer",
            experience_level="mid",
            interview_type="technical",
            difficulty="medium",
            question_count=2,
            current_question={
                "question": "Explain a design choice.",
                "category": "Architecture",
                "difficulty": "medium",
                "what_it_assesses": "Judgment",
            },
            answer="I evaluated the trade-offs and chose the simpler design.",
            completed_count=2,
        )
    )

    assert result.is_complete is True
    assert result.final_report.overall_score == 4
    assert result.next_question is None


@pytest.mark.asyncio
async def test_full_interview_requires_final_report_when_time_limit_is_reached(monkeypatch):
    async def fake_complete_json(**kwargs):
        assert "Time limit reached: True" in kwargs["user"]
        return {
            "evaluation": {
                "score": 3,
                "feedback": "Reasonable answer.",
                "strengths": [],
                "improvements": [],
            },
            "is_complete": False,
            "next_question": {
                "question": "Continue?",
                "category": "General",
                "difficulty": "medium",
                "what_it_assesses": "Depth",
                "evaluation_criteria": [],
            },
            "final_report": None,
        }

    monkeypatch.setattr(llm_service, "complete_json", fake_complete_json)
    with pytest.raises(RuntimeError, match="configured limit"):
        await evaluate_interview_turn(
            InterviewTurnRequest(
                role="Backend Engineer",
                experience_level="mid",
                interview_type="technical",
                difficulty="medium",
                question_count=5,
                full_interview=True,
                elapsed_minutes=40,
                time_limit_reached=True,
                current_question={
                    "question": "Explain a design choice.",
                    "category": "Architecture",
                    "difficulty": "medium",
                    "what_it_assesses": "Judgment",
                },
                answer="I evaluated the trade-offs and chose the simpler design.",
                completed_count=16,
            )
        )
