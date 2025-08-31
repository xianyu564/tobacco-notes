#!/bin/bash

# Development Environment Setup Script for Tobacco Notes
# This script sets up the complete development environment

set -e

echo "🚀 Setting up Tobacco Notes Development Environment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check requirements
print_status "Checking system requirements..."

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python $PYTHON_VERSION found"
else
    print_error "Python 3 is required but not found"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION found"
else
    print_warning "Node.js not found. Some testing features may not work."
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION found"
fi

# Install Python dependencies
print_status "Installing Python dependencies..."
if [ -f "tools/requirements.txt" ]; then
    pip3 install --user -r tools/requirements.txt
    print_success "Python dependencies installed"
else
    print_warning "No requirements.txt found in tools/ directory"
fi

# Install Node.js dependencies for testing
print_status "Installing Node.js testing dependencies..."
if [ -d "docs/js/tests" ] && [ -f "docs/js/tests/package.json" ]; then
    cd docs/js/tests
    npm install
    cd ../../..
    print_success "Node.js testing dependencies installed"
else
    print_warning "No test package.json found"
fi

# Validate content
print_status "Running content validation..."
if python3 tools/validate_content.py; then
    print_success "Content validation passed"
else
    print_warning "Content validation found issues - check the report"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p docs/data
mkdir -p docs/assets
mkdir -p tmp
mkdir -p logs
print_success "Directories created"

# Build search index if possible
print_status "Building search index..."
if [ -f "tools/build_search_index.py" ]; then
    python3 tools/build_search_index.py
    print_success "Search index built"
else
    print_warning "Search index builder not found"
fi

# Generate feeds if possible
print_status "Generating feeds..."
if [ -f "tools/build_feeds.py" ]; then
    python3 tools/build_feeds.py
    print_success "Feeds generated"
else
    print_warning "Feed generator not found"
fi

# Start development server
print_status "Starting development server..."
echo "=================================================="
print_success "Development environment setup complete!"
echo ""
print_status "Available commands:"
echo "  • Run development server: cd docs && python3 -m http.server 3000"
echo "  • Run tests: cd docs/js/tests && npm test"
echo "  • Run content validation: python3 tools/validate_content.py"
echo "  • Run feed validation: python3 tools/validate_feeds.py"
echo ""
print_status "Access the site at: http://localhost:3000"
echo "=================================================="

# Option to start server immediately
read -p "Start development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting server..."
    cd docs
    python3 -m http.server 3000
fi