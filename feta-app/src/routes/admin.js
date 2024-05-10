const express = require("express");
const { verifyAdmin } = require("../middlewares/auth");
const firebase = require("firebase-admin");
const db = firebase.firestore();

const router = express.Router();

// Add menu item (admin)
router.post("/menu", verifyAdmin, async (req, res) => {
  const { name, description, imageUrl, price } = req.body;

  if (!name || !description || !imageUrl || price === undefined || price < 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required fields or incorrect data",
    });
  }

  try {
    const newItem = {
      name,
      description,
      "image-url": imageUrl,
      price: Number(price),
    };

    const docRef = await db.collection("menu-items").add(newItem);

    res.status(201).json({
      success: true,
      message: "Menu item successfully added",
      data: { id: docRef.id, ...newItem },
    });
  } catch (error) {
    console.error("Error adding new menu item:", error.message);
    res.status(500).json({
      success: false,
      message: "Error adding new menu item",
      error: error.message,
    });
  }
});

// Update menu item (admin)
router.patch("/menu", verifyAdmin, async (req, res) => {
  const { id, name, description, imageUrl, price } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing menu item ID",
    });
  }

  const updateFields = {};
  if (name) updateFields.name = name;
  if (description) updateFields.description = description;
  if (imageUrl) updateFields.imageUrl = imageUrl;
  if (price !== undefined && price >= 0) updateFields.price = Number(price);

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - No fields to update",
    });
  }

  try {
    const menuItemDocRef = db.collection("menu-items").doc(id);
    const menuItemDoc = await menuItemDocRef.get();

    if (!menuItemDoc.exists) {
      return res.status(404).json({
        success: false,
        message: `No menu item found with ID: ${id}`,
      });
    }

    await menuItemDocRef.update(updateFields);

    res.status(200).json({
      success: true,
      message: "Menu item successfully updated",
      data: {
        id,
        ...updateFields,
      },
    });
  } catch (error) {
    console.error("Error updating menu item:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating menu item",
      error: error.message,
    });
  }
});

// Get pending menu submissions (admin)
router.get("/menu/submissions", verifyAdmin, async (_req, res) => {
  try {
    const snapshot = await db.collection("pending-menu-submissions").get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error getting menu submissions:", error.message);
    res.status(500).json({
      success: false,
      message: "Error getting menu submissions",
      error: error.message,
    });
  }
});

// Handle menu submissions (accept/reject) (admin)
router.post("/menu/submissions", verifyAdmin, async (req, res) => {
  const { status, id, price } = req.body;

  if (
    !status ||
    !id ||
    (status === "accept" && (typeof price !== "number" || price < 0))
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required fields or incorrect data",
    });
  }

  try {
    const pendingMenuSubmissionRef = db
      .collection("pending-menu-submissions")
      .doc(id);
    const pendingSubmission = await pendingMenuSubmissionRef.get();

    if (!pendingSubmission.exists) {
      return res.status(404).json({
        success: false,
        message: `No pending submission found with ID: ${id}`,
      });
    }

    if (status === "accept") {
      const submissionData = pendingSubmission.data();
      const newMenuItem = {
        ...submissionData,
        price,
      };

      const menuItemRef = await db.collection("menu-items").add(newMenuItem);
      await pendingMenuSubmissionRef.delete();

      return res.status(201).json({
        success: true,
        message: "Submission accepted and item added to menu successfully",
        data: { id: menuItemRef.id, ...newMenuItem },
      });
    }

    if (status === "reject") {
      await pendingMenuSubmissionRef.delete();
      return res.status(200).json({
        success: true,
        message: "Submission rejected successfully",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid status - Must be 'accept' or 'reject'",
    });
  } catch (error) {
    console.error("Error updating menu submission:", error.message);
    res.status(500).json({
      success: false,
      message: "Error updating menu submission",
      error: error.message,
    });
  }
});

// Get orders (pending/completed) (admin)
router.get("/orders", verifyAdmin, async (req, res) => {
  const { status } = req.query;
  if (!status || (status !== "pending" && status !== "completed")) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required fields",
    });
  }

  try {
    const collectionRef =
      status === "pending"
        ? db.collection("pending-orders")
        : db.collection("completed-orders");
    const snapshot = await collectionRef.get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error getting orders:", error.message);
    res.status(500).json({
      success: false,
      message: "Error getting orders",
      error: error.message,
    });
  }
});

// Assign delivery driver to pending order and move it to outstanding deliveries (admin)
router.post("/orders/assign", verifyAdmin, async (req, res) => {
  const { orderId, driverId } = req.body;
  if (!orderId || !driverId) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required fields",
    });
  }

  try {
    const pendingOrderRef = db.collection("pending-orders").doc(orderId);
    const pendingOrder = await pendingOrderRef.get();

    if (!pendingOrder.exists) {
      return res.status(404).json({
        success: false,
        message: `No pending order found with ID: ${id}`,
      });
    }

    const orderData = pendingOrder.data();
    const newOrderData = {
      ...orderData,
      driverId,
    };

    await db.collection("outstanding-deliveries").add(newOrderData);
    await pendingOrderRef.delete();

    return res.status(200).json({
      success: true,
      message: "Driver assigned to order successfully",
    });
  } catch (error) {
    console.error("Error assigning driver to order:", error.message);
    res.status(500).json({
      success: false,
      message: "Error assigning driver to order",
      error: error.message,
    });
  }
});

// Add chef (admin)
router.post("/chef/add", verifyAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required field 'email'",
    });
  }

  try {
    const user = await firebase.auth().getUserByEmail(email);
    await firebase.auth().setCustomUserClaims(user.uid, { role: "chef" });

    res.status(200).json({
      success: true,
      message: `User ${email} has been added as a chef`,
    });
  } catch (error) {
    console.error("Error adding new chef:", error.message);
    res.status(500).json({
      success: false,
      message: "Error adding new chef",
      error: error.message,
    });
  }
});

// Remove chef (admin)
router.post("/chef/remove", verifyAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required field 'email'",
    });
  }

  try {
    const user = await firebase.auth().getUserByEmail(email);
    await firebase.auth().setCustomUserClaims(user.uid, { role: "member" });

    res.status(200).json({
      success: true,
      message: `User ${email} has been removed as a chef`,
    });
  } catch (error) {
    console.error("Error removing chef:", error.message);
    res.status(500).json({
      success: false,
      message: "Error removing chef",
      error: error.message,
    });
  }
});

// Add driver (admin)
router.post("/driver/add", verifyAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required field 'email'",
    });
  }

  try {
    const user = await firebase.auth().getUserByEmail(email);
    await firebase.auth().setCustomUserClaims(user.uid, { role: "driver" });

    res.status(200).json({
      success: true,
      message: `User ${email} has been added as a delivery driver`,
    });
  } catch (error) {
    console.error("Error adding new delivery driver:", error.message);
    res.status(500).json({
      success: false,
      message: "Error adding new delivery driver",
      error: error.message,
    });
  }
});

// Remove driver (admin)
router.post("/driver/remove", verifyAdmin, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required field 'email'",
    });
  }

  try {
    const user = await firebase.auth().getUserByEmail(email);
    await firebase.auth().setCustomUserClaims(user.uid, { role: "member" });

    res.status(200).json({
      success: true,
      message: `User ${email} has been removed as a delivery driver`,
    });
  } catch (error) {
    console.error("Error removing delivery driver:", error.message);
    res.status(500).json({
      success: false,
      message: "Error removing delivery driver",
      error: error.message,
    });
  }
});

module.exports = router;
