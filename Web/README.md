
## Deployment (GitHub Pages + hosted API)
1. **Backend:** run the Spring Boot app with `SPRING_PROFILES_ACTIVE=prod` and set `SOCKET_SERVER' environment variables
2. **Frontend:** set `VITE_SOCKET_URL` in `.env.production` to your live Socket.IO URL, then `npm run build` and deploy `dist` (e.g. `npm run deploy` for gh-pages). See `FRONTEND.md` → **Configuration**.



