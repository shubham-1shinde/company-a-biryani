# Company A Biryani – Smart Food Ordering & Restaurant Management Platform

A full-stack food ordering and restaurant management platform designed for Company A Biryani. The application enables customers to explore menus, place orders, receive real-time updates, and manage their profiles while providing restaurant staff with tools to manage orders, kitchen operations, outlets, and catering requests.

The platform combines modern web technologies with AI-powered recommendations and machine learning-based food preparation time prediction to improve the overall ordering experience and restaurant operations.

## Project Links

- **GitHub Repository:** https://github.com/shubham-1shinde/company-a-biryani
- **Live Application:** https://company-a-biryani.vercel.app/

## Key Features

### Customer Application
- User authentication using mobile OTP.
- Personalized customer profiles and address management.
- Browse food menus with images, descriptions, prices, and availability.
- Add items, portions, and add-ons to the shopping cart.
- Secure checkout and order placement.
- Order history and order status tracking.
- Real-time order status updates.
- AI-powered food recommendations.
- One-click addition of recommended items to the cart.
- Automatic outlet discovery based on customer location.
- Displays deliverable outlets and identifies unavailable delivery locations.

### AI-Powered Features
- Personalized food recommendations using LangChain.
- Recommendation service with fallback handling.
- Machine learning-based food preparation time prediction.
- Random Forest model for estimating preparation time.
- Recommendation caching to reduce unnecessary API requests.

### Restaurant & Kitchen Management
- Dedicated restaurant administration dashboard.
- Kitchen Display System (KDS).
- Real-time incoming order notifications.
- Update order preparation and fulfillment statuses.
- Manage menu items and food availability.
- Mark items as available or out of stock.
- Outlet-specific menu and order management.
- Automatic order routing to the appropriate outlet.

### Catering & Party Orders
- Dedicated catering request functionality.
- Party orders require a minimum of 48 hours' advance notice.
- Separate Catering Manager role.
- Catering request approval and rejection.
- Catering order management.

### Notifications
- Real-time order updates using Socket.IO.
- Customer order status notifications.
- SMS/WhatsApp notification integration where configured.

## Technology Stack

| Category | Technologies |

| Frontend | React.js, Vite, Tailwind CSS |
| State Management | Redux Toolkit, Redux Persist |
| Routing | React Router |
| API Communication | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | OTP, JWT, bcrypt |
| Real-time Communication | Socket.IO |
| AI Integration | Python, FastAPI, LangChain |
| Machine Learning | Scikit-learn, Random Forest |
| AI Recommendation | LangChain |
| Deployment | Vercel, Render |
| Version Control | Git, GitHub |

## System Architecture

The application follows a modular client-server architecture with a separate AI service.

```text
                 CUSTOMER / ADMIN / KITCHEN
                            |
                            v
                   REACT FRONTEND
                  (Vite + Tailwind)
                            |
                     Axios / Socket.IO
                            |
                            v
                  NODE.JS BACKEND
                    (Express.js)
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
         MongoDB         Socket.IO       AI SERVICE
         Atlas           Server          (FastAPI)
                                             |
                                    +--------+--------+
                                    |                 |
                                    v                 v
                                LangChain        Scikit-learn
                                Recommendations  Random Forest
```

### Architecture Overview

- **Frontend:** Handles customer interactions, authentication, menu browsing, cart management, checkout, and dashboards.
- **Backend:** Provides REST APIs, authentication, business logic, order processing, outlet management, and role-based access.
- **Database:** MongoDB stores user information, outlets, menu items, orders, and other application data.
- **Real-time Service:** Socket.IO communicates order updates between customers, administrators, and kitchen staff.
- **AI Service:** FastAPI exposes AI-related endpoints for personalized recommendations and machine learning-based preparation time prediction.

## User Roles

The platform supports role-based access for different users.

| Role | Responsibilities |

| Customer | Browse menu, place orders, manage profile, track orders |
| Admin | Manage outlets, menus, orders, and application operations |
| Kitchen Staff | View incoming orders and update preparation status |
| Catering Manager | Review and manage catering requests |


## Installation & Setup

### Prerequisites

Make sure the following are installed:

- Node.js 18 or later
- npm
- Python 3.10 or later
- MongoDB Atlas account or local MongoDB
- Git

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd company-a-biryani
```

### 2. Setup Backend

```bash
cd backend

npm install
```

Create a `.env` file inside the backend directory and configure the required environment variables.

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AI_SERVICE_URL=http://localhost:8001
```

Add any additional credentials required by your authentication, payment, and notification integrations.

Start the backend:

```bash
npm run dev
```

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend

npm install
```

Configure the frontend environment variables in `.env` according to the API configuration.

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

### 4. Setup AI Service

Open another terminal:

```bash
cd ai-service
```

Create and activate a Python virtual environment.

**Windows:**

```bash
python -m venv venv

venv\Scripts\activate
```

**Linux / macOS:**

```bash
python3 -m venv venv

source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required AI API credentials and service settings in the AI service environment file.

Start FastAPI:

```bash
uvicorn main:app --reload --port 8001
```

API documentation will be available at:

```text
http://localhost:8001/docs
```

## Main Application Flow

1. Customers authenticate using their mobile number and OTP.
2. Customers browse the available food menu.
3. The application identifies suitable outlets based on the customer's delivery location.
4. Customers add food items, portions, and add-ons to their cart.
5. Customers proceed to checkout and place an order.
6. The backend processes the order and routes it to the appropriate outlet.
7. Kitchen staff receive the order through real-time communication.
8. Kitchen staff update the preparation and order status.
9. Customers receive real-time updates about their orders.
10. AI-powered recommendations help customers discover additional menu items.

## AI & Machine Learning Implementation

The application incorporates AI and machine learning in two areas:

**1. Personalized Food Recommendations**

LangChain is used to implement the recommendation workflow. The service provides relevant food suggestions and supports fallback handling when the AI service is unavailable.

**2. Preparation Time Prediction**

A Random Forest machine learning model built using Scikit-learn predicts estimated food preparation times based on available order-related features.

This approach uses a trained machine learning model rather than relying on an LLM to generate preparation time estimates.

## Deployment

The application uses a distributed deployment architecture:

| Component | Deployment Platform |

| React Frontend | Vercel |
| Node.js Backend | Render |
| Python AI Service | Render |
| Database | MongoDB Atlas |

For detailed deployment instructions, refer to **[deployment.md](deployment.md)**.

## Security Considerations

- JWT-based authentication.
- Password hashing using bcrypt where passwords are used.
- OTP verification for mobile authentication.
- Role-based access control.
- Protected API routes.
- Environment variables for sensitive credentials.
- Backend-side validation of important business operations.

## Future Enhancements

- Integration with live delivery partner APIs.
- Advanced sales and revenue analytics.
- Improved customer loyalty and rewards.
- Advanced AI-based demand forecasting.
- Enhanced inventory management.
- Automated operational reporting.

## Developer

**Shubham Shinde**

Full Stack Developer | MERN Stack | AI & Machine Learning

- GitHub: [Your GitHub Profile]
- LinkedIn: [Your LinkedIn Profile]

---

**Company A Biryani** – Bringing smarter food ordering and restaurant management together through modern web technologies, real-time communication, and AI-powered features.