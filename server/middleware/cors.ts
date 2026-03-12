import cors from "cors";

const allowedOrigins = [
  "https://membros.jcarv.in",
  "http://localhost:4747",
  "http://localhost:5173",
];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});
