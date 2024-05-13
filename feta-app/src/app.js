const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const firebase = require("firebase-admin");
const path = require("path");
const { verifyMember, verifyAdmin } = require("./middlewares/auth");
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
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/register", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public/pages", "register.html"));
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public/pages", "login.html"));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public/pages", "index.html"));
});

app.get("/contact", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public/pages", "contact.html"));
});

app.get("/menu", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public/pages", "menu.html"));
});

app.get("/cart", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public/pages", "cart.html"));
});

app.get("/admin", verifyAdmin, (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "secure", "admin.html"));
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
