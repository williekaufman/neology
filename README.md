# Setup
In each of these folders, copy `.env.example` to `.env` and set the appropriate values:
- root
- `backend/`
- `frontend/`


# Run
Then, run `docker compose up --build` to start the application.

It should be serving on `http://localhost:9070` (or at the port specified in `.env`).

# Notes
The deafult ports the containers are mirrored to are chosen to not conflict with other instances of those services you have running:
- `backend` (Flask app) is mirrored to port `5021`
- `frontend` (React app) is mirrored to port `3002`
- `redis` is mirrored to port `6380`
- `nginx` is mirrored to `9070`. Requests to `http://localhost:9070/api` are forwarded to the backend Flask app. Requests to `http://localhost:9070/` are forwarded to the frontend React app.

If you change BACKEND_PORT, you will need to change the port in the `nginx/default.conf` file to match.

If you change NGINX_PORT, you will need to change the port in the `frontend/.env` file to match.
