# Zomato Ops Pro – Smart Kitchen + Delivery Hub

A full-stack logistics coordination platform for managing restaurant order flow and delivery partner assignments.

## Project Structure
```
zomato-ops-pro/
├── backend/           # Spring Boot backend
└── frontend/         # React frontend
```

## Technology Stack

### Backend
- Java 17
- Spring Boot 3.1.x
- Spring Security
- Spring Data JPA
- H2 Database (in-memory)
- Maven
- Swagger/OpenAPI

### Frontend
- React 18
- TypeScript
- Material UI
- Axios
- React Router
- Redux Toolkit

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the project:
   ```bash
   ./mvnw clean install
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
The backend will start on http://localhost:8080

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
The frontend will start on http://localhost:3000

## Features

### Core Features
1. Role-based Authentication
   - Restaurant Manager
   - Delivery Partner

2. Restaurant Manager Dashboard
   - Order Management
   - Delivery Partner Assignment
   - Real-time Order Tracking
   - Smart Dispatch Time Calculation

3. Delivery Partner Interface
   - Order Assignment View
   - Status Updates
   - Availability Management

### Advanced Features
- Real-time Updates
- Smart Partner Assignment
- Order Status Validation
- Visual Order Tracking

## API Documentation
- Swagger UI: http://localhost:8080/swagger-ui.html
- API Base URL: http://localhost:8080/api/v1

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details 