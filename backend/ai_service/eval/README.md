# AI Service Evaluation Framework

This directory contains the evaluation framework for the CX Execution Agent AI service. The framework automatically tests AI quality on every PR that touches AI-related code, preventing quality regressions from being merged.

## Overview

The evaluation system:
- Runs AI pipeline on 10+ fixture documents
- Measures extraction accuracy, citation quality, and checklist coverage
- Blocks PRs if performance drops >10% below baseline
- Stores results in database for tracking over time
- Provides data-network-effect: every corrected output becomes a future test

## Directory Structure

```
ai_service/eval/
├── fixtures/           # Test fixture documents
│   ├── fixture_001_pump.json
│   ├── fixture_002_chiller.json
│   └── ...
├── test_cx_execution.py    # Pytest test harness
├── baseline.json           # Current baseline metrics
└── README.md              # This file
```

## Running Evaluations Locally

```bash
cd backend/ai_service/eval
python -m pytest test_cx_execution.py -v
```

This will:
1. Load all fixtures from `fixtures/` directory
2. Run each through the AI pipeline
3. Compare results against expected values
4. Report pass/fail for each fixture
5. Calculate aggregate metrics

## Fixture Format

Each fixture is a JSON file with this structure:

```json
{
  "id": "fixture_001_pump",
  "name": "Centrifugal Pump - Model CP-500",
  "description": "High-efficiency centrifugal pump submittal",
  "pdf_content": "... actual submittal text ...",
  "expected": {
    "extracted_spec": {
      "equipment_type": "Centrifugal Pump",
      "manufacturer": "FlowTech Industries",
      "model": "CP-500",
      "design_specs": { ... }
    },
    "expected_min_citations": 3,
    "expected_steps_count_range": [5, 8],
    "expected_checklist_items": [
      "rotation direction",
      "alignment",
      "vibration levels"
    ]
  }
}
```

## Adding New Fixtures

The data-network-effect principle: Every pilot correction becomes a future test fixture.

### Step 1: Capture Real-World Failure

When the AI produces incorrect output in production:
1. Save the source PDF that caused the issue
2. Note what the AI got wrong
3. Document the correct expected output

### Step 2: Create Fixture File

Create a new fixture file in `fixtures/` directory:

```bash
# Use next available number
ls fixtures/ | tail -1
# If last is fixture_010_heat_pump.json, create fixture_011_yourtype.json
```

### Step 3: Structure the Fixture

```json
{
  "id": "fixture_011_cooling_coil",
  "name": "Descriptive name of equipment",
  "description": "Brief description of the submittal type",
  "pdf_content": "Copy actual text from PDF (or use PDF extraction tool)",
  "expected": {
    "extracted_spec": {
      "equipment_type": "Exact equipment type",
      "manufacturer": "Exact manufacturer name",
      "model": "Exact model number",
      "design_specs": {
        "key_spec_1": "value",
        "key_spec_2": "value"
      }
    },
    "expected_min_citations": 4,
    "expected_steps_count_range": [6, 10],
    "expected_checklist_items": [
      "keyword from expected checklist step 1",
      "keyword from expected checklist step 2",
      "keyword from expected checklist step 3"
    ]
  }
}
```

### Step 4: Test Your Fixture

```bash
# Test just your new fixture
cd backend/ai_service/eval
python -c "
from test_cx_execution import CxExecutionEvaluator
import json

eval = CxExecutionEvaluator()
with open('fixtures/fixture_011_cooling_coil.json') as f:
    fixture = json.load(f)
result = eval.evaluate_fixture(fixture)
print(f'Passed: {result.passed}')
print(f'Spec Match: {result.extracted_spec_match}')
print(f'Citations: {result.citation_count}/{fixture[\"expected\"][\"expected_min_citations\"]}')
"
```

### Step 5: Update Baseline (Optional)

If adding fixtures to improve coverage (not fixing a bug):

```bash
# Run full evaluation to get new baseline
python test_cx_execution.py

# This automatically updates baseline.json
# Commit both the fixture and updated baseline
```

### Step 6: Submit PR

```bash
git add fixtures/fixture_011_cooling_coil.json
git add baseline.json  # If baseline was updated
git commit -m "test: Add fixture for cooling coil extraction edge case"
git push origin your-branch
```

The GitHub Action will automatically run evaluation on your PR.

## Quality Thresholds

The system enforces these minimum thresholds:
- **Pass Rate**: ≥70% of fixtures must pass
- **Citation Recall**: ≥60% average citation coverage
- **Checklist Coverage**: ≥60% average checklist item coverage
- **Regression Limit**: <10% drop from baseline on any metric

## CI Integration

The `ai-eval` GitHub Action runs automatically on:
- Every PR touching `backend/ai_service/**`, `backend/prompts/**`, or `fixtures/**`
- Every merge to main (to update baseline)
- Manual trigger via GitHub Actions UI

Failed evaluations block PR merges.

## Monitoring Performance

Track AI quality over time:

```sql
-- View recent evaluation runs
SELECT 
    run_id,
    created_at,
    fixtures_passed || '/' || fixtures_total as score,
    round(pass_rate * 100, 1) || '%' as pass_rate,
    round(avg_citation_recall * 100, 1) || '%' as citation_recall
FROM eval_run_summaries
ORDER BY created_at DESC
LIMIT 10;

-- Find problem fixtures
SELECT 
    fixture_id,
    COUNT(*) as total_runs,
    AVG(CASE WHEN passed THEN 1 ELSE 0 END) as pass_rate
FROM eval_runs
GROUP BY fixture_id
HAVING AVG(CASE WHEN passed THEN 1 ELSE 0 END) < 0.5
ORDER BY pass_rate ASC;
```

## Troubleshooting

### "No baseline found"
- Run evaluation locally to create initial baseline
- Or copy from another branch: `git checkout main -- baseline.json`

### Fixture keeps failing
1. Check if PDF content accurately represents real document
2. Verify expected values are realistic
3. Consider if AI model needs prompt tuning
4. Check citation requirements aren't too strict

### Regression detected on good changes
- Regression detection has 10% tolerance
- If legitimate improvement causes metric change, update baseline:
  ```bash
  python test_cx_execution.py  # Creates new baseline.json
  git add baseline.json
  git commit -m "chore: Update baseline after prompt improvements"
  ```

## Data Network Effect

This evaluation framework implements a data flywheel:
1. **Capture**: Production issues become test fixtures
2. **Prevent**: CI blocks similar issues from reoccurring  
3. **Improve**: Growing fixture set improves model robustness
4. **Compound**: Each customer correction benefits all future users

The fixture set grows organically from real-world usage, making the AI progressively more reliable without manual test creation.