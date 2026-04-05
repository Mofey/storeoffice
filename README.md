# ecommerce-admin

`ecommerce-admin` is the standalone administration panel for the EShop workspace.
It is built as an independent React app and connects to the FastAPI backend for product, category, content, analytics, orders, users, newsletter, and review management.

## Features

- Admin authentication with session persistence
- Product management
- Category CRUD
- Order review and completion flow
- User management and suspension tools
- Newsletter and review administration
- Editable site content, footer data, privacy, and terms
- Backend-powered analytics dashboard

## Tech Stack

- React
- Vite
- TypeScript
- React Router
- Lucide React

## Environment Variables

Create a `.env` file in this folder:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
