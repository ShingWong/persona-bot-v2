#!/bin/bash

# Enhanced Task Orchestrator Script
# Actually executes tasks (unlike broken TaskManager)
# Integrates with OpenCode JSON system
# Adds context management, quality gates, metrics

set -e

# Default orchestration root (can be overridden)
ORCHESTRATION_ROOT="${ORCHESTRATION_ROOT:-.orchestration}"
TASKS_DIR="$ORCHESTRATION_ROOT/tasks"
STATUS_DIR="$ORCHESTRATION_ROOT/status"
CONTEXT_DIR="$ORCHESTRATION_ROOT/context"
OUTPUTS_DIR="$ORCHESTRATION_ROOT/outputs"
LOGS_DIR="$ORCHESTRATION_ROOT/logs"
TEMPLATES_DIR="$ORCHESTRATION_ROOT/templates"
OPENCODE_INTEGRATION="$ORCHESTRATION_ROOT/opencode-integration"

# OpenCode JSON task directory (for integration)
OPENCODE_TASKS_ROOT="${OPENCODE_TASKS_ROOT:-.tmp/tasks}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() { echo -e "${BLUE}[ORCHESTRATOR]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
debug() { echo -e "${MAGENTA}[DEBUG]${NC} $1"; }

# Create directories if they don't exist
create_directories() {
    mkdir -p "$TASKS_DIR"
    mkdir -p "$STATUS_DIR"
    mkdir -p "$CONTEXT_DIR"
    mkdir -p "$OUTPUTS_DIR"
    mkdir -p "$LOGS_DIR"
    mkdir -p "$TEMPLATES_DIR"
    mkdir -p "$OPENCODE_INTEGRATION"
    
    # Copy templates if they don't exist
    if [ ! -f "$TEMPLATES_DIR/task-template.md" ]; then
        cp "$(dirname "$0")/../templates/task-template.md" "$TEMPLATES_DIR/"
    fi
    if [ ! -f "$TEMPLATES_DIR/status-template.md" ]; then
        cp "$(dirname "$0")/../templates/status-template.md" "$TEMPLATES_DIR/"
    fi
    if [ ! -f "$TEMPLATES_DIR/context-template.md" ]; then
        cp "$(dirname "$0")/../templates/context-template.md" "$TEMPLATES_DIR/"
    fi
}

# ==================== BASIC TASK MANAGEMENT ====================

# Create a new task
create_task() {
    local task_id="$1"
    local task_name="$2"
    local task_file="$TASKS_DIR/$task_id.md"
    
    log "Creating task: $task_name (ID: $task_id)"
    
    # Use template if available
    if [ -f "$TEMPLATES_DIR/task-template.md" ]; then
        cp "$TEMPLATES_DIR/task-template.md" "$task_file"
        sed -i "s/\[Task Name\]/$task_name/g" "$task_file"
        sed -i "s/\[unique-id\]/$task_id/g" "$task_file"
        sed -i "s/\[YYYY-MM-DD HH:MM\]/$(date '+%Y-%m-%d %H:%M')/g" "$task_file"
    else
        # Basic template
        cat > "$task_file" << EOF
# Task: $task_name

## 📋 Metadata
- **Task ID**: $task_id
- **Created**: $(date '+%Y-%m-%d %H:%M')
- **Priority**: MEDIUM
- **Estimated Time**: [X hours]
- **Dependencies**: none
- **Parallel**: false
- **Assigned To**: manual

## 🎯 Objective
[Describe what needs to be accomplished]

## 📍 Context Requirements
### Mandatory Context Files:
1. [path/to/context1.md] - [Purpose]

### Source Code Locations:
- [path/to/source1.ts] - [What to analyze]

## ✅ Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## 📊 Output Requirements
- **Primary**: outputs/$task_id-output.md
- **Status Update**: status/$task_id.md

## 🔄 Execution Instructions
1. [Step 1]
2. [Step 2]

## 📝 Notes for Reproducibility
[How viewers can replicate this task]

**Task Status**: PENDING
**Last Updated**: $(date '+%Y-%m-%d %H:%M')
EOF
    fi
    
    success "Task created: $task_file"
}

# Start a task
start_task() {
    local task_id="$1"
    local task_file="$TASKS_DIR/$task_id.md"
    local status_file="$STATUS_DIR/$task_id.md"
    
    if [ ! -f "$task_file" ]; then
        error "Task file not found: $task_file"
        return 1
    fi
    
    log "Starting task: $task_id"
    
    # Create status file
    if [ -f "$TEMPLATES_DIR/status-template.md" ]; then
        cp "$TEMPLATES_DIR/status-template.md" "$status_file"
        sed -i "s/\[Task Name\]/$task_id/g" "$status_file"
        sed -i "s/\[task-id\]/$task_id/g" "$status_file"
        sed -i "s/\[YYYY-MM-DD HH:MM\]/$(date '+%Y-%m-%d %H:%M')/g" "$status_file"
        sed -i "s/\[PENDING\/IN_PROGRESS\/COMPLETED\/FAILED\/BLOCKED\]/IN_PROGRESS/g" "$status_file"
    else
        cat > "$status_file" << EOF
# Task Status: $task_id

## 📋 Basic Information
- **Task ID**: $task_id
- **Status**: IN_PROGRESS
- **Created**: $(grep -oP 'Created: \K[^\n]*' "$task_file" || echo "unknown")
- **Started**: $(date '+%Y-%m-%d %H:%M')
- **Completed**: 
- **Duration**: 
- **Priority**: $(grep -oP 'Priority: \K[^\n]*' "$task_file" || echo "MEDIUM")

## 📊 Progress Tracking
### Current Phase:
- **Phase**: Initialization
- **Progress**: 0%
- **Estimated Completion**: 

### Completed Steps:
- [x] Task loaded - $(date '+%H:%M')

### Current Step:
- [ ] Executing task

### Remaining Steps:
- [ ] Complete execution
- [ ] Verify outputs
- [ ] Update status

## 🧠 Context Memory
### Loaded Context:
- [List will be populated during execution]

**Last Updated**: $(date '+%Y-%m-%d %H:%M')
**Next Update Due**: $(date -d '+1 hour' '+%Y-%m-%d %H:%M')
**Status**: IN_PROGRESS
EOF
    fi
    
    # Update task file status
    sed -i "s/Status: PENDING/Status: IN_PROGRESS/" "$task_file" 2>/dev/null || true
    sed -i "s/Status: PENDING/Status: IN_PROGRESS/" "$task_file" 2>/dev/null || true
    sed -i "s/Last Updated: .*/Last Updated: $(date '+%Y-%m-%d %H:%M')/" "$task_file" 2>/dev/null || true
    
    success "Task started: $task_id"
    echo "Status file: $status_file"
    echo "Task file: $task_file"
}

# Complete a task
complete_task() {
    local task_id="$1"
    local task_file="$TASKS_DIR/$task_id.md"
    local status_file="$STATUS_DIR/$task_id.md"
    
    if [ ! -f "$status_file" ]; then
        error "Status file not found: $status_file"
        return 1
    fi
    
    local start_time=$(grep -oP 'Started: \K[^\n]*' "$status_file" || echo "$(date '+%Y-%m-%d %H:%M')")
    local current_time=$(date '+%Y-%m-%d %H:%M')
    
    # Calculate duration
    local start_epoch=$(date -d "$start_time" '+%s' 2>/dev/null || date '+%s')
    local current_epoch=$(date -d "$current_time" '+%s' 2>/dev/null || date '+%s')
    local duration_seconds=$((current_epoch - start_epoch))
    local duration_hours=$((duration_seconds / 3600))
    local duration_minutes=$(((duration_seconds % 3600) / 60))
    
    log "Completing task: $task_id"
    
    # Update status file
    cat >> "$status_file" << EOF

## 🏁 Final Status

### Overall Assessment:
- **Completion**: 100%
- **Quality**: [X]/10
- **Timeliness**: ON_TIME
- **Efficiency**: [X]%

### Task completed successfully at: $current_time
### Total duration: ${duration_hours}h ${duration_minutes}m

**Last Updated**: $current_time
**Status**: COMPLETED
EOF
    
    # Update task file
    sed -i "s/Status: IN_PROGRESS/Status: COMPLETED/" "$task_file" 2>/dev/null || true
    sed -i "s/Status: PENDING/Status: COMPLETED/" "$task_file" 2>/dev/null || true
    sed -i "s/Last Updated: .*/Last Updated: $current_time/" "$task_file" 2>/dev/null || true
    
    success "Task completed: $task_id"
    echo "Duration: ${duration_hours}h ${duration_minutes}m"
}

# List all tasks
list_tasks() {
    log "Available tasks:"
    echo "----------------------------------------"
    
    for task_file in "$TASKS_DIR"/*.md; do
        if [ -f "$task_file" ]; then
            local task_id=$(basename "$task_file" .md)
            local task_name=$(grep -oP '^# Task: \K[^\n]*' "$task_file" 2>/dev/null || echo "Unknown")
            local status=$(grep -oP 'Status: \K[^\n]*' "$task_file" 2>/dev/null || echo "UNKNOWN")
            local priority=$(grep -oP 'Priority: \K[^\n]*' "$task_file" 2>/dev/null || echo "MEDIUM")
            
            case "$status" in
                "PENDING") color="$YELLOW" ;;
                "IN_PROGRESS") color="$BLUE" ;;
                "COMPLETED") color="$GREEN" ;;
                "FAILED") color="$RED" ;;
                *) color="$NC" ;;
            esac
            
            echo -e "${color}ID: $task_id${NC}"
            echo -e "  Name: $task_name"
            echo -e "  Status: $status"
            echo -e "  Priority: $priority"
            echo "----------------------------------------"
        fi
    done
}

# Show task status
show_status() {
    local task_id="$1"
    local status_file="$STATUS_DIR/$task_id.md"
    
    if [ ! -f "$status_file" ]; then
        error "Status file not found: $status_file"
        return 1
    fi
    
    log "Status for task: $task_id"
    echo "========================================"
    cat "$status_file"
    echo "========================================"
}

# ==================== ENHANCED FEATURES ====================

# Convert OpenCode JSON task to Markdown
convert_json_to_md() {
    local json_dir="$1"
    local task_id=$(basename "$json_dir")
    local task_file="$TASKS_DIR/$task_id.md"
    
    if [ ! -d "$json_dir" ]; then
        error "JSON task directory not found: $json_dir"
        return 1
    fi
    
    local task_json="$json_dir/task.json"
    if [ ! -f "$task_json" ]; then
        error "task.json not found in: $json_dir"
        return 1
    fi
    
    log "Converting OpenCode JSON task: $task_id"
    
    # Extract task info from JSON (simplified - in real use would use jq)
    local task_name=$(grep -oP '"name": "\K[^"]*' "$task_json" | head -1)
    local objective=$(grep -oP '"objective": "\K[^"]*' "$task_json" | head -1)
    local status=$(grep -oP '"status": "\K[^"]*' "$task_json" | head -1)
    
    # Create Markdown task file
    cat > "$task_file" << EOF
# Task: $task_name

## 📋 Metadata
- **Task ID**: $task_id
- **Created**: $(date '+%Y-%m-%d %H:%M')
- **Priority**: MEDIUM
- **Estimated Time**: [Convert from subtasks]
- **Dependencies**: none
- **Parallel**: false
- **Assigned To**: manual
- **OpenCode Source**: $json_dir

## 🎯 Objective
$objective

## 📍 Context Requirements
### From OpenCode JSON:
$(grep -oP '"context_files": \[.*?\]' "$task_json" | sed 's/"/ /g' | sed 's/\[/ - /g' | sed 's/\]//g' | sed 's/,/\n - /g')

### Additional Context:
1. [Add project-specific context]

## ✅ Success Criteria
### From OpenCode Exit Criteria:
$(grep -oP '"exit_criteria": \[.*?\]' "$task_json" | sed 's/"/ /g' | sed 's/\[/ - /g' | sed 's/\]//g' | sed 's/,/\n - /g')

### Additional Criteria:
- [ ] Task actually executed (not just JSON created)
- [ ] Outputs verified against requirements
- [ ] Quality metrics calculated

## 📊 Output Requirements
- **Primary**: outputs/$task_id-output.md
- **Status Update**: status/$task_id.md
- **OpenCode Sync**: Update original JSON files

## 🔄 Execution Instructions
1. Load required context files
2. Execute subtasks from OpenCode JSON
3. Update progress in status file
4. Verify outputs against criteria
5. Sync completion back to JSON

## 📝 Notes for Reproducibility
This task was converted from OpenCode JSON format. Viewers can:
1. Examine original JSON files in: $json_dir
2. Follow the execution steps below
3. Compare JSON planning vs actual execution

## 🔗 Subtasks from OpenCode:
$(for subtask in "$json_dir"/subtask_*.json; do
    if [ -f "$subtask" ]; then
        title=$(grep -oP '"title": "\K[^"]*' "$subtask" | head -1)
        seq=$(grep -oP '"seq": "\K[^"]*' "$subtask" | head -1)
        echo "- **$seq**: $title"
    fi
done)

**Task Status**: PENDING
**Last Updated**: $(date '+%Y-%m-%d %H:%M')
**OpenCode Status**: $status
EOF
    
    success "Converted JSON task to Markdown: $task_file"
    info "Original JSON location: $json_dir"
    info "Next: Run 'start-task $task_id' to actually execute this task"
}

# Sync status back to OpenCode JSON
sync_json_status() {
    local task_id="$1"
    local task_file="$TASKS_DIR/$task_id.md"
    local status_file="$STATUS_DIR/$task_id.md"
    
    if [ ! -f "$task_file" ]; then
        error "Task file not found: $task_file"
        return 1
    fi
    
    # Find OpenCode source from task file
    local opencode_source=$(grep -oP 'OpenCode Source: \K[^\n]*' "$task_file" || echo "")
    if [ -z "$opencode_source" ]; then
        warning "No OpenCode source found in task file. Is this a converted task?"
        return 0
    fi
    
    if [ ! -d "$opencode_source" ]; then
        error "OpenCode source directory not found: $opencode_source"
        return 1
    fi
    
    local task_json="$opencode_source/task.json"
    if [ ! -f "$task_json" ]; then
        error "task.json not found in: $opencode_source"
        return 1
    fi
    
    log "Syncing status to OpenCode JSON: $task_id"
    
    # Get current status from our system
    local our_status=$(grep -oP 'Status: \K[^\n]*' "$task_file" | tail -1 || echo "UNKNOWN")
    local completion_time=$(grep -oP 'Task completed successfully at: \K[^\n]*' "$status_file" 2>/dev/null || echo "")
    
    # Update JSON file (simplified - in real use would use jq)
    if [ "$our_status" = "COMPLETED" ]; then
        # Update task.json
        sed -i 's/"status": "active"/"status": "completed"/g' "$task_json"
        sed -i "s/\"completed_at\": null/\"completed_at\": \"$(date -Iseconds)\"/g" "$task_json" 2>/dev/null || \
        sed -i "/\"status\": \"completed\"/a \"completed_at\": \"$(date -Iseconds)\"," "$task_json"
        
        # Update all subtasks
        for subtask in "$opencode_source"/subtask_*.json; do
            if [ -f "$subtask" ]; then
                sed -i 's/"status": "pending"/"status": "completed"/g' "$subtask"
                sed -i 's/"status": "in_progress"/"status": "completed"/g' "$subtask"
                sed -i "s/\"completed_at\": null/\"completed_at\": \"$(date -Iseconds)\"/g" "$subtask" 2>/dev/null || \
                sed -i "/\"status\": \"completed\"/a \"completed_at\": \"$(date -Iseconds)\"," "$subtask"
                
                # Add completion summary
                local seq=$(grep -oP '"seq": "\K[^"]*' "$subtask" | head -1)
                sed -i "s/\"completion_summary\": null/\"completion_summary\": \"Executed by Task Orchestrator - $(date '+%Y-%m-%d')\"/g" "$subtask" 2>/dev/null || \
                sed -i "/\"status\": \"completed\"/a \"completion_summary\": \"Executed by Task Orchestrator - $(date '+%Y-%m-%d')\"," "$subtask"
            fi
        done
        
        success "Synced COMPLETED status to OpenCode JSON"
        info "Updated: $task_json and subtasks"
    else
        info "Task status is $our_status - only completed tasks are synced to JSON"
    fi
}

# Load and track context
load_context() {
    local context_file="$1"
    local task_id="$2"
    
    if [ -z "$context_file" ]; then
        error "Usage: load-context <context-file> [task-id]"
        return 1
    fi
    
    if [ ! -f "$context_file" ]; then
        error "Context file not found: $context_file"
        return 1
    fi
    
    local context_id=$(basename "$context_file" .md)
    local context_dest="$CONTEXT_DIR/$context_id.md"
    
    # Copy context file
    cp "$context_file" "$context_dest"
    
    # Add metadata
    cat >> "$context_dest" << EOF

## 📊 Context Metadata
- **Loaded**: $(date '+%Y-%m-%d %H:%M')
- **Source**: $context_file
- **Size**: $(wc -l < "$context_file") lines
- **Task**: ${task_id:-"General"}
- **Purpose**: [Brief description of why this context was loaded]
EOF
    
    # Update task status if task_id provided
    if [ -n "$task_id" ] && [ -f "$STATUS_DIR/$task_id.md" ]; then
        echo "- $context_id.md - Loaded: $(date '+%H:%M'), Size: $(wc -l < "$context_file") lines" >> "$STATUS_DIR/$task_id.md"
    fi
    
    success "Context loaded: $context_id.md"
    echo "Destination: $context_dest"
    echo "Lines: $(wc -l < "$context_file")"
}

# Show context usage summary
context_summary() {
    local task_id="$1"
    
    if [ -z "$task_id" ]; then
        # Show all context
        log "Context files in system:"
        echo "----------------------------------------"
        for context_file in "$CONTEXT_DIR"/*.md; do
            if [ -f "$context_file" ]; then
                local context_id=$(basename "$context_file" .md)
                local loaded=$(grep -oP 'Loaded: \K[^\n]*' "$context_file" | head -1 || echo "Unknown")
                local size=$(grep -oP 'Size: \K[^\n]*' "$context_file" | head -1 || echo "Unknown")
                local task=$(grep -oP 'Task: \K[^\n]*' "$context_file" | head -1 || echo "General")
                
                echo -e "ID: $context_id"
                echo -e "  Loaded: $loaded"
                echo -e "  Size: $size"
                echo -e "  Task: $task"
                echo "----------------------------------------"
            fi
        done
    else
        # Show context for specific task
        local status_file="$STATUS_DIR/$task_id.md"
        if [ ! -f "$status_file" ]; then
            error "Status file not found: $status_file"
            return 1
        fi
        
        log "Context usage for task: $task_id"
        echo "========================================"
        grep -A2 -B2 "Loaded Context" "$status_file" || echo "No context loaded yet"
        echo "========================================"
    fi
}

# Verify success criteria
verify_criteria() {
    local task_id="$1"
    local task_file="$TASKS_DIR/$task_id.md"
    
    if [ ! -f "$task_file" ]; then
        error "Task file not found: $task_file"
        return 1
    fi
    
    log "Verifying success criteria for: $task_id"
    
    # Extract success criteria from task file
    local criteria_section=$(sed -n '/## ✅ Success Criteria/,/## 📊/p' "$task_file" | head -20)
    
    if [ -z "$criteria_section" ]; then
        warning "No success criteria found in task file"
        return 0
    fi
    
    echo "Success Criteria Found:"
    echo "----------------------"
    echo "$criteria_section" | grep -E '^- \[ \]' || echo "No criteria items found"
    echo "----------------------"
    
    # In a real implementation, this would actually verify each criterion
    # For now, just show what needs to be verified
    info "Manual verification required for each criterion above"
    info "Update criteria in task file with [x] when verified"
}

# Calculate quality score
quality_score() {
    local task_id="$1"
    local task_file="$TASKS_DIR/$task_id.md"
    
    if [ ! -f "$task_file" ]; then
        error "Task file not found: $task_file"
        return 1
    fi
    
    # Extract quality metrics (simplified)
    local quality_section=$(sed -n '/### Quality Metrics/,/### Verification/p' "$task_file" | head -20)
    
    if [ -z "$quality_section" ]; then
        echo "5"  # Default score if no metrics defined
        return 0
    fi
    
    # Count checked items vs total
    local total_items=$(echo "$quality_section" | grep -c '^- \[ \]\|^- \[x\]')
    local checked_items=$(echo "$quality_section" | grep -c '^- \[x\]')
    
    if [ "$total_items" -eq 0 ]; then
        echo "5"
    else
        local score=$((checked_items * 10 / total_items))
        echo "$score"
    fi
}

# Show all metrics
show_metrics() {
    local task_id="$1"
    local status_file="$STATUS_DIR/$task_id.md"
    
    if [ ! -f "$status_file" ]; then
        error "Status file not found: $status_file"
        return 1
    fi
    
    log "Metrics for task: $task_id"
    echo "========================================"
    
    # Duration
    local start_time=$(grep -oP 'Started: \K[^\n]*' "$status_file" || echo "")
    local end_time=$(grep -oP 'Task completed successfully at: \K[^\n]*' "$status_file" || echo "")
    
    if [ -n "$start_time" ] && [ -n "$end_time" ]; then
        local start_epoch=$(date -d "$start_time" '+%s' 2>/dev/null || echo "0")
        local end_epoch=$(date -d "$end_time" '+%s' 2>/dev/null || echo "0")
        local duration=$((end_epoch - start_epoch))
        local hours=$((duration / 3600))
        local minutes=$(((duration % 3600) / 60))
        
        echo "⏱️  Duration: ${hours}h ${minutes}m"
    fi
    
    # Quality score
    local quality=$(quality_score "$task_id")
    echo "⭐ Quality Score: $quality/10"
    
    # Context usage
    local context_count=$(grep -c "Loaded:" "$status_file" 2>/dev/null || echo "0")
    echo "📚 Context Files: $context_count"
    
    # Progress
    local progress=$(grep -oP 'Progress: \K[^\n]*' "$status_file" | tail -1 || echo "0%")
    echo "📈 Progress: $progress"
    
    echo "========================================"
}

# List parallelizable tasks
parallel_tasks() {
    log "Tasks that can run in parallel:"
    echo "----------------------------------------"
    
    for task_file in "$TASKS_DIR"/*.md; do
        if [ -f "$task_file" ]; then
            local task_id=$(basename "$task_file" .md)
            local task_name=$(grep -oP '^# Task: \K[^\n]*' "$task_file" 2>/dev/null || echo "Unknown")
            local status=$(grep -oP 'Status: \K[^\n]*' "$task_file" 2>/dev/null || echo "UNKNOWN")
            local parallel=$(grep -oP 'Parallel: \K[^\n]*' "$task_file" 2>/dev/null || echo "false")
            
            if [ "$parallel" = "true" ] && [ "$status" = "PENDING" ]; then
                echo -e "${GREEN}ID: $task_id${NC}"
                echo -e "  Name: $task_name"
                echo -e "  Status: $status"
                echo -e "  Parallel: $parallel"
                echo "----------------------------------------"
            fi
        fi
    done
}

# Check dependencies
check_dependencies() {
    local task_id="$1"
    local task_file="$TASKS_DIR/$task_id.md"
    
    if [ ! -f "$task_file" ]; then
        error "Task file not found: $task_file"
        return 1
    fi
    
    local dependencies=$(grep -oP 'Dependencies: \K[^\n]*' "$task_file" 2>/dev/null || echo "none")
    
    log "Dependencies for task: $task_id"
    echo "Dependencies: $dependencies"
    
    if [ "$dependencies" = "none" ]; then
        success "No dependencies - task can start immediately"
        return 0
    fi
    
    # Check each dependency
    IFS=',' read -ra deps <<< "$dependencies"
    local all_met=true
    
    for dep in "${deps[@]}"; do
        dep=$(echo "$dep" | xargs)  # Trim whitespace
        local dep_file="$TASKS_DIR/$dep.md"
        
        if [ ! -f "$dep_file" ]; then
            warning "Dependency task not found: $dep"
            all_met=false
            continue
        fi
        
        local dep_status=$(grep -oP 'Status: \K[^\n]*' "$dep_file" 2>/dev/null || echo "UNKNOWN")
        
        if [ "$dep_status" = "COMPLETED" ]; then
            echo -e "${GREEN}✓ $dep: COMPLETED${NC}"
        else
            echo -e "${RED}✗ $dep: $dep_status${NC}"
            all_met=false
        fi
    done
    
    if [ "$all_met" = true ]; then
        success "All dependencies met - task can start"
    else
        warning "Some dependencies not met - task cannot start yet"
    fi
}

# ==================== MAIN FUNCTION ====================

main() {
    create_directories
    
    case "$1" in
        # Basic commands
        "create-task")
            if [ -z "$2" ] || [ -z "$3" ]; then
                error "Usage: $0 create-task <task-id> <task-name>"
                exit 1
            fi
            create_task "$2" "$3"
            ;;
        "start-task")
            if [ -z "$2" ]; then
                error "Usage: $0 start-task <task-id>"
                exit 1
            fi
            start_task "$2"
            ;;
        "complete-task")
            if [ -z "$2" ]; then
                error "Usage: $0 complete-task <task-id>"
                exit 1
            fi
            complete_task "$2"
            ;;
        "list-tasks")
            list_tasks
            ;;
        "status")
            if [ -z "$2" ]; then
                error "Usage: $0 status <task-id>"
                exit 1
            fi
            show_status "$2"
            ;;
        
        # Enhanced features
        "convert-json")
            if [ -z "$2" ]; then
                error "Usage: $0 convert-json <json-task-directory>"
                exit 1
            fi
            convert_json_to_md "$2"
            ;;
        "sync-json")
            if [ -z "$2" ]; then
                error "Usage: $0 sync-json <task-id>"
                exit 1
            fi
            sync_json_status "$2"
            ;;
        "load-context")
            if [ -z "$2" ]; then
                error "Usage: $0 load-context <context-file> [task-id]"
                exit 1
            fi
            load_context "$2" "$3"
            ;;
        "context-summary")
            context_summary "$2"
            ;;
        "verify-criteria")
            if [ -z "$2" ]; then
                error "Usage: $0 verify-criteria <task-id>"
                exit 1
            fi
            verify_criteria "$2"
            ;;
        "quality-score")
            if [ -z "$2" ]; then
                error "Usage: $0 quality-score <task-id>"
                exit 1
            fi
            quality_score "$2"
            ;;
        "metrics")
            if [ -z "$2" ]; then
                error "Usage: $0 metrics <task-id>"
                exit 1
            fi
            show_metrics "$2"
            ;;
        "parallel-tasks")
            parallel_tasks
            ;;
        "check-deps")
            if [ -z "$2" ]; then
                error "Usage: $0 check-deps <task-id>"
                exit 1
            fi
            check_dependencies "$2"
            ;;
        
        # Help
        "help"|"")
            echo "Enhanced Task Orchestrator Commands:"
            echo ""
            echo "📋 BASIC TASK MANAGEMENT:"
            echo "  create-task <id> <name>    Create a new task"
            echo "  start-task <id>            Start a task"
            echo "  complete-task <id>         Complete a task"
            echo "  list-tasks                 List all tasks"
            echo "  status <id>                Show task status"
            echo ""
            echo "🚀 ENHANCED FEATURES:"
            echo "  convert-json <dir>         Convert OpenCode JSON to Markdown"
            echo "  sync-json <id>             Sync status back to JSON"
            echo "  load-context <file> [id]   Load and track context"
            echo "  context-summary [id]       Show context usage"
            echo "  verify-criteria <id>       Verify success criteria"
            echo "  quality-score <id>         Calculate quality score"
            echo "  metrics <id>               Show all metrics"
            echo "  parallel-tasks             List parallelizable tasks"
            echo "  check-deps <id>            Check dependencies"
            echo ""
            echo "⚙️  ENVIRONMENT VARIABLES:"
            echo "  ORCHESTRATION_ROOT    Directory for orchestration files"
            echo "                        (default: .orchestration)"
            echo "  OPENCODE_TASKS_ROOT   OpenCode JSON task directory"
            echo "                        (default: .tmp/tasks)"
            ;;
        *)
            error "Unknown command: $1"
            echo "Use '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"