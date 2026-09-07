# Paper Ring

A private MERN social web app for friends.

## Stack
- MongoDB + Mongoose
- Express.js
- React.js + Vite
- Node.js
- JWT authentication
- Socket-free REST messaging with automatic polling
- Neo Brutalism responsive UI

## Features
- Registration/login with a unique friend code
- Search/add friends by exact friend code
- Private friend list
- Friend-only profiles
- Paper Rings: one letter per sender → recipient, editable/deletable by the sender
- Received and given Paper Ring views
- Private friend-to-friend messaging
- Unread message counts
- Notifications for friend additions, Paper Rings, and messages
- Profile picture/banner/description editing
- Responsive message layout: split panels on desktop, friend selector on mobile
- Support/about/contact feedback page

## Setup

### 1. Server

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER/paperring?retryWrites=true&w=majority
JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

Start it:

```bash
npm run dev
```

or:

```bash
npm start
```

### 2. Client

Open another terminal:

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start it:

```bash
npm run dev
```

Then open the Vite URL shown in the terminal.

## Notes
- The only credentials you need to change are the values in the two `.env` files.
- A Paper Ring is unique per sender/recipient pair. A sender can edit/delete their existing Ring but cannot create a second one for the same friend.
- Messages are available only between friends.
- Friend lists are only exposed on the logged-in user's own profile.
- Profile images are URL-based so the project stays storage-provider agnostic. Leave them empty for the default avatar/banner.

## Data model at a glance

- `User` — account + public profile fields + private friend code.
- `Friendship` — one mutual relationship, stored once with a canonical pair key.
- `PaperRing` — unique `(sender, recipient)` relationship, so each friend can receive only one Ring from a particular friend.
- `Message` — one-to-one chat messages with read timestamps.
- `Notification` — friend additions, Paper Rings, and messages.
- `Feedback` — support/contact submissions.
