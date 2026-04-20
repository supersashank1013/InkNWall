🎨 InkNWall
A full-stack web application that allows users to browse, order, and manage custom posters. Built with a modern tech stack and deployed as a production-ready platform with authentication, admin controls, and a custom domain.

🌐 Live Demo

🔗 Frontend: https://inknwall.in
🔗 Backend API: https://inknwall-backend.onrender.com


🚀 Features
👤 User Features

Browse posters with a clean UI
Google OAuth login authentication
Place and manage orders
Responsive design (mobile + desktop)
Installable as a PWA (Add to Home Screen)

🛠️ Admin Features

Upload and manage posters
View user orders
Manage announcements
Secure admin panel


🧱 Tech Stack
Frontend

React (Vite)
TypeScript
Tailwind CSS

Backend

Spring Boot
Spring Security (JWT Authentication)
REST APIs

Database

PostgreSQL

Authentication

JWT (JSON Web Tokens)
Google OAuth 2.0

Deployment

Frontend: Render (Static Site)
Backend: Render (Dockerized Service)
Database: Render PostgreSQL
Domain: GoDaddy (Custom Domain + DNS)


⚙️ Architecture Overview
React Frontend → REST API (Spring Boot) → PostgreSQL Database
                ↓
           JWT + OAuth Authentication


🔐 Security Features

Password encryption using BCrypt
JWT-based stateless authentication
Role-based access (Admin/User)
Protected API routes
Secure environment variable management


📦 Installation (Local Setup)
1. Clone Repository
git clone https://github.com/your-username/inknwall.git
cd inknwall


2. Backend Setup
cd backend
mvn clean install
mvn spring-boot:run


3. Frontend Setup
cd frontend
npm install
npm run dev


4. Environment Variables
Create .env in frontend:
VITE_API_BASE_URL=http://localhost:8080


🌍 Deployment Highlights

Configured custom domain (inknwall.in)
Implemented HTTPS with SSL certificates
Resolved CORS and OAuth production issues
Dockerized backend for reliable deployment
Connected frontend and backend via environment variables


📱 Progressive Web App (PWA)

Installable on Android and iOS
Custom install prompt
App-like experience on home screen


🧠 Key Challenges & Solutions



Challenge
Solution




CORS errors in production
Configured allowed origins properly


Google OAuth redirect issues
Updated authorized domains and URIs


Database connection failures
Corrected JDBC URL and environment variables


Deployment issues on Render
Used Docker for backend reliability


DNS & domain linking
Configured GoDaddy DNS correctly




📌 Future Improvements

Payment integration (Stripe/Razorpay)
Push notifications
Advanced analytics dashboard
Image optimization & CDN usage
Role-based admin permissions refinement


👨‍💻 Author
Sashank Kumar
Second Year Undergraduate, IIT Madras

⭐ Acknowledgements

Render (Deployment)
Google Cloud (OAuth)
PostgreSQL
Open-source community


📄 License
This project is for educational and demonstration purposes.
