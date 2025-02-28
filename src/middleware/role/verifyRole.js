function verifyRole(role) {
    return (req, res, next) => {  
        let checkRole=role;
        req.role=checkRole;
        next()
    };
  }

  function verifyRoles(roles) {
    return (req, res, next) => {
      const userRole = req.user.role; // Assuming req.user contains the authenticated user's details
  
      if (roles.includes(userRole)) {
        // req.role = userRole;
        next();
      } else {
        return res.status(403).json({ message: 'Access denied: You do not have the required role.' 
 
        });
      }
    };
  }
  
  module.exports ={
    verifyRole,
    verifyRoles
  };