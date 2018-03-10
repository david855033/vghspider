let fs = require('fs');
let util = require('..//my-util.js');

let patientDir = "G:\\patient_data";
let workspaceDir = "G:\\workspace";

let years = [2012, 2013, 2014, 2015, 2016, 2017];

//抓取曾經住過BR83的人(section=nb)

years.forEach(year => {
    let patientSet = JSON.parse(fs.readFileSync(workspaceDir + "\\patient-data-set-" + year + ".json"));
    console.log("birth year = " + year + ", patient count = " + patientSet.length);

    let patientAdmittToBR = patientSet.filter(x => {
        let match = x.admissionList.array.findIndex(y => y.section=="NB") >= 0
        return match;
    });

    console.log(">>> matched count = "+ patientAdmittToBR.length);
    fs.writeFileSync(workspaceDir+"\\patient-data-set-nb-"+year+".json",JSON.stringify(patientAdmittToBR));
});