let fs=require('fs');
var commonDir = 'D:\\spiderdata'
var rawDataDir=commonDir+"\\raw_data5";
var patientDataDir=commonDir+"\\patient_data5";
var checkDir = function(dir){
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

module.exports={
    commonDir:commonDir,
    rawDataDir:rawDataDir,
    patientDataDir:patientDataDir,
    checkDir:function(){
        checkDir(rawDataDir);
        checkDir(patientDataDir);
    }
}