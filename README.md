# ProgressTracker Backend

This is the backend server for the ProgressTracker application, built with Node.js and Express.

## Features

- RESTful API architecture
- User authentication and authorization
- File upload capabilities
- MongoDB database integration
- Secure password hashing
- JWT-based authentication
- CORS enabled
- Environment variable configuration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/devrajoshi/ProgressTracker-Backend
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middlewares/    # Custom middleware
├── models/         # Database models
├── public/         # Static files
├── routes/         # API routes
├── utils/          # Utility functions
├── .env            # Environment variables
├── server.js       # Main application file
└── package.json    # Project dependencies
```

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests (currently not configured)

## Dependencies

- express: Web framework
- mongoose: MongoDB ODM
- bcryptjs: Password hashing
- jsonwebtoken: JWT authentication
- multer: File upload handling
- cors: Cross-origin resource sharing
- dotenv: Environment variable management
- cookie-parser: Cookie parsing middleware

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- CORS enabled for specified origins
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 