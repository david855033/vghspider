let fs = require('fs');
let util = require('..//my-util.js');
let _ = require('lodash');
let patientDir = "G:\\patient_data4"; let workspaceDir = "G:\\workspace";
// let patientDir = "D:\\spider\\patient_data";
// let workspaceDir = "D:\\spider\\workspace";
// let patientDir = "D:\\spider\\patient_data"; let workspaceDir = "D:\\spider\\workspace";

let years = [2013, 2014, 2015, 2016, 2017];

// years = [2017];
//抓取曾經住過BR83的人(section=nb)
fs.writeFileSync(workspaceDir + "\\patient-data-set-nb-structure-all.csv", "");
function FindReport(Patient, Condition, Parser) {
    let findReport = [];
    Patient.report.forEach(x => x.array.forEach(y => findReport.push(y)));

    if (Condition.name) {
        findReport = findReport.filter(x => x.item.match(Condition.name));
    }
    if (Condition.specimen) {
        findReport = findReport.filter(x => x.specimen.match(Condition.specimen));
    }
    if (Condition.caseno) {
        findReport = findReport.filter(x => x.caseNo == Condition.caseno);
    }

    findReport.forEach(report => {
        var admissionReportGroup = Patient.reportContent.find(x => x.caseno == report.caseNo);
        if (admissionReportGroup) {
            var matchContent = admissionReportGroup.array.find(x => x.orderSeq == report.orderSeq);
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

function FindMedication(Patient, Condition, Parser) {
    if(Patient.hisID=="39676818"){
        console.log('stop');
    }
    let findMedication = [];
    if (Condition.caseno) {
        var array = Patient.medication.find(x => x.caseno == Condition.caseno).array || [];
        array.forEach(x => findMedication.push(x));
    }
    if (findMedication.length > 0 && Condition.name) {
        findMedication = findMedication.filter(x => {
            return (x.drugName || "").match(Condition.name) || (x.tradeName || "").match(Condition.name)
        });
    }
    return findMedication;
}

let BR_TCBs = [];
years.forEach(year => {
    let patientSet = JSON.parse(fs.readFileSync(workspaceDir + "\\patient-data-set-br83-" + year + ".json", "utf8"));
    console.log("birth year = " + year + ", patient count = " + patientSet.length);
    let resultStrings = [];
    resultStrings.push([
        "hisID",
        "birth-date",
        "gender",
        "br-admission-date",
        "nbr-admission-date",
        "ageOfAdmission",
        "BBW",
        "lastBrTCB",
        "lastBrTCBAge",
        "admissionDiagnosis",
        "admissionForJaundice",
        'admissionForSepsis',
        "firstWBC",
        "firstBand",
        "firstCRP",
        'firstBloodCulture',
        "maxBilNBR",
        'urine culture Report',
        'firstUA_WBC',
        'firstUA_COMMENT',
        'lastHearingReport',
        'abxDay'
    ].join(','));

    patientSet.forEach((p, index) => {
        var brAdmissionDate = util.getDateFromShortDate(p.admissionList.array.find(x => x.section == 'NB').admissionDate);
        var brCaseNo = p.admissionList.array.find(x => x.section == 'NB').caseNo;

        //出生七天內住NBR
        var admission = p.admissionList.array.filter(x => x.section != 'NB' &&
            util.getDateDifference(x.admissionDate, p.patientData.birthDate) <= 7);

        var nbrAdmissionDate = admission.length > 0 ? admission[0].admissionDate : "";
        var nbrAdmissionCaseNo = admission.length > 0 ? admission[0].caseNo : "";

        var ageOfAdmission = nbrAdmissionDate && util.getDateDifference(nbrAdmissionDate, p.patientData.birthDate);

        var bbw = p.vitalSign.find(x => x.type == "HWS").data
            .filter(x => util.getDateDifference(x[0].split(' ')[0], p.patientData.birthDate) <= 1)
            .filter(x => {
                var match = x[2].match(/\d+(.\d+)?/);
                return match&&(match[0] <= 5)
            })
            .sort((a, b) => a[0] > b[0])
            .map(x => x[2].match(/\d+(.\d+)?/)[0])
            .filter(x => x != 0);
        bbw = bbw ? bbw[0] : "";

        var NBRAdmissionNote = p.admissionNote.find(x => x.caseno == nbrAdmissionCaseNo);
        if (NBRAdmissionNote) {
            var admissionDiagnosis = NBRAdmissionNote.content.match(/臆斷\s*\(IMPRESSION\)[\s\S]*計劃與目標/g);
            if (admissionDiagnosis) {
                admissionDiagnosis = admissionDiagnosis[0].replace(/(臆斷\s*\(IMPRESSION\)|計劃與目標)/g, "").replace(/[,\s]+/g, ' ').trim();
            } else {
                admissionDiagnosis = "";
            }
        }
        var admissionForJaundice = (admissionDiagnosis || "").match(/(jaund|hyperbili)/i) ? 1 : "";
        var admissionForSepsis = (admissionDiagnosis || "").match(/(sepsis|infect|septic|cellulitis|pneumonia|uti|meningitis|bacter|fever|bronchili|age|colitis)/i) ? 1 : "";

        var BrTcbReport = FindReport(p, { name: /TCB/, caseno: brCaseNo }, x => {
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

        if (BrTcbReport.length > 0) {
            var sortedBrTCBReport = BrTcbReport.sort((a, b) => a.content.date < b.content.date)
            var lastBrTCBReport = sortedBrTCBReport.shift();
            var lastBrTCB = lastBrTCBReport.content.tcb;
            var lastBrTCBAge = util.getDateDifference(lastBrTCBReport.content.date, p.patientData.birthDate);

            if (admissionForJaundice) {
                BR_TCBs.push({ tcb: lastBrTCBReport.content.tcb, age: util.getDateDifference(lastBrTCBReport.content.date, p.patientData.birthDate), admission: 1 })
            } else {
                BR_TCBs.push({ tcb: lastBrTCBReport.content.tcb, age: util.getDateDifference(lastBrTCBReport.content.date, p.patientData.birthDate), admission: 0 })
            }
            sortedBrTCBReport.forEach(x => {
                BR_TCBs.push({ tcb: x.content.tcb, age: util.getDateDifference(x.content.date, p.patientData.birthDate), admission: 0 })
            });
        }

        var WBCReport = FindReport(p, { name: /(WBC|CBC)/, caseno: nbrAdmissionCaseNo }, x => {
            let match = x.match(/WBC(\s\D\s|\s+)\d+\s*\/(cumm|ul)/i);
            let matchBand = (x.match(/band.*?%/i)||[])[0]||"";
            let band ="";
            if(matchBand){
                band=(matchBand.match(/\d+(\.\d+)?/i)||[])[0]||"";
            }
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                return {
                    wbc: match[0].replace(/(WBC(\s\D\s|\s+)|\s*\/(cumm|ul))/gi, '').trim(),
                    band: band,
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        var firstWBC = "";
        var firstBand = "";
        if (WBCReport.length > 0) {
            var firstWBC = WBCReport.sort((a, b) => a.content.date > b.content.date)[0].content.wbc;
            var firstBand = WBCReport.sort((a, b) => a.content.date > b.content.date)[0].content.band;
        }

        var CRPReport = FindReport(p, { name: /CRP/, caseno: nbrAdmissionCaseNo }, x => {
            let match = x.match(/CRP(\s\D\s|\s+)(>|<)?\s*\d+(.\d+)?\s*mg\/dl/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                return {
                    crp: match[0].replace(/(CRP(\s\D\s|\s+)|mg\/dl|<|>)/gi, '').trim(),
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        var firstCRP = "";
        if (CRPReport.length > 0) {
            var firstCRP = CRPReport.sort((a, b) => a.content.date > b.content.date)[0].content.crp;
        }

        var BloodCultureReport = FindReport(p, { name: /Blood\sculture/i, caseno: nbrAdmissionCaseNo }, x => {
            let match = x.match(/CFU\s+BOT[\s\S]*?抗生素名稱/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                match = match[0].replace(/(CFU\s+BOT|抗生素名稱)/gi, '').trim();
                var c1 = match.match(/1\s.*?\/ml/i)[0].replace(/(^1)/i, '').replace(/(\/ml$)/i, '').trim();
                var c2 = match.match(/2\s.*?\/ml/i)[0].replace(/(^2)/i, '').replace(/(\/ml$)/i, '').trim();
                var c3 = match.match(/3\s.*?\/ml/i)[0].replace(/(^3)/i, '').replace(/(\/ml$)/i, '').trim();
                var c = [];
                c1 && c.push(c1); c2 && c.push(c2); c3 && c.push(c3);
                c= c.join('-');
                if(c.match(/no bacte/i)){c="neg"}
                return {
                    c: c,
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        var firstBloodCulture = "";
        if (BloodCultureReport.length > 0) {
            var firstBloodCulture = BloodCultureReport.sort((a, b) => a.content.date > b.content.date)[0].content.c;
        }

        var BilMicroNBR = FindReport(p, { name: /(micro\sbili)/i, caseno: nbrAdmissionCaseNo }, x => {
            var match = x.match(/\(\s\d+(\.\d+)?\s\)\smg\/dl/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            var value = "";
            if (match) {
                value = match[0].replace(/(\(|\)|mg\/dl)/gi, '').trim();
                return {
                    value: value,
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                };
            } else {
                return {}
            }
        });
        var Bil_SMACNBR = FindReport(p, { name: /(bil-t)/i, caseno: nbrAdmissionCaseNo }, x => {
            var match = x.match(/T\.BILI(\s\D\s|\s+)\d+(.\d+)?\smg\/dl/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (!matchDate) {
                matchDate = x.match(/報告時間： \d{8}/i);
            }
            var value = "";
            if (match) {
                value = match[0].replace(/(T\.BILI(\s\D\s|\s+)|\smg\/dl)/gi, '').trim();
                return {
                    value: value,
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                };
            } else {
                return {}
            }
        });
        var maxBilNBR = 0;
        //BilMicroNBR.forEach(x => maxBilNBR = Math.max(x.content.value, maxBilNBR));
        Bil_SMACNBR.forEach(x => maxBilNBR = Math.max(x.content.value, maxBilNBR));
        maxBilNBR = maxBilNBR ? maxBilNBR : "";

        var UrineCultureReport = FindReport(p, { name: /ordinary\sculture/i, specimen: /urine/i, caseno: nbrAdmissionCaseNo }, x => {
            let match = x.match(/CFU\s+BOT[\s\S]*?抗生素名稱/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                match = match[0].replace(/(CFU\s+BOT|抗生素名稱)/gi, '').trim();
                var c1 = match.match(/1\s.*?\/ml/i)[0].replace(/(^1)/i, '').replace(/(\/ml$)/i, '').trim();
                var c2 = match.match(/2\s.*?\/ml/i)[0].replace(/(^2)/i, '').replace(/(\/ml$)/i, '').trim();
                var c3 = match.match(/3\s.*?\/ml/i)[0].replace(/(^3)/i, '').replace(/(\/ml$)/i, '').trim();
                var c = [];
                c1 && c.push(c1); c2 && c.push(c2); c3 && c.push(c3);
                c=c.join('-');
                if(c.match(/\d+/)&&c.match(/\d+/)[0]<10000){c="neg";}
                if(c.match(/(no bacte|Normal|contam|coag|bacill)/i)){c="neg";}
                return {
                    c: c,
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        var firstUrineCulture = "";
        if (UrineCultureReport.length > 0) {
            var firstUrineCulture = UrineCultureReport.sort((a, b) => a.content.date > b.content.date)[0].content.c;
        }

        var UA_Report = FindReport(p, { name: /routine/i, specimen: /urine/i, caseno: nbrAdmissionCaseNo }, x => {
            let matchWBC = x.match(/WBC\/PUS.*?\/hpf/i);
            let wbc = "";
            if (matchWBC) {
                wbc = matchWBC[0].replace(/(WBC\/PUS\s+:|\/hpf)/gi, '').trim().split('-')[0].trim();
            }

            let matchComment = x.match(/comment.*/i);
            let comment = "";
            if (matchComment) {
                comment = matchComment[0].replace(/comment\s?:?/gi, '').replace(/(,|\s+)/g, ' ').trim();
            }

            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (matchWBC && matchDate) {
                return {
                    wbc: wbc,
                    comment: comment,
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        var firstUA_WBC = "";
        if (UA_Report.length > 0) {
            var firstUA_WBC = UA_Report.sort((a, b) => a.content.date > b.content.date)[0].content.wbc;
        }
        var firstUA_comment = "";
        if (UA_Report.length > 0) {
            var firstUA_comment = UA_Report.sort((a, b) => a.content.date > b.content.date)[0].content.comment;
        }

        var HearingReport = FindReport(p, { name: /HEARING/i }, x => {
            let matchPASS = x.match(/\(\s?.{1,3}\s?\)\sPASS/i);
            let matchREFER1 = x.match(/\(\s?.{1,3}\s?\)\sREFER\sTO/gi);
            let matchREFER2 = x.match(/\(\s?.{1,3}\s?\)\sREFER\sRESULT/gi);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (matchPASS && matchDate) {
                return {
                    value: matchPASS[0].match(/v/i) ? '1' : '0',
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        var lastHearingReport = "";
        if (HearingReport.length > 0) {
            var lastHearingReport = HearingReport.sort((a, b) => a.content.date < b.content.date)[0].content.value;
        }

        var findAbx = FindMedication(p, { name: /(ampi|exaci|amoxi|merop|clafo|genta|cefazo|oxaci|tazoc|vanco|teico)/i, caseno: nbrAdmissionCaseNo }, x => {
            return x;
        })
        var abxDay = "";
        if (findAbx.length > 0) {
            var AbxStart = _.minBy(findAbx, (x => x.startDateTime)).startDateTime;
            var AbxEnd = _.maxBy(findAbx, (x => x.endDateTime)).endDateTime;
            abxDay = util.getDateDifference(AbxStart, AbxEnd)
        }

        resultStrings.push([
            p.hisID,
            p.patientData.birthDate,
            p.patientData.gender,
            brAdmissionDate,
            nbrAdmissionDate,
            ageOfAdmission,
            bbw,
            lastBrTCB,
            lastBrTCBAge,
            admissionDiagnosis,
            admissionForJaundice,
            admissionForSepsis,
            firstWBC,
            firstBand,
            firstCRP,
            firstBloodCulture,
            maxBilNBR,
            firstUrineCulture,
            firstUA_WBC,
            firstUA_comment,
            lastHearingReport,
            abxDay
        ].join(','));
        process.stdout.write('\r>>load patient: ' + index + "  ");
    })

    var msExcelBuffer = Buffer.concat([
        new Buffer('\xEF\xBB\xBF', 'binary'),
        new Buffer(resultStrings.join("\r\n"))
    ]);
    console.log(" ");
    fs.writeFileSync(workspaceDir + "\\patient-data-set-nb-structure-" + year + ".csv", msExcelBuffer);
    fs.appendFileSync(workspaceDir + "\\patient-data-set-nb-structure-all.csv", msExcelBuffer);

});

var maxAge = _.max(BR_TCBs.map(x => x.age));
var minAge = 0;
var titleStrings = [];
var resultStrings = [];
var values = [];
for (var i = 0; i <= maxAge; i++) {
    var currentTcbs = BR_TCBs.filter(x => x.age == i);
    titleStrings.push("age-" + i + "-nonAd-tcb");
    values.push([]);
    titleStrings.push("age-" + i + "-Ad-Jaundice-tcb");
    values.push([]);
}
resultStrings.push(titleStrings.join(','));

BR_TCBs.forEach(x => {
    var position = (x.age) * 2 + x.admission;
    values[position].push(x.tcb);
})
let maxRow = _.max(values.map(x => x.length));

for (var i = 0; i < maxRow; i++) {
    resultStrings.push(values.map(x => i < x.length ? x[i] : "").join(','));
}

var msExcelBufferTCBs = Buffer.concat([
    new Buffer('\xEF\xBB\xBF', 'binary'),
    new Buffer(resultStrings.join("\r\n"))
]);
fs.writeFileSync(workspaceDir + "\\patient-data-set-nb-tcbs.csv", msExcelBufferTCBs);

