# VELoop Admin Panel — Withdrawal Management Portal

A modern, high-fidelity administrative panel for **VELoop Rewards**, specifically designed to handle withdrawal moderation, review, approvals, and rejections. Built with consistent styling, design tokens, typography, and glassmorphic UI patterns matching `veloop-frontend`.

## Key Features

- **Administrative Authentication**:
  - Protected admin session handling with `role: "admin"` verification.
  - One-click demo credentials autofill (`test@1.com` / `testuser`).
  - Error banner and form validation with React Hook Form.
- **Withdrawal Review & Management Dashboard**:
  - **Live Metrics**: 4 dynamic glass cards displaying Pending Review, Approved Payouts, Rejected Requests, and Total Volume Disbursed.
  - **Multi-criteria Filtering**: Instant filter tabs for *All Requests*, *Pending*, *Approved*, and *Rejected* with live badge counts, plus payout method filters (*UPI*, *Amazon*, *Google Play*).
  - **Instant Search**: Search by user email, transaction ID, destination UPI ID, or ticket ID.
  - **Approve Workflow**: One-click approval that marks tickets as `APPROVED` with timestamp and confirmation toast.
  - **Reject Workflow with Presets**: Modal interface with reason presets (`dummyRejectionReasonPresets`), custom text field, and audit notes.
  - **Ticket Audit Inspector**: Comprehensive modal displaying full user information, transaction IDs with copy buttons, timestamps, and expandable raw JSON payload.
  - **Mock Data Reset**: Easy reset button in navbar to restore demo data back to default test state.

## Design System

- **Color Scheme**: Dark luxury theme matching VELoop (`#0b0e14`, `#151a24`), ambient glowing mesh gradients, brand accents (Indigo `#6c5ce7`, Teal `#00d9b5`, Amber `#ffb020`, Emerald `#22c55e`, Rose `#f43f5e`).
- **Typography**: `Sora` for headers, `Inter` for data tables and body text.
- **Glassmorphism**: Backdrop blur with 1px translucent borders and glowing status pills.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The admin portal runs at `http://localhost:5174`.

### 3. Build for Production
```bash
npm run build
```

## Demo Credentials

- **Email**: `test@1.com`
- **Password**: `testuser`
