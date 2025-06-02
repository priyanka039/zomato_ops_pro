# Zomato Ops Pro

Welcome to Zomato Ops Pro, a comprehensive restaurant management and delivery system. This repository contains both the frontend and backend components of our application.

## Quick Start

### Frontend Setup
1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

2. **Start Development Server**
   ```bash
   npm start
   # or
   yarn start
   ```
   The frontend will be available at [http://localhost:3000](http://localhost:3000)

### Backend Setup
1. **Set Up Environment**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/zomato-ops-pro
   JWT_SECRET=your_jwt_secret_key
   ```

3. **Start Backend Server**
   ```bash
   npm run dev
   ```
   The backend API will be available at [http://localhost:5000](http://localhost:5000)

## Features

### Restaurant Manager Features
- Order Management
  - Create new orders with detailed customer info
  - Track order status in real-time
  - View order history and statistics
- Delivery Partner Assignment
  - Assign orders to available delivery partners
  - Track delivery partner locations
  - Monitor delivery progress
- Analytics Dashboard
  - View daily order statistics
  - Track average preparation time
  - Monitor success rates and earnings

### Delivery Partner Features
- Delivery Dashboard
  - Accept and manage deliveries
  - Real-time location tracking
  - Update delivery status
- Performance Tracking
  - View earnings and statistics
  - Track delivery ratings
  - Monitor performance metrics

## Project Structure

```
zomato-ops-pro/
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── delivery/
│   │   │   ├── layout/
│   │   │   └── shared/
│   │   ├── store/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
```

## API Endpoints

### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
PUT  /api/v1/auth/updatedetails
PUT  /api/v1/auth/updatepassword
```

### Orders
```
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/{id}
PUT    /api/v1/orders/{id}/status
POST   /api/v1/orders/{id}/assign
```

### Delivery Partners
```
GET    /api/v1/delivery-partners
POST   /api/v1/delivery-partners/{id}/location
PUT    /api/v1/delivery-partners/{id}/available
GET    /api/v1/delivery-partners/{id}/current-delivery
```

## Tech Stack

### Frontend
- React 18
- Redux Toolkit (State Management)
- Material-UI (UI Components)
- Framer Motion (Animations)
- Axios (HTTP Client for API calls)
- React Router DOM (Routing)

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JSON Web Token (Authentication)
- Morgan (HTTP Request Logger Middleware)
- bcryptjs (Password Hashing)
- CORS & Cookie Parser (Request Handling)

## Environment Setup

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zomato-ops-pro
JWT_SECRET=your_jwt_secret_key
```

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Git
- npm or yarn package manager

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd zomato-ops-pro
```

### Step 2: Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/zomato-ops-pro
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. Start MongoDB:
   - Windows:
     ```bash
     "C:\Program Files\MongoDB\Server\{version}\bin\mongod.exe"
     ```
   - macOS/Linux:
     ```bash
     sudo service mongod start
     # or
     brew services start mongodb-community
     ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   Backend will run on http://localhost:5000

### Step 3: Frontend Setup
1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api/v1
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```
   Frontend will run on http://localhost:3000

### Step 4: Initial Setup
1. Create a restaurant manager account:
   - Visit http://localhost:3000/signup
   - Select role as "Restaurant Manager"
   - Fill in required details

2. Create a delivery partner account:
   - Visit http://localhost:3000/signup
   - Select role as "Delivery Partner"
   - Fill in required details

### Verification Steps
1. Backend Health Check:
   - Visit http://localhost:5000/api/v1/health
   - Should return status "OK"

2. Database Connection:
   - Check MongoDB connection in backend console
   - Should show "MongoDB Connected" message

3. Frontend-Backend Integration:
   - Try logging in with created accounts
   - Check if orders can be created and assigned

### Common Setup Issues
1. MongoDB Connection Error:
   - Verify MongoDB is running
   - Check MongoDB connection string
   - Ensure MongoDB port (27017) is not in use

2. Port Conflicts:
   - Backend: If port 5000 is in use, modify PORT in backend/.env
   - Frontend: If port 3000 is in use, modify PORT in frontend/.env

3. CORS Issues:
   - Verify backend CORS configuration
   - Check frontend API URL configuration

4. Dependencies Issues:
   ```bash
   # Clear npm cache
   npm cache clean --force
   
   # Delete node_modules and reinstall
   rm -rf node_modules
   npm install
   ```

### Development Tools
- Redux DevTools (Browser Extension) for state debugging
- MongoDB Compass for database management
- Postman for API testing

For additional help or issues, please check the troubleshooting section or raise an issue in the repository.

## Common Issues & Solutions

### WebSocket Connection Issues
- Verify backend server is running
- Check WebSocket URL configuration
- Verify internet connection
- Check browser console for errors

### Order Updates
- Refresh page to reconnect WebSocket
- Check browser console for errors
- Verify authentication token
