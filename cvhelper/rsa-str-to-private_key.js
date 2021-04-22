const fs = require('fs')
const path = require('path')
const expressJwt = require('express-jwt')
const jwt = require('jsonwebtoken')

const secret = fs.readFileSync(path.join(__dirname, '..','webkeys','public.key'))

const s = req.body.s.toString()
let new_s = s.slice(31, -29).replace(/ /g, '\n')
new_s = `-----BEGIN RSA PRIVATE KEY-----${newpw}-----END RSA PRIVATE KEY-----`
let token = undefined
try{
    token = jwt.sign({}, new_s, { algorithm: 'RS256'});
}
catch {
    console.log('failed')
    return res.json({'message': 'failed'})
}
jwt.verify(token, secret, (err, decoded) => {
  if (err){
      console.log('err', err.toString())
  }
  else{
      res.json({'message':'success'})
  }
})