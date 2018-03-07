let fs=require('fs');
var rawDataDir="C:\\Users\\羅宇成\\Documents\\raw_data";
var patientDataDir="C:\\Users\\羅宇成\\Documents\\patient_data";
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