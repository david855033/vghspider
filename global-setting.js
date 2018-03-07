let fs=require('fs');
var rawDataDir="d:\\spiderdata\\raw_data";
var patientDataDir="d:\\spiderdata\\patient_data";
var checkDir = function(dir){
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

module.exports={
    rawDataDir:rawDataDir,
    patientDataDir:patientDataDir,
    checkDir:function(){
        checkDir(rawDataDir);
        checkDir(patientDataDir);
    }
}