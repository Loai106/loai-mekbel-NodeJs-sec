const errorHandler = (error,req,res,next)=>{
    console.log('error handler middleware')
    return res.status(400).send(error.message);

}

module.exports = errorHandler;