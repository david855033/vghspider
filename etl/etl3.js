let fs = require('fs');
let util = require('..//my-util.js');

// let patientDir = "G:\\patient_data";
// let workspaceDir = "G:\\workspace";
let patientDir = "D:\\spider\\patient_data";
let workspaceDir = "D:\\spider\\workspace";

let years = [2013, 2014, 2015, 2016, 2017];

years = [2013];
//抓取曾經住過BR83的人(section=nb)

function FindReport(Patient, RegexCondition, Parser) {
    let findReport = [];
    Patient.report.forEach(reportGroup => {
        reportGroup.array.filter(x => x.item.match(RegexCondition)).forEach(matchedReport => {
            if (findReport.findIndex(x => x.caseNo == matchedReport.caseNo && x.orderSeq == matchedReport.orderSeq) < 0)
                findReport.push(matchedReport)
        })
    })
    findReport.forEach(report => {
        var admissionReportGroup = Patient.reportContent.find(x => x.caseno == report.caseNo);
        if (admissionReportGroup) {
            var matchContent = admissionReportGroup.array.find(x => x.ordseq == report.orderSeq);
            if (matchContent) {
                report.contentRaw = matchContent.value;
                if (Parser) {
                    report.content = Parser(matchContent.value);
                }
            }
        }
    })
    return findReport;
}

years.forEach(year => {
    let patientSet = JSON.parse(fs.readFileSync(workspaceDir + "\\patient-data-set-br83-" + year + ".json", "utf8"));
    console.log("birth year = " + year + ", patient count = " + patientSet.length);

    let resultStrings = [];
    resultStrings.push([
        "birth-date",
        "gender",
        "br-admission-date",
        "nbr-admission-date",
        "ageOfAdmission",
        "BBW"
    ].join(','));
    patientSet.forEach((p, index) => {
        var brAdmissionDate =  util.getDateFromShortDate(p.admissionList.array.find(x=>x.section=='NB').admissionDate);

        var tcbReport = FindReport(p, /TCB/, x => {
            let match = x.match(/\(\s*\d+(.\d+)?\s*\)/);
            let matchDate = x.match(/簽收時間： \d{8}/);
            if (match && matchDate) {
                return {
                    tcb: match[0].replace(/(\(|\))/g, '').trim(),
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });

        var admission = p.admissionList.array.filter(x => x.section!='NB' &&
        util.getDateDifference(x.admissionDate, p.patientData.birthDate)<=7);

        var nbrAdmissionDate = admission.length>0?admission[0].admissionDate:"";

        var ageOfAdmission = nbrAdmissionDate&&util.getDateDifference(nbrAdmissionDate,p.patientData.birthDate);
        
        var bbw = p.vitalSign.find(x=>x.type=="HWS").data
            .filter(x=>util.getDateDifference(x[0].split(' ')[0], p.patientData.birthDate )<=1)
            .sort((a,b)=> a[0]>b[0])
            .map(x=>x[2].match(/\d+(.\d+)?/)[0])
            .filter(x=>x!=0);
        bbw=bbw?bbw[0]:"";

        resultStrings.push([
            p.patientData.birthDate,
            p.patientData.gender,
            brAdmissionDate,
            nbrAdmissionDate,
            ageOfAdmission,
            bbw
        ].join(','));
        process.stdout.write('\r>>load patient: ' + index + "  ");
    })

    var msExcelBuffer = Buffer.concat([
        new Buffer('\xEF\xBB\xBF', 'binary'),
        new Buffer(resultStrings.join("\r\n"))
    ]);
    console.log(" ");
    fs.writeFileSync(workspaceDir + "\\patient-data-set-nb-structure-" + year + ".csv", msExcelBuffer);
});

