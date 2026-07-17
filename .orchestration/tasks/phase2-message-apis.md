# Task: Phase 2: Add Message APIs and Connect Frontend

## 📋 Metadata
- **Task ID**: phase2-message-apis
- **Created**: 2026-03-12 11:46
- **Priority**: HIGH
- **Estimated Time**: 2 hours
- **Dependencies**: phase1-auth-personas-sessions
- **Parallel**: false
- **Assigned To**: opencode
- **OpenCode Source**: none

## 🎯 Objective
Add message APIs for chat functionality and connect frontend to backend. This completes Phase 2 of the persona-bot-v2 migration from Prisma to postgres.js.

**Success is binary**: Message APIs work (CRUD operations) and frontend can authenticate and create sessions.

## 📍 Context Requirements

### Mandatory Context Files:
1. **Project Overview**: Understanding of persona-bot-v2 architecture and Phase 1 completion
2. **Database Schema**: Knowledge of Message table structure and relationships
3. **API Patterns**: Existing auth, persona, and session API patterns to follow

### Source Code Locations:
- `/usr/local/devel/persona-bot-v2/backend/src/index.ts` - Main backend with existing APIs
- `/usr/local/devel/persona-bot-v2/backend/src/services/message.service.ts` - Message service (already using postgres.js)
- `/usr/local/devel/persona-bot-v2/backend/src/lib/init-db.ts` - Database schema for Message table
- `/usr/local/devel/persona-bot-v2/frontend/` - Frontend codebase (if exists)

## ✅ Success Criteria

### Minimum Viable Completion:
- [x] **Message APIs working**: CRUD operations for messages (create, list) - tested with curl
- [x] **Session integration**: Messages linked to sessions with proper foreign key constraints - verified
- [x] **Frontend connection**: Frontend configured to connect to backend on port 3001 - tested
- [x] **Database consistency**: Message table has proper schema with defaults - recreated with correct schema

### Verification Methods:
1. **Automated tests**: curl commands to test each API endpoint
2. **Manual review**: Check database schema and foreign key relationships
3. **Integration tests**: Create session → add messages → verify counts
4. **Peer validation**: Another agent can test the APIs

## 📊 Quality Metrics (Scored 1-10)
<!-- Rate the quality of the implementation -->

### Code Quality (target: 8/10):
- [ ] **Modularity**: Follows modular design principles
- [ ] **Function purity**: Uses pure functions where possible
- [ ] **Immutability**: Avoids mutation, creates new data
- [ ] **Small functions**: Functions < 50 lines
- [ ] **Explicit dependencies**: Dependency injection used
- [ ] **Error handling**: Proper error boundaries and validation
- [ ] **Type safety**: Proper typing (TypeScript) or equivalent

### Documentation (target: 9/10):
- [ ] **Code comments**: Explanatory comments for complex logic
- [ ] **API documentation**: Clear endpoint documentation
- [ ] **Usage examples**: Examples of how to use the implementation
- [ ] **Decision rationale**: Why certain approaches were chosen

### Performance (target: 8/10):
- [ ] **Response time**: Meets performance requirements
- [ ] **Resource usage**: Efficient memory and CPU usage
- [ ] **Scalability**: Design supports future scaling

### Test Coverage (target: 7/10):
- [ ] **Unit tests**: Core logic has unit tests
- [ ] **Integration tests**: End-to-end flows tested
- [ ] **Edge cases**: Boundary conditions tested
- [ ] **Error scenarios**: Error paths tested

### Maintainability (target: 8/10):
- [ ] **Readability**: Code is easy to understand
- [ ] **Consistency**: Follows project conventions
- [ ] **Extensibility**: Easy to add new features
- [ ] **Debugability**: Easy to debug issues

## 📦 Output Requirements
<!-- What files should be created or modified -->

### Primary Deliverables:
- **Implementation**: [path/to/primary/output.ts]
- **Tests**: [path/to/test/file.test.ts]
- **Documentation**: [path/to/docs/feature.md]

### Status Updates:
- **Status file**: status/[task-id].md (auto-generated)
- **Progress updates**: Regular updates during execution

### Integration Outputs:
- **OpenCode sync**: Update .tmp/tasks/[feature]/ if converted from JSON
- **Project integration**: Ensure works with existing codebase

## 🔄 Execution Instructions

### Phase 1: Preparation (Context Loading)
1. Review Phase 1 completion: auth, personas, sessions working
2. Check message.service.ts: Already uses postgres.js, needs API endpoints
3. Verify Message table schema in database

### Phase 2: Implementation
1. **Add message APIs to backend**: Create, list, update, delete endpoints
2. **Update session integration**: Ensure messages link to sessions properly
3. **Test message APIs**: Use curl to verify all CRUD operations
4. **Check frontend**: Look for existing frontend code or create simple test

### Phase 3: Verification
1. Run API tests: curl commands for all message endpoints
2. Manual verification: Check database foreign key constraints
3. Integration test: Create session → add messages → verify counts
4. Update success criteria: Mark completed items with [x]

### Phase 4: Completion
1. Update status file with completion summary
2. Calculate quality metrics score
3. Archive context files for future reference
4. Plan Phase 3 (advanced features)

## 📝 Notes for Reproducibility
<!-- How viewers or other agents can replicate this task -->

### For Video Series Viewers:
1. **Prerequisites**: [What viewers need before starting]
2. **Setup steps**: [Initial setup instructions]
3. **Key learning points**: [What to pay attention to]
4. **Common pitfalls**: [What might go wrong and how to fix]
5. **Extension ideas**: [How to build upon this implementation]

### For Other Agents:
1. **Context loading order**: [Recommended sequence]
2. **Implementation patterns**: [Key patterns to follow]
3. **Testing strategy**: [How to approach testing]
4. **Quality checks**: [What to verify before completion]

### Educational Value:
<!-- What makes this task educational -->
- **Demonstrates**: [Key concept or pattern]
- **Teaches**: [Specific skill or approach]
- **Reinforces**: [Important principle]
- **Connects to**: [Related concepts or previous episodes]

## 🔗 Related Tasks & Dependencies

### Depends On:
<!-- Tasks that must complete before this one -->
- [Task ID]: [Brief description of dependency]

### Enables:
<!-- Tasks that can start after this completes -->
- [Task ID]: [Brief description of enabled task]

### Parallel With:
<!-- Tasks that can run concurrently -->
- [Task ID]: [Brief description of parallel task]

## ⚠️ Risks & Mitigations

### Technical Risks:
- **Risk**: [Description of technical risk]
  - **Mitigation**: [How to prevent or handle]
  - **Fallback**: [Alternative approach if risk occurs]

### Context Risks:
- **Risk**: [Missing or incomplete context]
  - **Mitigation**: [How to ensure context is adequate]
  - **Fallback**: [Where to find additional context]

### Integration Risks:
- **Risk**: [Issues integrating with existing code]
  - **Mitigation**: [Integration testing approach]
  - **Fallback**: [Isolation strategy if integration fails]

## 📈 Progress Tracking

### Estimated Timeline:
- **Preparation**: [X] minutes
- **Implementation**: [X] hours
- **Verification**: [X] minutes
- **Completion**: [X] minutes
- **Total**: [X] hours [X] minutes

### Milestones:
1. [Milestone 1: e.g., "Context loaded"] - Target: [time]
2. [Milestone 2: e.g., "Core implementation complete"] - Target: [time]
3. [Milestone 3: e.g., "Tests passing"] - Target: [time]
4. [Milestone 4: e.g., "Quality verification complete"] - Target: [time]

---

**Task Status**: PENDING  
**Last Updated**: 2026-03-12 11:46  
**Quality Score**: [0/10 - will be calculated during execution]  
**Progress**: 0%  
**Next Update Due**: 2026-03-12 11:46  

<!--
Template Notes:
- Replace all [bracketed] content with actual values
- Remove sections that don't apply to your specific task
- Add additional sections as needed for your task
- Keep educational value in mind for video series integration
- Use checkboxes [ ] for items that need verification
- Update status and timestamps as task progresses
-->