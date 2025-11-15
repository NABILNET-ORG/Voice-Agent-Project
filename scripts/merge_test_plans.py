#!/usr/bin/env python3
"""Merge all test plans into one comprehensive test suite"""

import json
import os

# Read all test files
test_files = [
    'testsprite_tests/testsprite_frontend_test_plan.json',
    'testsprite_tests/ai_models_integration_tests.json',
    'testsprite_tests/comprehensive_feature_tests.json'
]

all_tests = []

for file_path in test_files:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            tests = json.load(f)
            all_tests.extend(tests)
            print(f"[OK] Loaded {len(tests)} tests from {file_path}")

print(f"\n[INFO] Total tests: {len(all_tests)}")

# Write combined test suite
output_path = 'testsprite_tests/complete_test_suite.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_tests, f, indent=2, ensure_ascii=False)

print(f"[OK] Combined test suite saved to {output_path}")
print(f"\nTest Breakdown:")
print(f"  - Original TestSprite tests: 19")
print(f"  - AI Models integration tests: 11")
print(f"  - Comprehensive feature tests: 29")
print(f"  - TOTAL: {len(all_tests)} tests")
