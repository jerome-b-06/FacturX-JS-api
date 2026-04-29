import app from "./app.js";
import dotenv from "dotenv"
dotenv.config({path: '../.env', quiet: true})

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});