let fs = require('fs');
let util = require('..//my-util.js');

// let patientDir = "G:\\patient_data";
// let workspaceDir = "G:\\workspace";
let patientDir = "D:\\spider\\patient_data";
let workspaceDir = "D:\\spider\\workspace";


console.log("run ETL");
console.log(">>patientDir: " + patientDir);
console.log(">>workspaceDir: " + workspaceDir);

let patientFiles = fs.readdirSync(patientDir);
console.log(">>availible file in patient Dir: " + patientFiles.length);

let fileListByYear = [];

for (let i = 0; i < patientFiles.length; i++) {   // should be patientFiles.length
    let data = fs.readFileSync(patientDir + "\\" + patientFiles[i], "utf8");
    let patient = JSON.parse(data);
    let birthyear = patient.patientData.birthDate.split('-')[0];
    let container = fileListByYear.filter(x => x.birthyear == birthyear)[0];
    if (!container) {
        container = { birthyear: birthyear, array: [] };
        fileListByYear.push(container);
    };
    container.array.push(patientFiles[i]);
    process.stdout.write('\r>>load file: ' + i + "  ");
}
console.log("");
console.log(">>write to single patient file by year to work space...");


for (let i = 2012; i <= 2017; i++) {
   let fileListOfYear = fileListByYear.filter(x=>x.birthyear == i)[0];
   let patientDataSet = [];
   fileListOfYear.array.forEach((file)=>{
        let data = fs.readFileSync(patientDir + "\\" + file, "utf8");
        let patient = JSON.parse(data);
        patientDataSet.push(patient);
   });
   fs.writeFileSync(workspaceDir+"\\patient-data-set-"+i+".json",JSON.stringify(patientDataSet));
}
