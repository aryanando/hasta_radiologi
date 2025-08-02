#!/bin/bash

echo "🏥 Setting up Hasta Radiologi PACS Viewer"
echo "=========================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to the pacs-viewer directory
echo "📂 Navigating to PACS viewer directory..."
cd "$PROJECT_ROOT/pacs-viewer" || {
    echo "❌ Error: pacs-viewer directory not found!"
    echo "   Please make sure you're in the project root directory."
    exit 1
}

# Check if we have the OHIF repository
if [ ! -f "package.json" ]; then
    echo "❌ Error: This doesn't appear to be an OHIF viewer directory!"
    echo "   package.json not found."
    exit 1
fi

# Display current directory for confirmation
echo "✅ Found OHIF viewer at: $(pwd)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    echo "   This may take a few minutes..."
    
    # Prefer yarn for OHIF (better for monorepo)
    if command -v yarn &> /dev/null; then
        echo "   Using Yarn (recommended for OHIF)..."
        yarn install
    else
        echo "   Yarn not found, using NPM with legacy peer deps..."
        npm install --legacy-peer-deps
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install dependencies!"
        echo "   Please check your internet connection and try again."
        exit 1
    fi
    
    echo "✅ Dependencies installed successfully!"
else
    echo "✅ Dependencies already installed!"
fi

# Copy our custom configuration
echo "⚙️  Configuring for Hasta Radiologi Orthanc..."
CUSTOM_CONFIG="platform/app/public/config/hasta_radiologi.js"

if [ -f "$CUSTOM_CONFIG" ]; then
    echo "✅ Custom configuration already exists at: $CUSTOM_CONFIG"
else
    echo "❌ Error: Custom configuration file not found!"
    echo "   Expected: $CUSTOM_CONFIG"
    exit 1
fi

# Check if Orthanc is running
echo "🔍 Checking Orthanc server..."
if curl -s "http://localhost:8042/system" > /dev/null 2>&1; then
    echo "✅ Orthanc server is running on localhost:8042"
    
    # Get Orthanc system info
    echo "📊 Orthanc Server Information:"
    curl -s "http://localhost:8042/system" | grep -E '"Name"|"Version"|"DicomAet"' | sed 's/^/   /'
else
    echo "⚠️  Warning: Orthanc server is not responding on localhost:8042"
    echo "   Please make sure Orthanc is running before starting the viewer."
fi

# Check for existing studies in Orthanc
echo "🔍 Checking for studies in Orthanc..."
STUDY_COUNT=$(curl -s "http://localhost:8042/studies" 2>/dev/null | grep -o '\{' | wc -l)
if [ "$STUDY_COUNT" -gt 0 ]; then
    echo "✅ Found $STUDY_COUNT studies in Orthanc"
else
    echo "📭 No studies found in Orthanc"
    echo "   You can upload studies using the DICOM API we created earlier:"
    echo "   npm run quick:demo"
fi

echo ""
echo "🚀 Setup Complete!"
echo "=================="
echo ""
echo "To start the PACS viewer:"
echo "1. Make sure Orthanc is running: http://localhost:8042"
echo "2. Start the viewer with:"
echo "   cd $PROJECT_ROOT/pacs-viewer"
echo "   APP_CONFIG=config/hasta_radiologi.js yarn dev"
echo ""
echo "Or use the quick start script:"
echo "   ./start-pacs-viewer.sh"
echo ""
echo "The viewer will be available at: http://localhost:3000"
echo ""
echo "🔧 Configuration:"
echo "   - Orthanc Server: localhost:8042"
echo "   - DICOMweb Root: http://localhost:8042/dicom-web"
echo "   - WADO Root: http://localhost:8042/wado"
echo "   - Config File: $CUSTOM_CONFIG"
echo ""
echo "💡 Quick Commands (from project root):"
echo "   npm run quick:demo    # Send test DICOM to Orthanc"
echo "   npm run quick:batch   # Send 5 test patients"
echo "   npm run quick:help    # Show all commands"
