# Ultimate Tic Tac Toe
Built using React , accessible [here](https://JustinBoyce.github.io/UltimateTicTacToe)

## Rules
The goal of the game is to win three tic tac toe games in a line before your opponent.

Every move you make changes where your opponent can make their next move. For example, if you play in the top right corner of a square then your opponent will have to play in the top right box. When a center square is played, a box is won, or a box is tied then your opponent can play anywhere. The availble boxes will be highlighted in red.

Tied boxes count for each player.


## Deployment (GitHub Pages + hosted API)
SERVER_ALLOWED_ORIGINS` to your GitHub Pages site origin (e.g. `https://JustinBoyce.github.io`). Bind with `SOCKET_SERVER_HOST=0.0.0.0` if the default from `application-prod.properties` is overridden. See `API/API_CONTRACT.md` → **Configuration**.
1. **Backend:** run the Spring Boot app with `SPRING_PROFILES_ACTIVE=prod` and set `SOCKET_
2. **Frontend:** set `VITE_SOCKET_URL` in `.env.production` to your live Socket.IO URL, then `npm run build` and deploy `dist` (e.g. `npm run deploy` for gh-pages). See `FRONTEND.md` → **Configuration**.

TODOs
- Have a game integrated with the backend without bugs
    - Figure out how to handle rooms
        - How will the room be determined?
    - The game logic needs to be integrated between the BE and FE
        - BE needs to accept moves and return board states
        - FE needs to send moves and accept board states
- Have the ability to create a room and invite another player
- Deploy the full game to be accessible by anyone


