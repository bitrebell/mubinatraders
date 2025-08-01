#!/bin/bash

echo "🚀 Setting up College Notes Manager..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use a cloud instance."
    echo "   You can use MongoDB Atlas for a cloud solution."
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm install
cd ..

# Copy example environment file
if [ ! -f "server/.env" ]; then
    echo "📝 Creating environment file..."
    cp server/.env.example server/.env
    echo "✅ Created server/.env - Please update with your configuration"
else
    echo "✅ Environment file already exists"
fi

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p server/uploads/notes
mkdir -p server/uploads/questions
mkdir -p server/uploads/avatars

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update server/.env with your configuration"
echo "2. Start MongoDB (if running locally)"
echo "3. Run 'npm run dev' to start both servers"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
