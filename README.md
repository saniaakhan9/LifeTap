# LifeTap – Smart Emergency Information ID

> A QR-based web application designed to provide quick access to essential emergency information when it matters most.

## 📌 About the Project

**LifeTap** is a web-based Smart Emergency Information System that allows users to create and manage an emergency profile and generate a unique QR code linked to their information.

In an emergency, the QR code can be scanned to quickly access important details such as emergency contacts, medical information, allergies, and other essential information.

The system is designed to be **simple, fast, mobile-friendly, and accessible without requiring a separate mobile application**.

## 🎯 Objectives

- Provide quick access to essential emergency information.
- Reduce the time required to find important personal or medical details.
- Generate a unique QR-based emergency identity.
- Provide location support during emergencies.
- Create a simple and user-friendly web interface.

## ✨ Features

- 👤 **Emergency Profile** – Create and manage emergency information.
- 🆘 **Emergency Details** – Store important medical and contact information.
- 🔳 **QR Code Generation** – Generate a unique QR code for the emergency profile.
- 📷 **QR Scanning** – Access emergency information through the QR code.
- 📍 **Location Support** – Use geolocation and map services when required.
- 🗺️ **Interactive Maps** – Location visualization using Leaflet.js and OpenStreetMap.
- 🆔 **Unique ID Generation** – Generate unique identifiers using NanoID.
- 📱 **Responsive Design** – Designed to work across desktop and mobile devices.

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Database | Firebase Firestore |
| Maps | Leaflet.js |
| Map Data | OpenStreetMap |
| Location | Geolocation API |
| QR Code | QRCode.js |
| Unique IDs | NanoID |
| Hosting | Netlify / GitHub Pages |

## 🔄 How It Works

```text
Create Emergency Profile
          ↓
Enter Emergency Information
          ↓
Generate Unique ID
          ↓
Generate QR Code
          ↓
Share / Keep QR Code Accessible
          ↓
QR Code Scanned During Emergency
          ↓
Emergency Information Displayed
          ↓
Location & Map Support
```

## 📂 Project Structure

```text
LifeTap/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   └── images/
│
├── README.md
└── ...
```

> The project structure may evolve as development progresses.

## 🔐 Privacy & Security

LifeTap is designed with emergency information privacy in mind.

- The repository is maintained as a **private GitHub repository**.
- Only authorized project collaborators have access to the source code.
- Sensitive information should not be stored directly in the source code.
- Firebase security rules should be configured appropriately before deployment.

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd LifeTap
```

### 2. Open the project

Open the project folder in **VS Code** or your preferred code editor.

### 3. Configure Firebase

Create a Firebase project and configure **Firebase Firestore** according to the project's requirements.

### 4. Run the project

Open `index.html` using a local development server.

For example, with VS Code, use the **Live Server** extension.

## 🌍 Deployment

LifeTap can be deployed using:

- **Netlify**
- **GitHub Pages**

## 👥 Team

**Project Name:** LifeTap – Smart Emergency Information ID

**Project Type:** MCA Mini Project

**Repository:** Private team repository

## 🚧 Project Status

**Currently under development.**

Features, UI components, database integration, QR functionality, and location services will be implemented and tested progressively.

## 📄 License

This project is developed for **academic purposes** as part of an MCA mini-project.
