let fs = require('fs');
let util = require('..//my-util.js');
let _ = require('lodash');
// let patientDir = "G:\\patient_data";
// let workspaceDir = "G:\\workspace";
// let patientDir = "D:\\spider\\patient_data";
// let workspaceDir = "D:\\spider\\workspace";
let patientDir = "D:\\spider\\patient_data"; let workspaceDir = "D:\\spider\\workspace";

let years = [2013,2014,2015,2016,2017];

years = [2017];
//抓取曾經住過BR83的人(section=nb)

function FindReport(Patient, Condition, Parser) {
    let findReport = [];

    Patient.report.forEach(reportGroup => {
        reportGroup.array.forEach(matchedReport => {
            if (findReport.findIndex(x => x.caseNo == matchedReport.caseNo && x.orderSeq == matchedReport.orderSeq) < 0)
                findReport.push(matchedReport)
        })
    })
    if (Condition.NameCondition) {
        findReport = findReport.filter(x => x.item.match(Condition.NameCondition));
    }
    if (Condition.SpecimenCondition) {
        findReport = findReport.filter(x => x.specimen.match(Condition.SpecimenCondition));
    }
    if (Condition.caseno) {
        findReport = findReport.filter(x => x.caseNo == Condition.caseno);
    }

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

function FindMedication(Patient, Condition, Parser) {
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


years.forEach(year => {
    let patientSet = JSON.parse(fs.readFileSync(workspaceDir + "\\patient-data-set-br83-" + year + ".json", "utf8"));
    console.log("birth year = " + year + ", patient count = " + patientSet.length);

    let BR_TCBs = [];
    let resultStrings = [];
    resultStrings.push([
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
        "firstWBC",
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

        var tcbReport = FindReport(p, { NameCondition: /TCB/ }, x => {
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
        var brTCBReports = tcbReport.filter(x => x.caseNo == brCaseNo);

        if (brTCBReports.length > 0) {
            var sortedBrTCBReport = brTCBReports.sort((a, b) => a.content.date < b.content.date)
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



        var WBCReport = FindReport(p, { NameCondition: /(WBC|CBC)/ }, x => {
            let match = x.match(/WBC(\s\D\s|\s+)\d+\s*\/(cumm|ul)/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                return {
                    wbc: match[0].replace(/(WBC(\s\D\s|\s+)|\s*\/(cumm|ul))/gi, '').trim(),
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        WBCReport = WBCReport.filter(x => x.caseNo == nbrAdmissionCaseNo);
        var firstWBC = "";
        if (WBCReport.length > 0) {
            var firstWBC = WBCReport.sort((a, b) => a.content.date > b.content.date)[0].content.wbc;
        }

        var CRPReport = FindReport(p, { NameCondition: /CRP/ }, x => {
            let match = x.match(/CRP(\s\D\s|\s+)(>|<)?\s*\d+(.\d+)?\s*mg\/dl/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                return {
                    crp: match[0].replace(/(CRP(\s\D\s|\s+)|mg\/dl)/gi, '').trim(),
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        CRPReport = CRPReport.filter(x => x.caseNo == nbrAdmissionCaseNo);
        var firstCRP = "";
        if (CRPReport.length > 0) {
            var firstCRP = CRPReport.sort((a, b) => a.content.date > b.content.date)[0].content.crp;
        }

        var BloodCultureReport = FindReport(p, { NameCondition: /Blood\sculture/i }, x => {
            let match = x.match(/CFU\s+BOT[\s\S]*?抗生素名稱/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                match = match[0].replace(/(CFU\s+BOT|抗生素名稱)/gi, '').trim();
                var c1 = match.match(/1\s.*?\/ml/i)[0].replace(/(^1)/i, '').replace(/(\/ml$)/i, '').trim();
                var c2 = match.match(/2\s.*?\/ml/i)[0].replace(/(^2)/i, '').replace(/(\/ml$)/i, '').trim();
                var c3 = match.match(/3\s.*?\/ml/i)[0].replace(/(^3)/i, '').replace(/(\/ml$)/i, '').trim();
                var c = [];
                c1 && c.push(c1); c2 && c.push(c2); c3 && c.push(c3);
                return {
                    c: c.join('-'),
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        BloodCultureReport = BloodCultureReport.filter(x => x.caseNo == nbrAdmissionCaseNo);
        var firstBloodCulture = "";
        if (BloodCultureReport.length > 0) {
            var firstBloodCulture = BloodCultureReport.sort((a, b) => a.content.date > b.content.date)[0].content.c;
        }

        var BilMicroNBR = FindReport(p, { NameCondition: /(micro\sbili)/i, caseno: nbrAdmissionCaseNo }, x => {
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
        var Bil_SMACNBR = FindReport(p, { NameCondition: /(bil-t)/i, caseno: nbrAdmissionCaseNo }, x => {
            var match = x.match(/T\.BILI(\s\D\s|\s+)\d+(.\d+)?\smg\/dl/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if(!matchDate){
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

        var UrineCultureReport = FindReport(p, { NameCondition: /ordinary\sculture/i, SpecimenCondition: /urine/i }, x => {
            let match = x.match(/CFU\s+BOT[\s\S]*?抗生素名稱/i);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (match && matchDate) {
                match = match[0].replace(/(CFU\s+BOT|抗生素名稱)/gi, '').trim();
                var c1 = match.match(/1\s.*?\/ml/i)[0].replace(/(^1)/i, '').replace(/(\/ml$)/i, '').trim();
                var c2 = match.match(/2\s.*?\/ml/i)[0].replace(/(^2)/i, '').replace(/(\/ml$)/i, '').trim();
                var c3 = match.match(/3\s.*?\/ml/i)[0].replace(/(^3)/i, '').replace(/(\/ml$)/i, '').trim();
                var c = [];
                c1 && c.push(c1); c2 && c.push(c2); c3 && c.push(c3);
                return {
                    c: c.join('-'),
                    date: util.getDateFromShortDate(matchDate[0].match(/\d{8}/)[0])
                }
            }
            else { return {} };
        });
        UrineCultureReport = UrineCultureReport.filter(x => x.caseNo == nbrAdmissionCaseNo);
        var firstUrineCulture = "";
        if (UrineCultureReport.length > 0) {
            var firstUrineCulture = UrineCultureReport.sort((a, b) => a.content.date > b.content.date)[0].content.c;
        }

        var UA_Report = FindReport(p, { NameCondition: /routine/i, SpecimenCondition: /urine/i }, x => {
            let matchWBC = x.match(/WBC\/PUS.*?\/hpf/i);
            let wbc = "";
            if (matchWBC) {
                wbc = matchWBC[0].replace(/(WBC\/PUS\s+:|\/hpf)/gi, '').trim().replace('-', '~');
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
        UA_Report = UA_Report.filter(x => x.caseNo == nbrAdmissionCaseNo);
        var firstUA_WBC = "";
        if (UA_Report.length > 0) {
            var firstUA_WBC = UA_Report.sort((a, b) => a.content.date > b.content.date)[0].content.wbc;
        }
        var firstUA_comment = "";
        if (UA_Report.length > 0) {
            var firstUA_comment = UA_Report.sort((a, b) => a.content.date > b.content.date)[0].content.comment;
        }

        var HearingReport = FindReport(p, { NameCondition: /(HEARING)/ }, x => {
            let matchPASS = x.match(/\(\s?.{1,3}\s?\)\sPASS/i);
            let matchREFER1 = x.match(/\(\s?.{1,3}\s?\)\sREFER\sTO/gi);
            let matchREFER2 = x.match(/\(\s?.{1,3}\s?\)\sREFER\sRESULT/gi);
            let matchDate = x.match(/簽收時間： \d{8}/i);
            if (matchPASS && matchDate) {
                return {
                    value: matchPASS[0].match(/v/i) ? 'pass' : 'refer',
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
            firstWBC,
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

    resultStrings = ["age,tcb,admission"];
    resultStrings = resultStrings.concat(BR_TCBs.map(x => x.age + "," + x.tcb + "," + x.admission));
    var msExcelBufferTCBs = Buffer.concat([
        new Buffer('\xEF\xBB\xBF', 'binary'),
        new Buffer(resultStrings.join("\r\n"))
    ]);

    fs.writeFileSync(workspaceDir + "\\patient-data-set-nb-tcbs-" + year + ".csv", msExcelBufferTCBs);
});

