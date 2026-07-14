# Ripple Architecture

## System Overview

Ripple is a cross-platform referral/affiliate code sharing application.

## Core Entities

### User
- Username, email, password (hashed)
- Profile information (name, avatar, bio)
- List of referral codes
- Social network (followers/following)

### ReferralCode
- Code value (unique)
- Platform (Uber, Airbnb, DoorDash, etc.)
- Owner reference
- Expiry date and usage limit
- Tracking: views, shares, usage

## Tech Stack

- Backend: Node.js + Express + MongoDB
- Web: React + Vite + Tailwind
- Mobile: React Native + Expo
- Real-time: Socket.io
