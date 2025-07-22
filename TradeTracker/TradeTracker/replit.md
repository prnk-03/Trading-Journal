# TradeMaster Pro - Trading Analytics Platform

## Overview

TradeMaster Pro is a comprehensive trading analytics platform built with a modern full-stack architecture. The application allows traders to manage multiple trading accounts, track trades across different markets (forex, crypto, stocks), perform position calculations, and analyze trading performance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Uploads**: Multer for handling image uploads
- **Development**: TSX for TypeScript execution

### Data Storage
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Connection Pooling**: Neon serverless connection pooling

## Key Components

### Database Schema
The application uses a relational database with the following main entities:
- **Users**: Basic user authentication and management
- **Accounts**: Trading accounts with support for multiple brokers, markets, and currencies
- **Trades**: Detailed trade records with entry/exit prices, P&L, emotions, and risk management
- **Currency Rates**: Cached exchange rates for multi-currency support
- **Fund Transfers**: Internal transfers between trading accounts

### Trading Features
- **Multi-Market Support**: Forex, cryptocurrency, and stock trading
- **Multi-Currency**: USD and INR support with real-time exchange rates
- **Position Calculator**: Risk management and position sizing tools
- **Account Management**: Main and sub-account hierarchy
- **Performance Analytics**: Trading statistics and portfolio tracking

### User Interface Components
- **Dashboard**: Central hub with account switching and overview
- **Trade Entry Form**: Comprehensive trade logging with file uploads
- **Account Management**: Create accounts and transfer funds
- **Performance Analytics**: Charts and trading statistics
- **Position Calculator**: Risk and position size calculations

## Data Flow

1. **User Authentication**: Currently uses hardcoded user ID (TODO: implement proper auth)
2. **Account Selection**: Users can switch between multiple trading accounts
3. **Trade Entry**: Forms capture detailed trade information with optional screenshot uploads
4. **Real-time Data**: Currency exchange rates fetched from external API and cached
5. **Analytics**: Performance calculations aggregated from trade history
6. **File Handling**: Image uploads processed and stored locally

## External Dependencies

### NPM Packages
- **UI Components**: Extensive Radix UI component library
- **Database**: Drizzle ORM with Neon serverless driver
- **Validation**: Zod for schema validation with Drizzle integration
- **File Processing**: Multer for image upload handling
- **Utilities**: Date-fns for date manipulation, class-variance-authority for styling

### External Services
- **Currency API**: Exchange rate data (configurable API key)
- **Database**: Neon PostgreSQL serverless database
- **CDN**: Font Awesome for icons (referenced in components)

### Development Tools
- **Replit Integration**: Special Vite plugins for Replit environment
- **Build Process**: ESBuild for server bundling, Vite for client bundling

## Deployment Strategy

### Production Build
- **Client**: Vite builds React app to `dist/public`
- **Server**: ESBuild bundles Express server to `dist/index.js`
- **Assets**: Static file serving in production mode

### Development Environment
- **Hot Reload**: Vite dev server with Express middleware
- **Database**: Drizzle Kit for schema management and migrations
- **Environment Variables**: Database URL and API keys via environment

### Configuration
- **TypeScript**: Shared configuration across client, server, and shared modules
- **Path Aliases**: Configured for clean imports (`@/`, `@shared/`)
- **PostCSS**: Tailwind CSS processing with autoprefixer

The application follows a monorepo structure with clear separation between client, server, and shared code, making it maintainable and scalable for future enhancements.