const expressJwt = require('express-jwt')
const fs = require('fs')
const path = require('path')
const RSA_PUBLIC_KEY = fs.readFileSync(path.join(__dirname, '..', '........this is my key directoryyy'))
module.exports = (app) => {
    const checkIfAuth = expressJwt({
        secret: RSA_PUBLIC_KEY,
        getToken: (req) => {
            if (req && req.headers && req.headers.token && req.headers.user) {
                return req.headers.token;
            }
            return null;
        },
        algorithms: ['RS256']
    }).unless({path: [/\/static*/, '/login']})
    app.use(checkIfAuth);
    //Only pops up when an error is here
    app.use((err, req, res, next) => {
        if (err){
            console.log(err.name, err.status, err.message, req.url);
            return res.json({'status':'error'})
        }
    });
}
