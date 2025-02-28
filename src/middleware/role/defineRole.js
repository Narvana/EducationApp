const defineRole=(role)=>{
    let roleSet=role;
    return (req, res, next) => {
        req.role = roleSet; // Attach role to the request object
        next(); // Pass control to the next middleware
      };
}

module.exports=defineRole;
