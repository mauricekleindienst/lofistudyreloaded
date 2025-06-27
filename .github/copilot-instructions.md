# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a Next.js application with Supabase authentication and Shadcn/ui components. The project includes:

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: Modern Clean Dark Themed CSS
- **Styling**: CSS
- **Language**: English 
- **Terminal**: Use "pnpm" for running commands & powershell syntax highlighting

## Code Style Guidelines
- Use TypeScript for all components and utilities
- Follow React Server Components patterns where appropriate
- Use CSS for styling components
- Save All components infos in Supabase Databse like pomdoor stats
- Implement proper error handling for authentication flows
- Follow Next.js App Router conventions for routing and layouts
- use cd c:\git\lofistudynew; pnpm dev for Testinmg the app
- Use `pnpm` for package management

## Component Structure
- Place reusable components in `src/components/`
- Follow compound component patterns for complex UI elements
- Implement proper TypeScript interfaces for props

## Authentication Setup
- Use Supabase for authentication

## OAuth Providers
- Configure Discord, GitHub, and Google OAuth providers

## Data Management
- Use Supabase for managing user data and application state
- Implement proper data fetching and caching strategies
- Use Supabase's real-time capabilities for live updates
- Ensure all data interactions are type-safe with TypeScript
- Use Supabase's built-in storage for media assets
- Implement proper error handling for data operations
- All App should also work whe not logged in but be saved in cache then instead of database
- Use Supabase's authentication hooks for managing user sessions
- Implement proper session management and persistence
- Use Supabase's real-time capabilities for live updates
- Ensure all data interactions are type-safe with TypeScript
