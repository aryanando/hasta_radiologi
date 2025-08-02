#!/bin/bash

echo "🏥 Starting Hasta Radiologi PACS Viewer"
echo "======================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to the pacs-viewer directory
cd "$PROJECT_ROOT/pacs-viewer" || {
    echo "❌ Error: pacs-viewer directory not found!"
    echo "   Please run setup-pacs-viewer.sh first."
    exit 1
}

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Error: Dependencies not installed!"
    echo "   Please run setup-pacs-viewer.sh first."
    exit 1
fi

# Check if Orthanc is running
echo "🔍 Checking Orthanc server..."
if curl -s "http://localhost:8042/system" > /dev/null 2>&1; then
    echo "✅ Orthanc server is running on localhost:8042"
else
    echo "❌ Error: Orthanc server is not running!"
    echo "   Please start Orthanc server first."
    echo "   Expected at: http://localhost:8042"
    exit 1
fi

# Check for studies
STUDY_COUNT=$(curl -s "http://localhost:8042/studies" 2>/dev/null | grep -o '\{' | wc -l)
if [ "$STUDY_COUNT" -gt 0 ]; then
    echo "✅ Found $STUDY_COUNT studies in Orthanc"
else
    echo "⚠️  No studies found in Orthanc"
    echo "   Tip: Use 'npm run quick:demo' to send test data"
fi

echo ""
echo "🚀 Starting OHIF Viewer with Hasta Radiologi configuration..."
echo "   Configuration: config/hasta_radiologi.js"
echo "   Orthanc: http://localhost:8042"
echo "   Viewer will be at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the viewer"
echo ""

# Start the development server with our custom configuration
APP_CONFIG=config/hasta_radiologi.js yarn dev
