const jobsCache = require('./../models/JobsCache/jobscache.js')

class JobsHelper{
    repeatJobs = {};

    constructor() {
    }
    async notifySlaves(){
        Object.keys(this.repeatJobs).forEach(clientId => {
            this.repeatJobs[clientId]['res'].write(JSON.stringify({'message': 'new job'}))
        })
    }
    persistConnection(req, res) {
        const clientId = jobsCache.getClientId()
        // res.write(JSON.stringify(jobsCache.getOneJob(clientId)))
        //console.log(jobsCache.getOneJob(clientId))
        this.repeatJobs[clientId] = {}
        this.repeatJobs[clientId]['timer'] = setInterval(this.sendMessage, 1000, req, res, clientId)
        this.repeatJobs[clientId]['res'] = res
        res.write(JSON.stringify({'message': 'initial', 'job':jobsCache.getOneJob(clientId, res), 'clientId': clientId}))
    }

    sendMessage = (req, res, clientId) => {
        if (req['aborted'] === true){
            //if the client aborted the connection:
            jobsCache.onClientAbort(clientId)
            clearInterval(this.repeatJobs[clientId]['timer']);
            delete this.repeatJobs[clientId]
            //return;
        }
        //res.write(JSON.stringify({'status':1}))
    }
    notifyCompletedJob = (data) => {
        const clientId = data['clientId']
        const jobId = data['jobId']
        const genImg = data['genImg']
        const completedJob = jobsCache.getJobInProgress(clientId)
        jobsCache.setJobCompleted(clientId, jobId, genImg)
        completedJob['job']['genImg'] = genImg
        const res = completedJob['res']
        res.send(completedJob['job'])
    }

}

module.exports = new JobsHelper();