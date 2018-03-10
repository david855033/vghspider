let fs = require('fs');
let util = require('..//my-util.js');

let patientDir = "G:\\patient_data";
let workspaceDir = "G:\\workspace";



let years = [2012, 2013, 2014, 2015, 2016, 2017];
years = [2013];
//抓取曾經住過BR83的人(section=nb)



years.forEach(year => {
    let patientSet = JSON.parse(fs.readFileSync(workspaceDir + "\\patient-data-set-nb-" + year + ".json","utf8"));
    console.log("birth year = " + year + ", patient count = " + patientSet.length);

    let resultStrings=[];
    resultStrings.push([
        "birth-date",
        "gender",
        "br-admission-date"
    ].join(','));
    patientSet.forEach(p=>{
        resultStrings.push([
            p.patientData.birthDate,
            p.patientData.gender,
            util.getDateFromShortDate(p.admissionNote[0].admissionDate)
        ].join(','));
    })

    var msExcelBuffer = Buffer.concat([
        new Buffer('\xEF\xBB\xBF', 'binary'),
        new Buffer(resultStrings.join("\r\n"))
    ]);

    fs.writeFileSync(workspaceDir+"\\patient-data-set-nb-structure-"+year+".csv",msExcelBuffer);
});