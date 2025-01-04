# Train Seat Booking System
Implemented Sign Up, Login, and Seat Booking Functionality with Optimized Seat Selection
## Features
- **Overview:** This commit introduces the core features of user authentication (Sign Up and Login) alongside a seat booking system. These features are designed to allow users to create accounts, log in securely, and book available seats efficiently within a grid-based seating arrangement.

### **1. Sign Up Functionality:**
  - **Purpose:** Users can create a new account by providing a username and password.
  - **Features:**
    - **Password Hashing:** Passwords are hashed using bcrypt before storing them in the database to ensure user data security.
    - **Input Validation:** Basic validation checks are performed to ensure users provide valid input (e.g., non-empty username and password).
    - **Error Handling:** If a user tries to create an account with an existing username, the system will provide a meaningful error message.

### **2. Login Functionality:**
  - **Purpose:** Existing users can log in to their accounts by providing their username and password.
  - **Features:**
    - **Password Verification:** The provided password is verified against the stored hash to ensure the user’s credentials are valid.
    - **JWT Authentication:** Upon successful login, the user receives a **JSON Web Token (JWT)**, which can be used for authentication in subsequent requests. The token is stored securely to maintain the session.
    - **Session Management:** The JWT is included in the headers of protected routes to ensure only authenticated users can access certain functionality.

### **3. Seat Booking System:**
  - **Purpose:** After logging in, users can book available seats in a grid-based seating arrangement.
  - **Features:**
    - **Seat Selection:** Users can specify a starting seat and the number of seats they wish to book. The system will attempt to book the nearest available seats, minimizing the distance between them.
    - **Cost Calculation:** Each seat booked comes with an associated "cost" based on its distance from the starting seat. The Manhattan distance formula is used to calculate the distance between seats.
    - **Efficient Seat Search:** All available seats are pre-calculated for quicker access and seat booking.
    - **Success/Failure Handling:** If enough seats are available, the system will book them and return the total cost. If not, an error message is returned.

### **What Happens After Sign Up or Login:**
  - **Successful Sign Up:** The user’s account is created, and they can log in immediately.
  - **Successful Login:** The user receives a JWT token, which can be used to authenticate future requests (such as seat booking).

### **What Happens After Booking Seats:**
  - After booking, the system will:
    - Update the availability of selected seats.
    - Provide the user with the total cost (based on the distance of booked seats).
    - Return the arrangement of booked seats for confirmation.

### **Handling Edge Cases:**
  - If the user tries to sign up with an existing username, an error message will be displayed.
  - If the user provides incorrect login credentials, an error message will be shown.
  - If the system is unable to book enough seats, it will return an error with a cost of "Infinity" and an empty seat arrangement.

This commit establishes the primary user management and seat booking features, ensuring a secure and optimized user experience. Future updates will extend these features and add more enhancements like session expiration, user profile management, and more dynamic seat availability options.

## Endpoints

### 1. User Authentication

#### Signup
- **Endpoint**: `POST /auth/signup`
- **Description**: Creates a new user account.
- **Request Body**:
  ```json
  {
    "username": "testuser",
    "password": "password123",
    "email": "testuser@example.com"
  }

### **POST** `/auth/login`

#### Description:
Logs in an existing user and provides a JWT token stored in an HTTP-only cookie. This token can be used for subsequent authenticated requests.

#### Request Body:
The request body should contain the following fields:

```json
{
  "username": "testuser",
  "password": "password123"
}   
```

### 2. Book Seats

- **Endpoint**: `POST /seats/book`
- **Method**: `POST`
- **Description**: Allows users to book specific seats. The user must be authenticated via JWT token.

- **Request Headers**:
  - **Authorization**: `Bearer <JWT_TOKEN>` (The user must be logged in)
  
- **Request Body**:
  - An array of seat IDs the user wants to book.

    ```json
    {
      "seatIds": [1, 2, 3]
    }
    ```

## Setup .env File

To run the application locally, you'll need to set up a `.env` file with the following structure.

### Steps:

1. **Clone the Repository:**

   First, clone the repository to your local machine using Git:

   ```bash
   git clone https://github.com/Devanshchowdhury2212/Train-Seat-Booking-WebApp-Deployed.git
   cd Train-Seat-Booking-WebApp-Deployed
   npm install

2. Create a `.env` file in the root directory of the project.
3. Add the following content to the `.env` file:

   ```env
   SUPABASE_KEY=
   SUPABASE_URL=
   JWT_SECRET=
   PORT=5000
4. Run the Application
```
npm run dev
```
### Live Deployed

This web application is hosted live on Render: [Train Seat Booking WebApp](https://train-seat-booking-webapp-deployeds.onrender.com)

### Available Pages:
- **POST /signup**: Create a new user account.
- **POST /login**: Login with your credentials to receive a JWT token.
- **GET /dashboard**: Access the user dashboard (authentication required).

You can interact with these endpoints to manage user authentication and view the seat booking dashboard.