# Daily Expenses Sharing Application

## Project Overview

The Daily Expenses Sharing Application allows users to manage and share expenses among a group. Users can add expenses, split them equally, by exact amounts, or by percentages. The application includes user authentication and the ability to download balance sheets as CSV files.

## Technologies Used

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: (Assumed to be React, though not included in the provided code)
- **Authentication**: JWT
- **CSV Export**: `csv-writer`
- **Password Hashing**: `bcryptjs`
- **Environment Variables**: `dotenv`

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/kk7188048/daily-expenses-sharing.git
   cd daily-expenses-sharing



2. **Install dependencies:**

  ```bash
      npm install

### Create a .env file in the root directory with the following content:

   ```env
      JWT_SECRET=your_jwt_secret
      MONGO_DB

### Run the application:

   ```bash
      npm start

###The server will start on port 3000.




# API Endpoints

## User Endpoints

### Create User

**POST** `/api/users`


### Login User

**POST /api/users/login**

### Get User Profile

**GET /api/users/profile**

## Expense Endpoints

### Add Expense

**POST /api/expenses**

### Get User Expenses

**GET /api/expenses/:userId**

### Download Balance Sheet

**GET /api/expenses/download**

**Response:**

The CSV file `expenses.csv` will be downloaded.


# Folder Structure

- **controllers**: Contains the business logic for handling requests.
- **models**: Contains Mongoose models for MongoDB schemas.
- **middleware**: Contains middleware for authentication.
- **routes**: Contains route definitions.
- **utils**: Contains utility functions such as JWT token generation.
- **server.js**: Main entry point of the application.

