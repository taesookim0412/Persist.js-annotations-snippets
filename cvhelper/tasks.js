const connections = require('./../configs/connections.js')
const inferenceHelper = require('./inference.js')
class Tasks{
    taskState = 0
    currentJob = null
    async seekJobThenCreateNewTask(parent){
        //Find one job then create the task
        const [data, req] = await parent.getOneJob(parent.clientId)
        if (Object.keys(data).length === 0)
            return
        this.createNewTask(data, req, parent.clientId)
    }
    createNewTask(job, req, clientId){
        if (this.taskState !== 0){
            return
        }
        this.taskState = 1
        this.currentJob = job;
        //TODO: infer with model on the job...
        const generatedImg = inferenceHelper.inferOnJob(this.currentJob)
        //send json to the persisted connection
        console.log('sending', generatedImg)
        req.write(JSON.stringify({'clientId': clientId,'jobId': job['jobId'], 'genImg':generatedImg}))
        req.end()



    }
}
module.exports = {
    Tasks
}