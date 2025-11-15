#!/usr/bin/env python3
"""Create a valid combined test plan with proper format"""

import json

# Read the original 19 tests
with open('testsprite_tests/testsprite_frontend_test_plan_original_backup.json', 'r', encoding='utf-8') as f:
    original_tests = json.load(f)

# Read AI models tests
with open('testsprite_tests/ai_models_integration_tests.json', 'r', encoding='utf-8') as f:
    ai_tests = json.load(f)

# Combine only valid tests
all_tests = original_tests + ai_tests

print(f"Combined {len(original_tests)} original + {len(ai_tests)} AI tests = {len(all_tests)} total")

# Validate all tests have required fields
valid_tests = []
for i, test in enumerate(all_tests):
    if 'id' in test and 'title' in test and 'description' in test and 'steps' in test:
        valid_tests.append(test)
    else:
        print(f"[WARN] Test {i} missing required fields, skipping")

print(f"Valid tests: {len(valid_tests)}")

# Save the valid combined test plan
with open('testsprite_tests/testsprite_frontend_test_plan.json', 'w', encoding='utf-8') as f:
    json.dump(valid_tests, f, indent=2, ensure_ascii=False)

print(f"[OK] Saved {len(valid_tests)} valid tests to testsprite_frontend_test_plan.json")
