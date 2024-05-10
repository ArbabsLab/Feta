const express = require("express");
const firebase = require("firebase-admin");
const db = firebase.firestore();

const router = express.Router();

// Get menu
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("menu-items").get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error getting menu items:", error.message);
    res.status(500).json({
      success: false,
      message: "Error getting menu items",
      error: error.message,
    });
  }
});

module.exports = router;
