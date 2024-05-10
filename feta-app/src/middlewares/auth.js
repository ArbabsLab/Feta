const firebase = require("firebase-admin");

async function verifyRole(req, res, next, expectedRole) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access - No token provided",
    });
  }

  const idToken = authHeader.split(" ")[1];
  try {
    const decodedToken = await firebase.auth().verifyIdToken(idToken);
    if (decodedToken.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden - You don't have permission to access this resource`,
      });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error(`Error verifying ${expectedRole} privileges:`, error.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized access - Invalid token",
    });
  }
}

async function verifyAdmin(req, res, next) {
  return verifyRole(req, res, next, "admin");
}

async function verifyMember(req, res, next) {
  return verifyRole(req, res, next, "member");
}

async function verifyChef(req, res, next) {
  return verifyRole(req, res, next, "chef");
}

async function verifyDriver(req, res, next) {
  return verifyRole(req, res, next, "driver");
}

module.exports = {
  verifyAdmin,
  verifyMember,
  verifyChef,
  verifyDriver,
};
