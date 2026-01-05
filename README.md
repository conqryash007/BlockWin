# Crypto Casino 

A professional, high-fidelity crypto casino frontend built with Next.js, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS, shadcn/ui
- **Icons:** Lucide React
- **State:** React Hooks + Context (Betslip)
- **Components:** Radix UI primitives with custom styling

## Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    ```

3.  **Open Browser:**
    Navigate to `http://localhost:3000`

## Features

- **Responsive Sidebar & Header:** Fully collapsible sidebar and sticky header.
- **Casino Lobby:** Categorized game grid with hover effects.
- **Game Interface:** Dedicated game pages with bet controls and live bets table.
- **Sports Betting:** Stub page with live odds and betslip integration.
- **Betslip System:** Functional drawer for adding bets and calculating potential wins.
- **Wallet UI:** Mock wallet connection and deposit/withdraw dialogs.
- **Admin Panel:** Dashboard with statistics and game management table.

## Project Structure

- `app/`: Next.js App Router pages.
- `components/ui/`: Reusable primitive components (shadcn).
- `components/layout/`: Global layout components (Sidebar, Header).
- `components/casino/`: Casino-specific components (GameCard, BetControls).
- `components/betslip/`: Betslip drawer and state.
- `lib/`: Utilities and mock data.
