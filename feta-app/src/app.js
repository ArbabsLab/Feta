const express = require("express");
const bodyParser = require("body-parser");
const firebase = require("firebase-admin");
const path = require("path");
require("dotenv").config();

const serviceAccountPath = path.resolve(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
);
const serviceAccount = require(serviceAccountPath);

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
});

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/register", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "register.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

const adminRoutes = require("./routes/admin");
const chefRoutes = require("./routes/chef");
const driverRoutes = require("./routes/driver");
const memberRoutes = require("./routes/member");
const menuRoutes = require("./routes/menu");

app.use("/api/admin", adminRoutes);
app.use("/api/chef", chefRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/menu", menuRoutes);

app.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
