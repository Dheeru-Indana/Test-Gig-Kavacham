Design a complete, production-grade frontend prototype for a web-based Progressive Web App (PWA) called **“Kavacham”**.

## 📌 Product Context

Kavacham is an AI-powered parametric income insurance platform for gig delivery workers (Zomato, Swiggy, etc.) in India. The platform automatically detects disruptions (rain, AQI, curfews) and triggers instant payouts without manual claims.

This prototype should simulate a **fully working application using mock data**, without backend integration.

---

## 🎯 Design Goals

* Clean, modern, fintech + insuretech aesthetic
* Mobile-first (primary users are Android gig workers)
* Fully responsive (mobile + desktop for admin dashboard)
* High trust UI (financial product)
* Extremely simple UX (low-literacy friendly)
* Fast interactions, minimal friction

---

## 🎨 Design System

* Color palette:

  * Primary: Deep Blue (#0B5FFF)
  * Accent: Teal/Green (#00C896)
  * Warning: Orange (#FF8A00)
  * Danger: Red (#FF4D4F)
  * Background: Light gray (#F7F9FC)
* Typography:

  * Headings: Bold, clean (Inter / Poppins)
  * Body: Simple, readable
* Components:

  * Rounded cards (12–16px radius)
  * Soft shadows
  * Large touch-friendly buttons
* Icons:

  * Use simple line icons (weather, money, alerts)

---

## 👤 USER FLOWS TO DESIGN

### 1. Worker App (Primary)

#### 🔹 Onboarding Flow

1. Welcome Screen (value proposition)
2. Phone number input (OTP mock)
3. Basic details:

   * Name
   * Platform (Swiggy/Zomato dropdown)
   * City + Zone selector
   * Weekly earnings input
4. “Income Sandbox” Screen:

   * Show estimated past losses
   * Show potential benefits
5. Premium Recommendation Screen:

   * Show 3 tiers (Basic / Standard / Pro)
   * Highlight recommended plan
6. Payment Screen (UPI mock)
7. Success Screen (policy activated)

---

#### 🔹 Dashboard (Main Screen)

* Greeting (e.g., “Hi Ravi”)
* Current policy card:

  * Plan name
  * Coverage status (Active)
  * Next renewal date
* Live Zone Status:

  * Current Disruption Score (DCS)
  * Status indicator (Safe / Risk / Triggered)
* Earnings protection summary:

  * Weekly coverage
  * Potential payout
* CTA buttons:

  * View Policy
  * Claim History
  * Pause Coverage

---

#### 🔹 Live Disruption Screen

* Show:

  * Rainfall / AQI / Order drop indicators
  * Visual progress bar for DCS
  * Status:

    * Normal
    * Warning
    * Triggered
* If triggered:

  * Show payout animation
  * “₹600 credited” confirmation

---

#### 🔹 Claims & History

* List of past payouts
* Each item shows:

  * Date
  * Trigger type (Rain / AQI / Curfew)
  * Amount credited
* Filter options

---

#### 🔹 Policy Management

* View plan details
* Change plan
* Pause / Resume coverage
* Renewal info

---

#### 🔹 Notifications (Mock WhatsApp-style)

* Message UI:

  * “Heavy rain detected. ₹600 credited.”
  * “High AQI alert tomorrow.”
* Chat-like interface

---

---

### 2. Insurer Admin Dashboard (Desktop)

#### 🔹 Overview Dashboard

* KPIs:

  * Active policies
  * Claims today
  * Total payouts
  * Loss ratio
* Charts:

  * Weekly payouts
  * Zone risk trends

---

#### 🔹 Live Zone Heat Map

* Map of city (mock)
* Zones color-coded:

  * Green → Safe
  * Yellow → Risk
  * Red → Active disruption
* Click zone:

  * Show:

    * DCS score
    * Active workers
    * Expected payout

---

#### 🔹 Claims Pipeline

* Table:

  * Worker
  * Zone
  * Trigger type
  * Status (Approved / Flagged)
* Fraud flag indicators

---

#### 🔹 Fraud Review Panel

* Show flagged claims
* Show:

  * GPS mismatch
  * Activity status
  * Fraud probability score

---

#### 🔹 Predictive Analytics

* Forecast charts:

  * Next-week risk
  * Expected payouts
* Alerts:

  * “High risk tomorrow in T. Nagar”

---

---

## ⚙️ FUNCTIONAL PROTOTYPE BEHAVIOR (IMPORTANT)

Simulate these interactions using mock logic:

* Switching plans updates price dynamically
* DCS bar animates based on preset states
* Trigger state shows payout animation
* Clicking “Pay” shows success instantly
* Toggle between Safe / Warning / Trigger states
* Admin dashboard updates when zone changes

NO backend required — simulate everything.

---

## 📱 PWA FEATURES (UI LEVEL)

* Add to Home Screen prompt
* Offline state screen
* Push notification UI simulation

---

## 🎯 UX DETAILS

* Use step-by-step onboarding (no long forms)
* Show microcopy in simple English
* Use visual explanations instead of text where possible
* Include loading states and transitions
* Include empty states

---

## 📦 DELIVERABLE EXPECTATION

Generate:

* Complete design system
* All screens listed above
* Clickable prototype flows:

  * Onboarding → Purchase → Dashboard
  * Trigger event → Payout
  * Admin dashboard navigation

---

## 💡 STYLE INSPIRATION

* Google Pay (simplicity)
* Razorpay Dashboard (fintech clarity)
* PolicyBazaar (insurance UI)
* Uber Driver app (gig worker UX)

---

## 🚫 CONSTRAINTS

* No backend/API references
* No real integrations
* Everything must work via prototype interactions

---

## ✅ FINAL OUTPUT

A fully connected, high-fidelity Figma prototype that demonstrates:

* Complete worker journey
* Complete insurer journey
* All major features from the product concept

Make it feel like a real, launch-ready product.
