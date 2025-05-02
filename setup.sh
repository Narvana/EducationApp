#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/education_db
JWT_SECRET=xQJslU3ieVjhYt0xCUu8hhUGayx265KgfP4W0abHhvfJJA8xFO8cYVChPGhjz0JT4w1GP3vURXdXBk8jC2Hu4W49jz
EOL
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build and start Docker containers
echo "Building and starting Docker containers..."
docker-compose up --build -d

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
sleep 10

# Check if containers are running
echo "Checking container status..."
docker-compose ps

echo "Setup complete! Your application should be running at http://localhost:3000" 