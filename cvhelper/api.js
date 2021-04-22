{
  postImg: (req, res) => {
      S3PostImg(req, res, async (err) => {
          if (err) {
              return res.json({'status': 0})
          }
          // jobs.create({inputImg: req.file.location.toString(), baseImg: ''}).then((err) =>{
          //     return res.json({'status': 1}) }
          // )
          let newJob = {inputImg: req.file.location.toString(), baseImg: '', status: 0, createdAt: Date.now()}
          jobs.create(newJob).then((data) => {
                  jobsCache.pushJob(data, res);
                  jobsHelper.notifySlaves()
                  //return res.json({'status': 1})
              }
          )
      })
  },    
    
    getOneJob: (req, res) => {
        //clientId required. Each slave should obtain a clientId in initial
        req.socket.setKeepAlive(true)
        res.write(JSON.stringify(jobsCache.getOneJob(req.body.clientId, res)))
        req.socket.on('data', (data) => {
            const jsonData = JSON.parse(data)
            jobsHelper.notifyCompletedJob(jsonData)
            res.end()
        })
    },
    persist: (req, res) => {
        jobsHelper.persistConnection(req, res);
    },
    postOneJob: (req, res) => {
        const workImg = req.body.genImg
        const jobId = req.body.jobId
        jobsHelper.notifyCompletedJob(req.body)
    }
}