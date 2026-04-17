# GigKavacham: Parametric Income Insurance for Gig Workers

> **Protecting the backbone of India's gig economy.** When the city stops, income should not.

[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node%20%7C%20FastAPI%20%7C%20Supabase-blue)](https://github.com/your-username/gig-kavacham)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🛡️ The Vision

India's 12 million+ gig workers lose significant income during monsoons, extreme heatwaves, and air quality hazards. **GigKavacham** is an autonomous parametric insurance platform that removes the "claim process" entirely. By utilizing a zero-touch automated payout pipeline based on real-world disruption signals, we provide instant financial relief when workers need it most.

---

## ✨ Key Features

- **Autonomous Payouts**: Zero-touch settlement in < 5 minutes via UPI.
- **Parametric Risk Engine**: Real-time Disruption Composite Score (DCS) monitoring.
- **Dynamic ML Pricing**: Behavioral and environmental premium adjustments (Financial Model V2).
- **AI-Driven Support**: Context-aware chatbot for policy management.
- **Real-time Disruption Map**: Interactive visualization of regional risk zones.

---

## 🏗️ Project Architecture

GigKavacham operates as a distributed system across three core layers:

1.  **Frontend (UI/UX)**: A high-performance React/Vite dashboard specialized for quick worker interactions and mobile responsiveness.
2.  **Node Backend (Ops)**: Orchestrates business logic, manages Supabase interactions, and runs background cron services for weather monitoring.
3.  **ML Server (Intelligence)**: A FastAPI-based inference engine serving specialized models for pricing, risk forecasting, and fraud detection.

---

## 🚀 Quick Start Guide

To run the full suite locally, you will need **Node.js**, **Python 3.10+**, and a **Supabase** project.

### 1. ML Server Setup
```bash
# Navigate to backend
cd backend
# Activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Launch FastAPI
python ml/services/ml_server.py
```
*Port: http://localhost:5001/health*

### 2. Backend Setup
```bash
# In the backend directory
npm install
npm run dev
```
*Port: http://localhost:3001*

### 3. Frontend Setup
```bash
# In the project root
npm install
npm run dev
```
*Port: http://localhost:5173*

---

## 📊 Logic & Methodology

### Disruption Composite Score (DCS)
The DCS is the core risk value (0-100) driving payouts. It is calculated using weighted real-time signals:
- **Rainfall (30%)**
- **Air Quality / AQI (25%)**
- **Extreme Heat (20%)**
- **Order Drop Volume (15%)**
- **Social Disruption (10%)**

### Pricing Model (V2)
Dynamic premiums are calculated using a base rate multiplied by environmental and behavioral factors:
`Final Premium = Base × Season_Mult × Tier_Mult × (1 - Shield_Discount)`

---

## 🔮 Future Roadmap

- [ ] **Multi-Platform Integration**: Direct API syncing with Swiggy, Zomato, and Uber to calibrate loss-of-income data.
- [ ] **Decentralized Payouts**: Migrating payout history to an immutable ledger for 100% transparency.
- [ ] **Hyper-Local Risk Zoning**: Increasing DCS granularity from city-tier to sub-ward levels (500m radius).
- [ ] **Multilingual Voice Bot**: AI support in Hindi, Tamil, Telugu, and Kannada for broader accessibility.
- [ ] **Mobile Native App**: Dedicated iOS/Android builds for persistent background location tracking.

---

## ⚖️ License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for India’s Gig Community.*