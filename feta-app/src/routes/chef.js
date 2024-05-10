const express = require("express");
const { verifyChef } = require("../middlewares/auth");
const firebase = require("firebase-admin");
const db = firebase.firestore();

const router = express.Router();

// Update menu item (chef) (price cannot be updated)
router.patch("/menu", verifyChef, async (req, res) => {
  const { id, name, description, imageUrl } = req.body;

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

// Submit new menu item for review (chef)
router.post("/menu/submissions", verifyChef, async (req, res) => {
  const { name, description, imageUrl } = req.body;

  if (!name || !description || !imageUrl) {
    return res.status(400).json({
      success: false,
      message: "Invalid request - Missing required fields",
    });
  }

  try {
    const newItem = {
      name,
      description,
      "image-url": imageUrl,
    };

    const docRef = await db.collection("pending-menu-submissions").add(newItem);

    res.status(201).json({
      success: true,
      message: "Menu item successfully submitted for review",
      data: { id: docRef.id, ...newItem },
    });
  } catch (error) {
    console.error("Error submitting new menu item:", error.message);
    res.status(500).json({
      success: false,
      message: "Error submitting new menu item",
      error: error.message,
    });
  }
});

module.exports = router;
