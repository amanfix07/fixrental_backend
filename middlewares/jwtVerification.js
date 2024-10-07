const jwt = require("jsonwebtoken");
const secretKey='masheen@123'
async function authenticateJWT(req, res, next) {
    const authHeader = await req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) return res.sendStatus(403);
            req.userInfo = decoded;
            req.token=token;
            next();
        });
    } else res.sendStatus(401);
}
module.exports = {authenticateJWT};