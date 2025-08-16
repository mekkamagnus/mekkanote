# CLAUDE.md

## Test-Driven Development (TDD)

### Implementation Guidelines:
1. **Red-Green-Refactor Cycle**:
   - Write failing tests first (Red)
   - Implement minimal code to pass (Green)
   - Improve code without breaking tests (Refactor)

2. **Testing Tools**:
   - Use Deno's built-in test runner (`Deno.test`)
   - For Node.js fallback: Jest or Mocha/Chai
   - Coverage: Aim for ≥80% branch coverage

3. **Test Structure**:
   - Unit tests: Isolated component tests
   - Integration tests: Service interactions
   - E2E tests: Critical user journeys

4. **Best Practices**:
   - Tests should be deterministic
   - Mock external dependencies
   - Test behavior, not implementation
   - Keep tests fast (<100ms per unit test)

## Readme-Driven Development (RDD)

### Implementation Guidelines:
1. **Document First**:
   - Write README.md before code
   - Define public API interfaces
   - Document usage examples

2. **Key Sections**:
   - Purpose: Clear problem statement
   - Installation: Setup instructions
   - Usage: Code examples
   - API: Detailed interface documentation
   - Contributing: Development workflow

3. **Best Practices**:
   - Keep docs in sync with code
   - Use code examples liberally
   - Document edge cases
   - Include version compatibility

4. **Validation**:
   - Verify examples against actual implementation
   - Test code samples in CI
   - Update docs with major changes