const constants = require('./constants.js')

const http = require('http');
const agent = new http.Agent({keepAlive: true})
const tasksClass = require('./../controllers/tasks.js')
const jwt = require('jsonwebtoken')
let fs = require('fs')
let path = require('path')

class Connections {
    connections = {}
    tasks = new tasksClass.Tasks()
    clientId = null;
    user = 'slave0'
    token = jwt.sign({}, fs.readFileSync(path.join(__dirname, '..', '...i put all my keys in this box')), {algorithm:'RS256'})

    constructor() {
        this.listenToServer()
    }
    listenToServer = async () => {
        const req = http.request({
                host: constants.serverhost,
                port: constants.serverport,
                path: '/some/slave/path/for/persist',
                method: 'POST',
                agent: agent,
                headers: {'Content-Type': 'application/json',
                'token': this.token,
                'user': this.user}
            }, (res) => {
                res.on('data', (chunk) => {
                    const data = JSON.parse(chunk)
                    const message = data['message']
                    if (message === 'new job'){
                        this.tasks.seekJobThenCreateNewTask(this)
                    }
                    if (message === 'initial'){
                        this.clientId = data['clientId']
                        if (Object.keys(data['job']).length !== 0){
                            this.tasks.createNewTask(data['job'], req, this.clientId)
                        }
                    }

                })
            }
        )
        req.on('end', () => {
            req.end()
        })
        req.on('error', (err) => {
            req.end()
        })
        req.end()
        this.connections[Date.now().toString()] = req
    }
    async getOneJob(clientId){
        const jsonData = JSON.stringify({'clientId': clientId})
        return new Promise((resolve, reject) => {
            const req = http.request({
                host:constants.serverhost,
                port:constants.serverport,
                path:'/a/path/for/slaves/for/queue/top',
                method: 'POST',
                agent: agent,
                headers: {'Content-Type':'application/json',
                    'Content-Length': jsonData.length,
                    'token': this.token,
                    'user': this.user},
            }, (res) => {
                res.on('data', (chunk) => {
                    const data = JSON.parse(chunk)
                    //req.end()
                    resolve([data, req])
                })
            })
            req.write(jsonData)
        })

    }
}

module.exports = new Connections()