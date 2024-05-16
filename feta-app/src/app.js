const express = require("express");
const cookieParser = require("cookie-parser");
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
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "..", "public")));

app.disable('etag');
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

const sendPage = (dir, page) => (_req, res) =>
  res.sendFile(path.join(__dirname, "..", dir, `${page}.html`));

app.get("/register", sendPage("public/pages", "register"));
app.get("/login", sendPage("public/pages", "login"));
app.get("/", sendPage("public/pages", "index"));
app.get("/contact", sendPage("public/pages", "contact"));
app.get("/menu", sendPage("public/pages", "menu"));
app.get("/cart", sendPage("public/pages", "cart"));
app.get("/checkout", verifyMember, sendPage("secure", "checkout"));
app.get("/admin", verifyAdmin, sendPage("secure", "admin"));

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
