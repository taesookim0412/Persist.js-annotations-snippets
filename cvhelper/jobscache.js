const mongoose = require('mongoose')
const jobs = mongoose.model('jobs')
//0 - new
// 1 - progress
// 2 - done
class JobsCache{
    currentClientId = 0
    //jobId: {'job':job, 'res':res}
    allJobs = {}
    //clientId: {job, res}
    jobsInProgress = {}
    constructor() {
        // jobs.find({status: {$ne: 2 }},(err, data) => {
        //     data.forEach(doc => {
        //         this.allJobs[doc['jobId']] = doc
        //     })
        //     console.log(this.allJobs)
        //
        // });
    }
    jobsObj(job, res){
        return {'job':job,'res':res}
    }
    pushJob(job, res){
        this.allJobs[job['jobId']] = this.jobsObj(job,res);
    }
    getOneJob(clientId, res){
        //creates a job, then stores {job, res} under jobsInProgress[clientId]
        for (let jobId in this.allJobs){
            let targetJob = this.allJobs[jobId]
            if (this.allJobs[jobId]['job']['status'] === 0){
                this.allJobs[jobId]['job']['status'] = 1
                //this.jobsInProgress[targetJob['jobId']] = targetJob
                this.jobsInProgress[clientId] = {'job': targetJob, 'res':res}
                //todo/opt: update the status in the database. Requires setting everything to zero in the database on initialization.
                return targetJob['job']
            }
        }
        return {}
    }
    // getOneJob(key){
    //     for (let i = 0; i < this.allJobs.length; i++){
    //         let targetJob = this.allJobs[i]
    //         if (this.allJobs[i]['status'] === 0){
    //             this.allJobs[i]['status'] = 1
    //             //this.jobsInProgress[targetJob['jobId']] = targetJob
    //             this.jobsInProgress[key] = targetJob
    //             //todo/opt: update the status in the database. Requires setting everything to zero in the database on initialization.
    //             return targetJob
    //         }
    //     }
    //     return {}
    // }
    getClientId(){
        const clientId = this.currentClientId
        this.currentClientId += 1
        return clientId
    }
    onClientAbort(clientId){
        if (this.jobsInProgress[clientId] === undefined){
            return;
        }
        const jobId = this.getJobInProgressValue(clientId, 'jobId')
        this.setJobValue(jobId,'status',0)
        delete this.jobsInProgress[clientId]
        // console.log(this.jobsInProgress)
        // console.log(this.allJobs)

    }
    getJobInProgressValue(clientId, key){
        //key: key for Job object
        return this.getJobInProgress(clientId)[key]
    }
    getJobInProgress(clientId){
        return this.jobsInProgress[clientId]['job']
    }
    setJobCompleted(clientId, jobId, genImg){
        //job id passed by slave; probably better than object lookup.
        const jobInProgressData = this.jobsInProgress[clientId]['job']
        const job = jobInProgressData['job']
        //Update in db
        jobs.findByIdAndUpdate(job['jobId'], {'status':2, 'genImg':genImg})
        //Delete current job
        delete this.jobsInProgress[clientId]
        //Set cache status to completed
        this.setJobValue(jobId, 'status', 2)

    }
    setJobValue(jobId, key, value){
        this.allJobs[jobId]['job'][key] = value
    }
}
module.exports = new JobsCache()