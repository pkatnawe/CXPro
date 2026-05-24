"""
Pytest test harness for CX Execution Agent evaluation.
Runs evaluation fixtures against the AI pipeline and tracks quality metrics.
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
import hashlib

import pytest
import psycopg2
from psycopg2.extras import RealDictCursor

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from document_detector import DocumentDetector
from pdf_chunker import PDFChunker
from spec_extractor import SpecExtractor
from generate_checklist import GenerateL2Checklist
from cx_execution_agent import CxExecutionAgent


@dataclass
class EvalResult:
    """Result of a single fixture evaluation"""
    fixture_id: str
    passed: bool
    extracted_spec_match: bool
    citation_count: int
    citation_recall: float
    steps_count: int
    steps_in_range: bool
    checklist_coverage: float
    execution_time_ms: int
    error_message: Optional[str] = None
    

@dataclass
class EvalRun:
    """Complete evaluation run across all fixtures"""
    run_id: str
    timestamp: datetime
    fixtures_passed: int
    fixtures_total: int
    pass_rate: float
    avg_citation_recall: float
    avg_checklist_coverage: float
    total_execution_time_ms: int
    git_commit: str
    

class CxExecutionEvaluator:
    """Evaluates CX Execution Agent against fixture data"""
    
    def __init__(self, fixtures_dir: str = "fixtures"):
        self.fixtures_dir = Path(__file__).parent / fixtures_dir
        self.fixtures = self._load_fixtures()
        self.detector = DocumentDetector()
        self.chunker = PDFChunker()
        self.extractor = SpecExtractor()
        self.checklist_generator = GenerateL2Checklist()
        self.agent = CxExecutionAgent()
        
        # Database connection for storing results
        self.db_conn = self._get_db_connection()
        
    def _get_db_connection(self):
        """Get database connection for storing eval results"""
        try:
            return psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                port=os.getenv("DB_PORT", 5432),
                database=os.getenv("DB_NAME", "cx_test"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "postgres")
            )
        except Exception as e:
            print(f"Warning: Could not connect to database: {e}")
            return None
            
    def _load_fixtures(self) -> List[Dict[str, Any]]:
        """Load all fixture files from fixtures directory"""
        fixtures = []
        for fixture_file in sorted(self.fixtures_dir.glob("fixture_*.json")):
            with open(fixture_file) as f:
                fixture_data = json.load(f)
                fixtures.append(fixture_data)
        return fixtures
        
    def _get_git_commit(self) -> str:
        """Get current git commit hash"""
        try:
            import subprocess
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()[:8]
        except:
            return "unknown"
            
    def evaluate_fixture(self, fixture: Dict[str, Any]) -> EvalResult:
        """Evaluate a single fixture"""
        fixture_id = fixture["id"]
        start_time = time.time()
        
        try:
            # Simulate PDF content as if it was extracted
            pdf_content = fixture["pdf_content"]
            expected = fixture["expected"]
            
            # Step 1: Detect document type
            doc_type = self.detector.detect_type(pdf_content)
            
            # Step 2: Extract chunks (simulate with content blocks)
            chunks = self.chunker.chunk_text(pdf_content)
            
            # Step 3: Extract specifications
            extracted_spec = self.extractor.extract_spec(
                chunks=chunks,
                doc_type="submittal-cut-sheet"
            )
            
            # Step 4: Generate checklist with citations
            checklist_result = self.checklist_generator.generate(
                extracted_spec=extracted_spec,
                chunks=chunks
            )
            
            # Evaluate results against expected values
            spec_match = self._compare_specs(
                extracted_spec, 
                expected["extracted_spec"]
            )
            
            citation_count = len(checklist_result.get("citations", []))
            citation_recall = min(
                citation_count / expected["expected_min_citations"], 
                1.0
            ) if expected["expected_min_citations"] > 0 else 0.0
            
            steps_count = len(checklist_result.get("checklist_items", []))
            steps_in_range = (
                expected["expected_steps_count_range"][0] <= steps_count <= 
                expected["expected_steps_count_range"][1]
            )
            
            checklist_coverage = self._calculate_coverage(
                checklist_result.get("checklist_items", []),
                expected.get("expected_checklist_items", [])
            )
            
            execution_time_ms = int((time.time() - start_time) * 1000)
            
            # Determine if fixture passed
            passed = (
                spec_match and 
                citation_count >= expected["expected_min_citations"] and
                steps_in_range and
                checklist_coverage >= 0.7
            )
            
            return EvalResult(
                fixture_id=fixture_id,
                passed=passed,
                extracted_spec_match=spec_match,
                citation_count=citation_count,
                citation_recall=citation_recall,
                steps_count=steps_count,
                steps_in_range=steps_in_range,
                checklist_coverage=checklist_coverage,
                execution_time_ms=execution_time_ms
            )
            
        except Exception as e:
            execution_time_ms = int((time.time() - start_time) * 1000)
            return EvalResult(
                fixture_id=fixture_id,
                passed=False,
                extracted_spec_match=False,
                citation_count=0,
                citation_recall=0.0,
                steps_count=0,
                steps_in_range=False,
                checklist_coverage=0.0,
                execution_time_ms=execution_time_ms,
                error_message=str(e)
            )
            
    def _compare_specs(self, extracted: Dict, expected: Dict) -> bool:
        """Compare extracted spec with expected spec"""
        # Simple comparison - check key fields match
        try:
            return (
                extracted.get("equipment_type") == expected.get("equipment_type") and
                extracted.get("manufacturer") == expected.get("manufacturer") and
                extracted.get("model") == expected.get("model")
            )
        except:
            return False
            
    def _calculate_coverage(self, actual_items: List[str], expected_items: List[str]) -> float:
        """Calculate coverage of expected checklist items"""
        if not expected_items:
            return 1.0
            
        actual_text = " ".join(str(item).lower() for item in actual_items)
        covered = sum(
            1 for expected in expected_items 
            if expected.lower() in actual_text
        )
        return covered / len(expected_items)
        
    def run_evaluation(self) -> EvalRun:
        """Run evaluation across all fixtures"""
        run_id = hashlib.md5(str(time.time()).encode()).hexdigest()[:8]
        start_time = time.time()
        
        results = []
        for fixture in self.fixtures:
            result = self.evaluate_fixture(fixture)
            results.append(result)
            
            # Store individual result in database
            if self.db_conn:
                self._store_eval_result(run_id, result)
                
        # Calculate aggregate metrics
        fixtures_passed = sum(1 for r in results if r.passed)
        fixtures_total = len(results)
        pass_rate = fixtures_passed / fixtures_total if fixtures_total > 0 else 0.0
        avg_citation_recall = sum(r.citation_recall for r in results) / len(results) if results else 0.0
        avg_checklist_coverage = sum(r.checklist_coverage for r in results) / len(results) if results else 0.0
        total_execution_time_ms = int((time.time() - start_time) * 1000)
        
        eval_run = EvalRun(
            run_id=run_id,
            timestamp=datetime.now(),
            fixtures_passed=fixtures_passed,
            fixtures_total=fixtures_total,
            pass_rate=pass_rate,
            avg_citation_recall=avg_citation_recall,
            avg_checklist_coverage=avg_checklist_coverage,
            total_execution_time_ms=total_execution_time_ms,
            git_commit=self._get_git_commit()
        )
        
        # Store run summary in database
        if self.db_conn:
            self._store_eval_run(eval_run)
            
        return eval_run
        
    def _store_eval_result(self, run_id: str, result: EvalResult):
        """Store individual fixture result in database"""
        if not self.db_conn:
            return
            
        try:
            with self.db_conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO eval_runs (
                        run_id, fixture_id, passed, extracted_spec_match,
                        citation_count, citation_recall, steps_count, 
                        steps_in_range, checklist_coverage, execution_time_ms,
                        error_message, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    run_id, result.fixture_id, result.passed,
                    result.extracted_spec_match, result.citation_count,
                    result.citation_recall, result.steps_count,
                    result.steps_in_range, result.checklist_coverage,
                    result.execution_time_ms, result.error_message,
                    datetime.now()
                ))
                self.db_conn.commit()
        except Exception as e:
            print(f"Failed to store eval result: {e}")
            
    def _store_eval_run(self, eval_run: EvalRun):
        """Store evaluation run summary"""
        # Save to JSON file as baseline
        baseline_file = Path(__file__).parent / "baseline.json"
        with open(baseline_file, "w") as f:
            json.dump(asdict(eval_run), f, indent=2, default=str)
            

# Pytest fixtures and tests
@pytest.fixture
def evaluator():
    """Create evaluator instance"""
    return CxExecutionEvaluator()
    

def test_all_fixtures_have_expected_structure():
    """Test that all fixtures have required structure"""
    evaluator = CxExecutionEvaluator()
    
    for fixture in evaluator.fixtures:
        assert "id" in fixture
        assert "pdf_content" in fixture
        assert "expected" in fixture
        
        expected = fixture["expected"]
        assert "extracted_spec" in expected
        assert "expected_min_citations" in expected
        assert "expected_steps_count_range" in expected
        

def test_individual_fixtures(evaluator):
    """Test each fixture individually"""
    results = []
    
    for fixture in evaluator.fixtures:
        result = evaluator.evaluate_fixture(fixture)
        results.append(result)
        
        # Report individual fixture result
        print(f"\nFixture {result.fixture_id}:")
        print(f"  Passed: {result.passed}")
        print(f"  Spec Match: {result.extracted_spec_match}")
        print(f"  Citations: {result.citation_count} (recall: {result.citation_recall:.2f})")
        print(f"  Steps: {result.steps_count} (in range: {result.steps_in_range})")
        print(f"  Coverage: {result.checklist_coverage:.2f}")
        
        if result.error_message:
            print(f"  ERROR: {result.error_message}")
            
    # Check overall pass rate
    pass_rate = sum(1 for r in results if r.passed) / len(results)
    assert pass_rate >= 0.7, f"Pass rate {pass_rate:.2f} is below 70% threshold"
    

def test_full_evaluation_run(evaluator):
    """Test complete evaluation run"""
    eval_run = evaluator.run_evaluation()
    
    print(f"\nEvaluation Run Summary:")
    print(f"  Run ID: {eval_run.run_id}")
    print(f"  Passed: {eval_run.fixtures_passed}/{eval_run.fixtures_total}")
    print(f"  Pass Rate: {eval_run.pass_rate:.2%}")
    print(f"  Avg Citation Recall: {eval_run.avg_citation_recall:.2f}")
    print(f"  Avg Checklist Coverage: {eval_run.avg_checklist_coverage:.2f}")
    print(f"  Execution Time: {eval_run.total_execution_time_ms}ms")
    
    # Assert minimum quality thresholds
    assert eval_run.pass_rate >= 0.7, "Pass rate below 70%"
    assert eval_run.avg_citation_recall >= 0.6, "Citation recall below 60%"
    assert eval_run.avg_checklist_coverage >= 0.6, "Checklist coverage below 60%"
    

def test_regression_detection(evaluator):
    """Test that regression detection works"""
    baseline_file = Path(__file__).parent / "baseline.json"
    
    if baseline_file.exists():
        with open(baseline_file) as f:
            baseline = json.load(f)
            
        # Run current evaluation
        current = evaluator.run_evaluation()
        
        # Check for regression (>10% drop)
        pass_rate_drop = baseline["pass_rate"] - current.pass_rate
        citation_drop = baseline["avg_citation_recall"] - current.avg_citation_recall
        
        assert pass_rate_drop <= 0.1, f"Pass rate regressed by {pass_rate_drop:.2%}"
        assert citation_drop <= 0.1, f"Citation recall regressed by {citation_drop:.2%}"
    else:
        # No baseline yet, just run evaluation to create one
        evaluator.run_evaluation()
        

if __name__ == "__main__":
    # Run evaluation when script is executed directly
    evaluator = CxExecutionEvaluator()
    eval_run = evaluator.run_evaluation()
    
    print("\n" + "="*60)
    print("CX EXECUTION EVALUATION COMPLETE")
    print("="*60)
    print(f"Pass Rate: {eval_run.pass_rate:.2%}")
    print(f"Fixtures Passed: {eval_run.fixtures_passed}/{eval_run.fixtures_total}")
    print(f"Avg Citation Recall: {eval_run.avg_citation_recall:.2f}")
    print(f"Avg Checklist Coverage: {eval_run.avg_checklist_coverage:.2f}")
    print(f"Total Time: {eval_run.total_execution_time_ms}ms")
    print(f"Git Commit: {eval_run.git_commit}")
    
    # Exit with error code if below threshold
    if eval_run.pass_rate < 0.7:
        print("\n⚠️  EVALUATION FAILED: Pass rate below 70% threshold")
        sys.exit(1)
    else:
        print("\n✅ EVALUATION PASSED")
        sys.exit(0)