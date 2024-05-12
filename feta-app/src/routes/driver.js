const express = require("express");
const { verifyDriver } = require("../middlewares/auth");
const firebase = require("firebase-admin");
const db = firebase.firestore();

const router = express.Router();

// Get deliveries by status (outstanding/completed) (driver)
router.get("/deliveries", verifyDriver, async (req, res) => {
  const { status } = req.query;
  if (!status || (status !== "outstanding" && status !== "completed")) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required fields",
    });
  }

  try {
    const driverId = req.user.uid;
    const collectionRef =
      status === "outstanding"
        ? db.collection("outstanding-deliveries")
        : db.collection("completed-deliveries");
    const snapshot = await collectionRef
      .where("driverId", "==", driverId)
      .get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error getting driver deliveries:", error.message);
    res.status(500).json({
      success: false,
      message: "Error getting driver deliveries",
      error: error.message,
    });
  }
});

// Complete delivery (outstanding -> completed) (driver)
router.post("/deliveries/complete", verifyDriver, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required fields",
    });
  }

  try {
    const deliveryDocRef = db.collection("outstanding-deliveries").doc(id);
    const deliveryDoc = await deliveryDocRef.get();

    if (!deliveryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `No delivery found with ID: ${id}`,
      });
    }

    const deliveryData = deliveryDoc.data();

    if (deliveryData.driverId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - This delivery does not belong to you",
      });
    }

    const completedDeliveriesRef = db
      .collection("completed-deliveries")
      .doc(id);
    const completedOrdersRef = db.collection("completed-orders").doc(id);

    await completedDeliveriesRef.set(deliveryData);
    await completedOrdersRef.set(deliveryData);
    await deliveryDocRef.delete();

    res.status(200).json({
      success: true,
      message: "Delivery marked as completed",
      data: {
        id,
        ...deliveryData,
      },
    });
  } catch (error) {
    console.error("Error updating delivery status:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating delivery status",
      error: error.message,
    });
  }
});

module.exports = router;
