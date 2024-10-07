function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const pageValidteController=async(req,res)=>{
    // await sleep(3000);
    // console.log("Decoded ",req.userInfo)
    // console.log("Body",req.body)
    // console.log(req.body.role,"  ",req.userInfo.body)
    res.status(200).json({isVerified:true});
    
}
module.exports={
    pageValidteController
}