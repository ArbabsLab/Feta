const firebase = require("firebase-admin");

async function verifyRole(req, res, next, expectedRole) {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access - No token provided",
    });
  }

  try {
    const decodedToken = await firebase.auth().verifyIdToken(token);
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
    if (error.message.toLowerCase().includes('id-token-expired')) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.redirect(301, '/login');
    } else {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access - Invalid token",
      });
    }
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
