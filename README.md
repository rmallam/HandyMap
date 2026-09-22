# 🛠️ HandyMap PRO

> **Mobile-first Field Operations & Multi-Stop Route Optimizer for Handymen and Trade Professionals.**

HandyMap PRO simplifies day-to-day trade work by combining interactive map-based job management, traveling-salesperson (TSP) route optimization for quote visits, on-site digital estimates with signature capture, and offline-first persistence.

---

## 🌟 Key Features

### 1. 🗺️ Interactive Color-Coded Map View
- **Visual Job Markers**:
  - 🟠 **Needs Quote**: Client requested an estimate; handyman needs to visit on site.
  - 🟣 **Quoted**: Estimate prepared and awaiting customer approval.
  - 🟢 **In Progress**: Active confirmed jobs underway.
  - 🔴 **Urgent / Emergency**: Leaks, electrical hazards, or urgent repairs.
  - ⚪ **Completed / Invoiced**: Finished jobs.
- **Dynamic Filter Chips**: One-tap filtering (*All, Needs Quote, In Progress, Quoted, Urgent, Completed*).
- **Segmented Map ⇄ List Switch**: Flip instantly between the map and the job directory from the top header.
- **Quick Action Drawer**: Tap any pin to see distance, contact the client, get directions, or open the full dossier.

### 2. ⚡ Multi-Stop Route Optimizer
- **TSP Route Engine**: Computes the shortest, most fuel-efficient sequence to visit quote sites starting from your current GPS location or base workshop.
- **Turn-by-Turn ETAs**: Calculates arrival schedules, driving durations, and visit completion times.
- **1-Click Google Maps & Apple Maps Export**: Launch your entire day's multi-stop itinerary straight into live turn-by-turn navigation.

### 3. 📝 On-Site Quote Builder & Signoff
- **Itemized Calculator**: Break down labor hours, rates, material parts, and GST/taxes.
- **Digital Signature Pad**: Capture client touch/mouse signatures on-site for immediate authorization.
- **Official PDF Generation**: Export professional branded Estimates and Tax Invoices with one click.
- **Job Status Workflow**: Smooth transitions (*Quote Requested ➔ Quoted ➔ In Progress ➔ Completed ➔ Invoiced*).

### 4. 📱 Day-to-Day Field Hub
- **Daily Schedule Timeline**: Chronological view of today's appointments and visits.
- **On-Site Labor Stopwatch**: Punch in/out to record labor time directly into the job log.
- **Quick Client Communication**: 1-Tap Call, WhatsApp, and pre-formatted SMS templates (*"On My Way! ETA: 15 mins"*, etc.).
- **Analytics & Pipeline**: Track pending quote values, active job pipeline, and fuel savings.
- **Offline-First Persistence**: Instant local persistence with sample demo data.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm or pnpm / yarn

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/rmallam/HandyMap.git
cd HandyMap

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Mapping & Routing**: Leaflet, React-Leaflet, OpenStreetMap Tiles, OSRM Public Routing API
- **Documents & Signatures**: jsPDF, jspdf-autotable, HTML5 Canvas
- **Storage**: Browser LocalStorage (with optional Supabase / PostgreSQL backend readiness)

---

## 📄 License
MIT License. Built for field trade professionals.
