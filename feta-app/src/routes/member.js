// routes/member.js
const express = require("express");
const { verifyMember } = require("../middlewares/auth");
const firebase = require("firebase-admin");
const db = firebase.firestore();
const uuidv4 = require("uuid").v4;

const router = express.Router();

// Register new member
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const user = await firebase.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    await firebase.auth().setCustomUserClaims(user.uid, { role: "member" });

    res.status(201).json({
      success: true,
      message: "User successfully registered",
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(400).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
});

// Get user info (member)
router.get("/profile", verifyMember, async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRecord = await firebase.auth().getUser(uid);
    res.json({
      success: true,
      data: {
        displayName: userRecord.displayName,
        email: userRecord.email
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
});


// Place order (member)
router.post("/orders", verifyMember, async (req, res) => {
  const { items, user } = req.body;

  if (!items || typeof items !== 'object' || Object.keys(items).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - 'items' should be a non-empty object",
    });
  }

  const invalidItem = Object.entries(items).some(([id, quantity]) =>
    !id || typeof quantity !== "number"
  );

  if (invalidItem) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Each item should have an 'id' and 'quantity' (number)",
    });
  }

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required user information",
    });
  }

  const {
    name,
    email,
    phone,
    address1,
    address2,
    city,
    state,
    zipcode,
    deliveryInstructions,
  } = user || {};
  if (!name || !email || !phone || !address1 || !city || !state || !zipcode) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required user fields",
    });
  }

  try {
    const userId = req.user.uid;
    const orderId = uuidv4();

    const newOrder = {
      id: orderId,
      userId: userId,
      user: {
        name: name,
        email: email,
        phone: phone,
        address1: address1,
        address2: address2 || "",
        city: city,
        state: state,
        zipcode: zipcode,
        deliveryInstructions: deliveryInstructions || "",
      },
      items: items,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("pending-orders").add(newOrder);

    res.status(201).json({
      success: true,
      message: "Order successfully placed",
      data: { id: docRef.id, ...newOrder },
    });
  } catch (error) {
    console.error("Error placing order:", error.message);
    res.status(500).json({
      success: false,
      message: "Error placing order",
      error: error.message,
    });
  }
});

module.exports = router;
