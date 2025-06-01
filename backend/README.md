# Zomato Ops Pro Backend

Backend API for the Zomato Ops Pro application, built with Node.js, Express, and MongoDB.

## Features

- Authentication with JWT
- Role-based authorization (Restaurant Manager and Delivery Partner)
- Order management system
- Real-time delivery tracking
- Location-based delivery partner assignment

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Setup

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Create a .env file in the root directory with the following variables:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zomato-ops-pro
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
```

4. Start the development server
```bash
npm run dev
```

## API Endpoints

### Authentication Routes
- POST `/api/v1/auth/register` - Register a new user
- POST `/api/v1/auth/login` - Login user
- GET `/api/v1/auth/me` - Get current user
- PUT `/api/v1/auth/updatedetails` - Update user details
- PUT `/api/v1/auth/updatepassword` - Update password

### Order Routes
- POST `/api/v1/orders` - Create a new order (Restaurant Manager only)
- GET `/api/v1/orders` - Get all orders
- GET `/api/v1/orders/:id` - Get single order
- PUT `/api/v1/orders/:id/status` - Update order status
- POST `/api/v1/orders/:id/assign` - Assign delivery partner (Restaurant Manager only)

### Delivery Partner Routes
- GET `/api/v1/delivery-partners/available` - Get all available delivery partners
- POST `/api/v1/delivery-partners/:id/available` - Update delivery partner availability
- GET `/api/v1/delivery-partners/:id/current-delivery` - Get current delivery
- PUT `/api/v1/delivery-partners/:id/location` - Update delivery partner location

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected routes, include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-token>
```

## Error Handling

The API returns consistent error responses in the following format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## Development

To start the development server with hot reload:

```bash
npm run dev
```

## Production

To start the production server:

```bash
npm start
```

## License

ISC 