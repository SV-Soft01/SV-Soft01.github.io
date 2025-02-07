# BarberBook - Barbershop Appointment System

BarberBook is a comprehensive web application for managing barbershop appointments. It provides an intuitive interface for clients to book appointments and for administrators to manage services, barbers, schedules, and appointments.

## Features

### Client Side
- Browse available services and barbers
- Book appointments with a step-by-step process:
  1. Select a barber
  2. Choose a service
  3. Pick a date and time
  4. Enter personal information
- View service descriptions and prices
- Real-time availability updates

### Admin Side
- Secure admin login
- Manage services (add, edit, delete)
- Manage barbers (add, edit, delete)
- Set and modify barber schedules
- Add date-specific breaks for barbers
- View and manage appointments
- Receive real-time notifications for new bookings

### General
- Responsive design for mobile and desktop
- Automatic deletion of past appointments
- Real-time data synchronization
- Firebase integration for data persistence and real-time updates

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase (Firestore, Cloud Messaging)
- Firebase Cloud Functions (for notifications)

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/barberbook.git
   ```

2. Navigate to the project directory:
   ```
   cd barberbook
   ```

3. Open `firebase-config.js` and replace the Firebase configuration with your own:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. Deploy the Firebase Cloud Functions for notifications (make sure you have the Firebase CLI installed):
   ```
   firebase deploy --only functions
   ```

5. Open `index.html` in a web browser to access the admin panel, or `cliente.html` for the client-side booking interface.

## Usage

### For Clients
1. Open `cliente.html` in a web browser.
2. Browse services and barbers.
3. Click "Reservar Ahora" to start the booking process.
4. Follow the step-by-step booking process.

### For Administrators
1. Open `index.html` in a web browser.
2. Log in with the admin password (default: "admin123").
3. Use the navigation menu to manage services, barbers, schedules, and view appointments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- [Firebase](https://firebase.google.com/) for providing the backend infrastructure.
- [Lucide Icons](https://lucide.dev/) for the icon set used in the project.

## Contact

For any inquiries or support, please contact [your-email@example.com](mailto:your-email@example.com).
