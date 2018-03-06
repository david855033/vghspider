"use strict";
let jsdom = require('jsdom');
let util = require('./my-util.js');
let $ = require("jquery");
const { JSDOM } = jsdom;
//--------轉換HTML--------
//取得某病房的住院病人
//[{bed:"NICU-1",name:"",patientID:"1234567",gender:"",section:"",admissionDate:"",dischargeDate:""}]

module.exports.getPatientList = function (htmlText) {
    var resultArray = [];
    var doc = util.getDOM(htmlText);
    if (htmlText.indexOf('無資料!') != -1) { return resultArray; };

    var tbody = doc.getElementsByTagName("tbody");
    var thead = doc.getElementsByTagName("thead");
    tbody = tbody && tbody[0];
    if (!tbody) { return; }
    var trs = tbody.getElementsByTagName("tr");
    if (!thead) { return; }

    if (thead[0].textContent.indexOf("功能") == -1) {
        for (var i = 0; i < trs.length; i++) {
            var tr = trs[i];
            var tds = tr.getElementsByTagName("td");
            var result = { bed: "", name: "", patientID: "", gender: "", section: "", admissionDate: "" };
            var td1_id = tds[1].getAttribute('id');
            var td1_idIsTips = td1_id && td1_id.indexOf("tips") >= 0;
            if (td1_idIsTips) {
                util.removeElementsByTagName(tds[1], "span");
                result.bed = tds[1].textContent.replace(' ', '');
                util.removeElementsByTagName(tds[2], "font");
                result.name = tds[2].textContent.trim().replace('@', '');
                result.patientID = tds[3].textContent.trim();
                result.gender = tds[4].textContent;
                result.section = tds[5].textContent.trim();
                result.admissionDate = util.getDateFromShortDate(tds[7].textContent.trim());
                result.dischargeDate = util.getDateFromShortDate(tds[8].textContent.trim());
                resultArray.push(result);
            }
        }
    } else {
        for (var i = 0; i < trs.length; i++) {
            var tr = trs[i];
            var tds = tr.getElementsByTagName("td");
            var result = { bed: "", name: "", patientID: "", gender: "", section: "", admissionDate: "" };
            result.bed = util.removeHtmlBlank(tds[1].textContent).replace(' ', '');;
            if (result.bed.slice(0, 2).indexOf('BR') != -1) { continue; }
            result.patientID = util.removeHtmlBlank(tds[2].textContent);
            result.name = util.removeHtmlBlank(tds[3].textContent);
            result.gender = util.removeHtmlBlank(tds[4].textContent);
            resultArray.push(result);
        }
    }

    return resultArray;
};

//取得某病患的住院清單
//[{admissionDate:"2017-01-01",dischargeDate:"2017-01-02",caseNo:"1234567",section:""}]
module.exports.getAdmissionList = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName("tbody");
    tbody = tbody && tbody[0];
    if (!tbody) { return resultArray; }
    var trs = tbody.getElementsByTagName("tr");
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        var tds = tr.getElementsByTagName("td");
        var result = { admissionDate: "", dischargeDate: "", caseNo: "", section: "" };
        result.admissionDate = util.getDateFromShortDate(tds[2].textContent.trim());
        result.dischargeDate = util.getDateFromShortDate(tds[3].textContent.trim());
        result.caseNo = tds[1].textContent.trim();
        result.section = tds[4].textContent.trim();
        resultArray.push(result);
    }
    return resultArray;
};

module.exports.getPatientData = function (htmlText) {
    var result = {
        currentBed: "",
        patientName: "",
        birthDate: "",
        gender: "",
        bloodType: "",
        currentSection: "",
        visitingStaff: { name: "", code: "" },
        resident: { name: "", code: "" }
    };
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName("tbody");
    tbody = tbody && tbody[0];
    if (!tbody) { return result; }
    var trs = tbody.getElementsByTagName("tr");
    result.currentBed = trs[1].textContent.replace('０２．　病房床號：', '').replace('－', "-").replace(' ', '');
    result.patientName = trs[2].textContent.replace('０３．　姓　名　：', '').trim();
    result.birthDate = util.getDateFromShortDate(trs[3].textContent.replace('０４．　生　日　：', '').replace(/（.*）/g, "").trim());
    result.gender = trs[4].textContent.replace('０５．　性　別　：', '').trim();
    result.bloodType = trs[5].textContent.replace('０６．　血　型　：', '').replace(' ', '').trim();
    result.currentSection = trs[7].textContent.replace('０８．　科　別　：', '').trim();
    result.visitingStaff.name = trs[17].textContent.replace('１８．　主治醫師：', '').replace(/\(.*\)/g, "").trim();
    result.visitingStaff.code = trs[17].textContent.replace('１８．　主治醫師：', '').selectToString(/\((.*)\)/g, "").replace(/(\(|\))/g, "").trim();
    result.resident.name = trs[18].textContent.replace('１９．　住院醫師：', '').replace(/\(.*\)/g, "").trim();
    result.resident.code = trs[18].textContent.replace('１９．　住院醫師：', '').selectToString(/\((.*)\)/g, "").replace(/(\(|\))/g, "").trim();
    return result;
};

//轉科轉床(最近一次住院)
//changeBed:[{dateTime:"",bed:""}],changeSection:[{dateTime:"",section:""}]
module.exports.getChangeBedSection = function (htmlText) {
    var result = {
        changeBed: [],
        changeSection: []
    };
    const dom = new JSDOM(htmlText).window.document;
    var tbodyBed = dom.getElementById('tbody_2');
    if (tbodyBed) {
        var trs = tbodyBed.getElementsByTagName("tr");
        for (var i = 0; i < trs.length; i++) {
            var tr = trs[i];
            var tds = tr.getElementsByTagName("td");
            var changeBed = { dateTime: "", bed: "" };
            changeBed.dateTime = util.getDateFromShortDate(tds[0].textContent.trim()) + " " + util.getTimeFromShortTime(tds[1].textContent.trim());
            changeBed.bed = tds[2].textContent;
            result.changeBed.push(changeBed);
        }
    }

    var tbodySection = dom.getElementById('tbody_3');
    if (tbodySection) {
        var trs = tbodySection.getElementsByTagName("tr");
        for (var i = 0; i < trs.length; i++) {
            var tr = trs[i];
            var tds = tr.getElementsByTagName("td");
            var changeSection = { dateTime: "", bed: "" };
            changeSection.dateTime = util.getDateFromShortDate(tds[0].textContent.trim()) + " " + util.getTimeFromShortTime(tds[1].textContent.trim());
            changeSection.section = tds[2].textContent;
            result.changeSection.push(changeSection);
        }
    }
    return result;
};
//會診紀錄
//[{caseNo:"",oseq:"",bed:"",consultSection:"",consultDateTime:"",completeDateTime:"",status:"",doctors:""}]
module.exports.getConsultation = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName("tbody");
    tbody = tbody && tbody[0];
    if (!tbody) { return result; }
    var trs = tbody.getElementsByTagName("tr");
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        var tds = tr.getElementsByTagName("td");
        if (!tds) { continue; }
        var result = {
            caseNo: "", oseq: "", bed: "", consultSection: "", consultDateTime: "",
            completeDateTime: "", status: "", doctors: ""
        };
        result.caseNo = tds[0] && tds[0].innerHTML.selectToString(/caseno=[0-9]{7,8}/g).replace('caseno=', '');
        result.oseq = tds[0] && tds[0].innerHTML.selectToString(/oseq=[0-9]{4}/g).replace('oseq=', '');
        if (!result.oseq) { continue; }
        result.bed = tds[2] && tds[2].textContent.replace(' ', '');
        result.consultSection = tds[6] && tds[6].textContent.replace(' ', '');
        result.consultDateTime = tds[7] && util.getDateTimeFromShortDateTime(tds[7].textContent);
        result.completeDateTime = tds[8] && util.getDateTimeFromShortDateTime(tds[8].textContent);
        result.status = tds[10] && tds[10].textContent;
        result.doctors = tds[11] && tds[11].textContent.replace(/ /g, '').trim();
        resultArray.push(result);
    }
    return resultArray;
};
//會診回復(直加抓取含有<br>的htmlText)
module.exports.getConsultationReply = function (htmlText) {
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName("tbody");
    tbody = tbody && tbody[0];
    if (!tbody) { return result; }
    var trs = tbody.getElementsByTagName("tr");
    var tds = trs[8].getElementsByTagName("td");
    var result = tds[1] && tds[1].textContent;
    return result;
};
//尚未回覆會診
//[{bed:"",consultSection:"",consultDateTime:"",status:"",doctors:""}]
module.exports.getConsultationPending = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName("tbody");
    tbody = tbody && tbody[0];
    if (!tbody) { return resultArray; }
    var trs = tbody.getElementsByTagName("tr");
    if (!trs) { return resultArray; }
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        var tds = tr.getElementsByTagName("td");
        if (tds.length < 12) { continue; }
        var result = { bed: "", consultSection: "", consultDateTime: "", status: "", doctors: "" }
        result.bed = tds[2].textContent.replace(' ', '');
        result.consultDateTime = util.getDateTimeFromShortDateTime(tds[6].textContent.trim());
        result.status = tds[9].textContent.trim();
        result.consultSection = tds[10].textContent.trim();
        result.doctors = tds[11].textContent.trim();
        resultArray.push(result);
    }
    return resultArray;
};
//手術
//[{date:"",surgeryName:"",doctor:{name:"",code:""}}] (**surgeryName:html String)
module.exports.getSurgery = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbodies = dom.getElementsByTagName('tbody');
    if (!tbodies) { return resultArray; }
    var tbody = tbodies[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if (!tr) { continue; }
        var tds = tr.getElementsByTagName('td');
        if (tds.length < 3) { continue; }
        var result = { date: "", surgeryName: "", doctor: { name: "", code: "" } };
        result.date = tds[0] && tds[0].textContent;
        result.surgeryName = tds[1] && tds[1].textContent;
        result.doctor.name = tds[2] && tds[2].textContent.replace(tds[2].textContent.selectToString(/DOC[0-9]{4}[A-Z]{1}/g), '').trim();
        result.doctor.code = tds[2] && tds[2].textContent.selectToString(/DOC[0-9]{4}[A-Z]{1}/g);
        resultArray.push(result);
    }
    return resultArray;
};
//查詢醫囑
//[{seq:"",dateTime:"",item:"",specimen:"",REQNO:"",unit:"",status:""}]
module.exports.getOrder = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbodies = dom.getElementsByTagName('tbody');
    if (!tbodies) { return resultArray; }
    var tbody = tbodies[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if (!tr) { continue; }
        var tds = tr.getElementsByTagName('td');
        if (tds.length < 8) { continue; }
        var result = { seq: "", dateTime: "", item: "", specimen: "", req: "", unit: "", status: "" };
        result.seq = tds[0] && tds[0].textContent.trim();
        result.item = tds[1] && tds[1].textContent.trim();
        result.specimen = tds[2] && tds[2].textContent.trim();
        result.req = tds[3] && tds[3].textContent.trim();
        result.unit = tds[4] && tds[4].textContent.trim();
        result.dateTime = tds[5] && tds[5].textContent.trim() + " " + tds[6] && tds[6].textContent.trim();
        result.status = tds[7] && tds[7].textContent.trim();
        resultArray.push(result);
    }
    return resultArray;
};
//查詢醫囑
//[{seq:"",dateTime:"",item:"",specimen:"",REQNO:"",unit:"",status:""}]
module.exports.getReport = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbodies = dom.getElementsByTagName('tbody');
    if (!tbodies) { return resultArray; }
    var tbody = tbodies[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if (!tr) { continue; }
        var tds = tr.getElementsByTagName('td');
        if (tds.length < 7) { continue; }
        var result = {
            partNo: "", patientID: "", caseNo: "", orderSeq: "", item: "",
            specimen: "", req: "", signDate: "", reportDate: ""
        };
        var a = tds[0] && tds[0].getElementsByTagName('a');
        if (!a) { continue };
        a = a[0];
        var href = a.getAttribute('href');
        if (!href) { continue };
        result.partNo = href.selectToString(/partno=[0-9]*/g).replace('partno=', '');
        result.patientID = href.selectToString(/histno=[0-9]*/g).replace('histno=', '');
        result.caseNo = href.selectToString(/caseno=[0-9]*/g).replace('caseno=', '');
        result.orderSeq = href.selectToString(/ordseq=[0-9]*/g).replace('ordseq=', '');
        result.item = a.textContent.trim();
        result.specimen = tds[1] && tds[1].textContent.trim();
        result.req = tds[2] && tds[2].textContent.trim();
        result.signDate = tds[3] && tds[3].textContent.trim();
        result.reportDate = tds[4] && tds[4].textContent.trim();
        resultArray.push(result);
    }
    return resultArray;
};
//查詢報告內容
//""
module.exports.getReportContent = function (htmlText) {
    var result = "";
    const dom = new JSDOM(htmlText).window.document;
    var pre = dom.getElementsByTagName('pre');
    if (!pre) { return result; }
    pre = pre[0];
    result = pre.textContent.trim();
    return result;
};
//查詢累積報告
//return {colNames:[], data:[]};
module.exports.getCummulative = function (htmlText) {
    var result = { colNames: [], data: [] };
    const dom = new JSDOM(htmlText).window.document;
    var thead = dom.getElementsByTagName('thead');
    var tbody = dom.getElementsByTagName('tbody');
    if (!thead || !tbody || thead.length == 0 || tbody.length == 0) { return result; }
    thead = thead[0];
    var ths = thead.getElementsByTagName('th');
    for (var i = 0; i < ths.length; i++) {
        if (ths[i].textContent.trim()) {
            result.colNames.push(ths[i].textContent.trim());
        }
    }
    tbody = tbody[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length - 1; i++) {
        var tds = trs[i].getElementsByTagName('td');
        if (tds.length < result.colNames.length) { continue; }
        var newDataRow = [];
        for (var j = 0; j < result.colNames.length; j++) {
            var thisCol = tds[j].textContent.trim();
            if (thisCol == "-") { thisCol = ""; }
            newDataRow.push(thisCol);
        }
        if (result.colNames.indexOf('Glucose') < 0) {
            newDataRow[0] = "20" + newDataRow[0];
        }
        newDataRow[0] = newDataRow[0].replace(/\./g, ":");
        newDataRow[0] = util.getDateFromString(newDataRow[0]).toLocaleString();
        result.data.push(newDataRow);
    }
    return result;
}
//查詢生命徵象
//return {colNames:[], data:[]};
module.exports.getVitalSign = function (htmlText) {
    var result = { colNames: [], data: [] };
    const dom = new JSDOM(htmlText).window.document;
    var thead = dom.getElementsByTagName('thead');
    var tbody = dom.getElementsByTagName('tbody');
    if (!thead || !tbody || thead.length == 0 || tbody.length == 0) { return result; }
    thead = thead[0];
    var ths = thead.getElementsByTagName('th');
    for (var i = 0; i < ths.length; i++) {
        result.colNames.push(ths[i].textContent.trim());
    }
    tbody = tbody[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length; i++) {
        var tds = trs[i].getElementsByTagName('td');
        if (tds.length != result.colNames.length) { continue; }
        var newDataRow = [];
        for (var j = 0; j < tds.length; j++) {
            var thisCol = tds[j].textContent.trim();
            newDataRow.push(thisCol);
        }
        newDataRow[0] = newDataRow[0].replace(/\s+/g, ' ').trim();
        if (!newDataRow[0].match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?/)) {
            if (newDataRow[0].match(/\d{4}-\d{2}-\d{4}:\d{2}(:\d{2})?/)) {
                newDataRow[0] = newDataRow[0].splice(10, 0, ' ');
            }else if(newDataRow[0].match(/\d{12}/))
            {
                newDataRow[0] = newDataRow[0].splice(10, 0, ':').splice(8, 0, ' ').splice(6, 0, '-').splice(4, 0, '-');
            }
        }
        result.data.push(newDataRow);
    }
    return result;
};
//治療處置
//{item:"",info:"",class:"",freq:"",qty:"",duration:"",startDate:"", endDate:"",status:""};
module.exports.getTreatment = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbodies = dom.getElementsByTagName('tbody');
    if (!tbodies) { return resultArray; }
    var tbody = tbodies[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if (!tr) { continue; }
        var tds = tr.getElementsByTagName('td');
        if (tds.length < 8) { continue; }
        var result = {
            item: "", info: "", class: "", freq: "", qty: "",
            duration: "", startDate: "", endDate: "", status: ""
        };
        var span = tds[0].getElementsByTagName('span');
        if (span && span[0]) {
            result.info = span[0].textContent.trim();
        }
       
        result.item = tds[0].textContent.replace(/(\(註記\).*)/g,"").trim();
        result.class = tds[1].textContent.trim();
        result.freq = tds[2].textContent.trim();
        result.qty = tds[3].textContent.trim();
        result.duration = Number(tds[4].textContent);
        result.startDate = tds[5].textContent.trim();
        result.endDate = tds[6].textContent.trim();
        result.status = tds[7].textContent.trim();
        resultArray.push(result);
    }
    return resultArray;
}
//輸血記錄
//[{item:"",req:"",date:""}]
module.exports.getTransfusion = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbodies = dom.getElementsByTagName('tbody');
    if (!tbodies) { return resultArray; }
    var tbody = tbodies[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if (!tr) { continue; }
        var tds = tr.getElementsByTagName('td');
        if (tds.length < 6) { continue; }
        var result = { item: "", req: "", date: "" };
        result.item = tds[1].textContent;
        result.req = tds[3].textContent;
        result.date = tds[4].textContent;
        resultArray.push(result);
    }
    return resultArray;
}
//藥物清單
//  {startDateTime:"",endDateTime:"",drugName:"",tradeName:"",dosage:"",unit:"",route:"",freq:"",status:"",info:""}
module.exports.getMedication = function (htmlText) {
    var resultArray = [];
    const dom = new JSDOM(htmlText).window.document;
    var tbodies = dom.getElementsByTagName('tbody');
    if (!tbodies) { return resultArray; }
    var tbody = tbodies[0];
    var trs = tbody.getElementsByTagName('tr');
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if (!tr) { continue; }
        var tds = tr.getElementsByTagName('td');
        if (tds.length < 12) { continue; }
        var result = { drugName: "", tradeName: "", dosage: "", unit: "", route: "", freq: "", startDateTime: "", endDateTime: "", status: "", selfPaid: "", seq: "", info: "" };
        result.drugName = tds[0].textContent.replace(/(\\r|\\n|\\t|")/g, '').trim();
        result.tradeName = tds[1].textContent.replace(/"/g, '').trim();
        result.dosage = tds[2].textContent.trim();
        result.unit = tds[3].textContent.trim();
        result.route = tds[4].textContent.trim();
        result.freq = tds[5].textContent.trim();
        result.startDateTime = util.getDateTimeInMedicationTable(tds[6].textContent.trim());
        result.endDateTime = util.getDateTimeInMedicationTable(tds[7].textContent.trim());
        result.status = tds[8].textContent.trim();
        result.selfPaid = tds[10].textContent.trim();
        result.seq = tds[11].innerHTML.trim().selectToString(/ordseq=[0-9]*/).replace('ordseq=', '');
        result.info = tds[11].textContent.trim();
        resultArray.push(result);
    }
    return resultArray;
}
//取得藥物註記(字串)
module.exports.getMedicationInfo = function (htmlText) {
    var result = "";
    const dom = new JSDOM(htmlText).window.document;
    var div = dom.getElementsByTagName('div');
    div = div && div[0];
    if (!div) { return result; }
    result = div.textContent.trim().replace('說明:', '').replace(/(\\r|\\n|\\t)/g, '').replace(/\s+/g,' ').trim();
    return result;
}
//住院病摘(回傳string)
module.exports.getAdmissionNote=function(htmlText){
    var result="";
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName('tbody');
    if(!tbody){return result;}
    var trs = tbody[0].getElementsByTagName('tr');
    if(!trs) {return result;}
    var tr = trs[1];
    if (!tr) { return result; }
    result = tr.textContent.replace(/(\r|\t)/g, '').trim();
    return result;
}
//出院病摘(回傳string)
module.exports.getDischargeNote=function(htmlText){
    var result="";
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName('tbody');
    if(!tbody){return result;}
    var trs = tbody[0].getElementsByTagName('tr');
    if(!trs) {return result;}
    var tr = trs[1];
    if (!tr) { return result; }
    result = tr.textContent.replace(/(\r|\t)/g, '').trim();
    return result;
}
//病程紀錄(回傳string)
module.exports.getProgressNote=function(htmlText){
    var result="1";
    const dom = new JSDOM(htmlText).window.document;
    var tbody = dom.getElementsByTagName('tbody');
    if(!tbody){return result;}
    var trs = tbody[0].getElementsByTagName('tr');
    if(!trs) {return result;}
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        if(!tr){continue;}
        result += tr.textContent.replace(/(\r|\t)/g, '').trim()+" ";
    }    
    return result;
}
//取得產單
module.exports.getPreSelectBirthSheet = function (htmlText) {
    var result = { caseno: "", histno: "", token: "" };
    result['struts.token.name'] = "";
    const dom = new JSDOM(htmlText).window.document;
    var inputs = dom.getElementsByTagName('input');
    if (!inputs || inputs.length < 4) { return result; }
    result.caseno = inputs[0].getAttribute('value').replace(/(\\|")/g, "");
    result.histno = inputs[1].getAttribute('value').replace(/(\\|")/g, "");
    result['struts.token.name'] = inputs[2].getAttribute('value').replace(/(\\|")/g, "");
    result.token = inputs[3].getAttribute('value').replace(/(\\|")/g, "");
    return result;
}

module.exports.getBirthSheet = function (htmlText) {
    var isDOMChecked = function (jqObj, selector) {
        var obj = jqObj.find(selector);
        return obj[0] && obj[0].checked;
    }
    var result = {
        hasBirthSheet: false,
        mother: { ID: "", name: "",age:"", admissionReason: "" },
        child: {
            GAweek: "", GAday: "", ROMDateTime: "", deliverDateTime: "", deliverMethod: ""
            , ApgarScore: [], management: []
        }
    };
    htmlText = htmlText.replace(/\s+/g, ' ');
    var $doc = $(new JSDOM(htmlText).window);

    var $motherName = $doc.find('font>span');
    if ($motherName.length==0) { return result; }
    var nameText = $motherName[0].textContent.replace(/(\[|母親姓名:|歲|\]|新生兒姓名:)/g,'').replace(/\s+/g,' ').trim();
    var parts = nameText.split(" ");
    if (parts.length < 3) { return result; }
    result.mother.ID = parts[1];
    result.mother.age = parts[2];
    result.mother.name = parts[0];
    if (!result.mother.ID) { return result; }
    result.hasBirthSheet = true;
    var span_tab2 = $doc.find('#tabs-2 span');
    result.mother.admissionReason = span_tab2[0] && span_tab2[0].textContent.trim();

    var span_tab3 = $doc.find('#tabs-3 span');
    result.child.GAweek = span_tab3[0] && span_tab3[0].textContent.trim();
    result.child.GAday = span_tab3[1] && span_tab3[1].textContent.trim();
    result.child.ROMDateTime = span_tab3[3] && span_tab3[3].textContent.trim();
    result.child.deliverDateTime = span_tab3[4] && span_tab3[4].textContent.trim();
    var ApgarScore = [
        span_tab3[14] && span_tab3[14].textContent.trim(),
        span_tab3[15] && span_tab3[15].textContent.trim(),
        span_tab3[16] && span_tab3[16].textContent.trim(),
        span_tab3[17] && span_tab3[17].textContent.trim(),
        span_tab3[18] && span_tab3[18].textContent.trim()
    ];
    result.child.ApgarScore = ApgarScore.filter(function (x) { return x; })

    if (isDOMChecked($doc, '#fillForm_nisNcInfo_del0')) {
        result.child.deliverMethod = "NSD";
    }
    if (isDOMChecked($doc, '#fillForm_nisNcInfo_del1')) {
        result.child.deliverMethod = "C/S";
    }
    var management = $doc.find('[name="ckListPedEmeTre"]');
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="7"]')) {
        result.child.management.push("Dry and stimulate");
    }
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="3"]')) {
        result.child.management.push("Suction");
    }
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="2"]')) {
        result.child.management.push("Oxygen");
    }
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="0"]')) {
        result.child.management.push("PPV");
    }
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="1"]')) {
        result.child.management.push("Intubation");
    }
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="5"]')) {
        result.child.management.push("Cardiac Massage");
    }
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="6"]')) {
        result.child.management.push("Medication");
    }
    if (isDOMChecked($doc, '[name="ckListPedEmeTre"][value="4"]')) {
        result.child.management.push("Other");
    }

    return result;
}



//護理交班
module.exports.NISHandOverPatientInfo = function (htmlText) {
    var resultArray = [];
    htmlText = htmlText.regreplace(/\\r/g, '').regreplace(/\\n/g, '').regreplace(/\\t/g, '').regreplace(/\\\"/g, '').replaceNbsps().trim();
    var doc = util.getDOM(htmlText);
    // var tbodies = doc.getElementsByTagName('tbody');
    var tds = doc.getElementsByTagName('td');
    if (!(tds && tds.length > 0)) { return resultArray; }
    var datas = [];
    for (var i = 0; i < tds.length; i++) {
        var data = tds[i].textContent.trim();
        datas.push(data);
    }

    datas[30] && resultArray.push({ key: "聯絡人1", value: datas[30] });
    datas[32] && resultArray.push({ key: "聯絡人1電話1", value: datas[32] });
    datas[34] && resultArray.push({ key: "聯絡人1電話2", value: datas[34] });
    datas[36] && resultArray.push({ key: "聯絡人1手機", value: datas[36] });
    datas[38] && resultArray.push({ key: "聯絡人2", value: datas[38] });
    datas[40] && resultArray.push({ key: "聯絡人2電話1", value: datas[40] });
    datas[42] && resultArray.push({ key: "聯絡人2電話2", value: datas[42] });
    datas[44] && resultArray.push({ key: "聯絡人2手機", value: datas[44] });
    datas[46] && resultArray.push({ key: "聯絡人3", value: datas[46] });
    datas[48] && resultArray.push({ key: "聯絡人3電話1", value: datas[48] });
    datas[50] && resultArray.push({ key: "聯絡人3電話2", value: datas[50] });
    datas[52] && resultArray.push({ key: "聯絡人3手機", value: datas[52] });
    datas[54] && resultArray.push({ key: "main照顧者", value: datas[54] });
    datas[56] && resultArray.push({ key: "電話", value: datas[56] });
    return resultArray;
}
module.exports.NISHandOverHistory = function (htmlText) {
    var resultArray = [];
    htmlText = htmlText.regreplace(/\\r/g, '').regreplace(/\\n/g, '').regreplace(/\\t/g, '').regreplace(/\\\"/g, '').replaceNbsps().trim();
    var doc = util.getDOM(htmlText);
    var tds = doc.getElementsByTagName('td');
    if (!(tds && tds.length > 0)) { return resultArray; }
    var datas = [];
    for (var i = 0; i < tds.length; i++) {
        var data = tds[i].textContent.trim();
        datas.push(data);
    }
    //console.log(datas);
    datas[8] && resultArray.push({ key: "重要病史", value: datas[8] });
    datas[14] && resultArray.push({ key: "入院原因", value: datas[14] });
    return resultArray;
}
module.exports.NISHandOverHealth = function (htmlText) {
    var resultArray = [];
    htmlText = htmlText.regreplace(/\\r/g, '').regreplace(/\\n/g, '').regreplace(/\\t/g, '').regreplace(/\\\"/g, '').replaceNbsps().trim();
    var doc = util.getDOM(htmlText);
    var tds = doc.getElementsByTagName('td');
    if (!(tds && tds.length > 0)) { return resultArray; }
    var datas = [];
    for (var i = 0; i < tds.length; i++) {
        var data = tds[i].textContent.trim();
        datas.push(data);
    }
    var i = datas.indexOf("備註");
    (i >= 0) && datas[i + 1] && resultArray.push({ key: "備註", value: datas[i + 1] });
    return resultArray;
}
module.exports.NISHandOverLine = function (htmlText) {
    var resultArray = [];
    htmlText = htmlText.regreplace(/\\r/g, '').regreplace(/\\n/g, '').regreplace(/\\t/g, '').regreplace(/\\\"/g, '').replaceNbsps().trim();
    var doc = util.getDOM(htmlText);
    var tds = doc.getElementsByTagName('td');
    if (!(tds && tds.length > 0)) { return resultArray; }
    var datas = [];
    for (var i = 0; i < tds.length; i++) {
        var data = tds[i].textContent.trim();
        datas.push(data);
    }
    for (var i = 0; i < datas.length; i++) {
        if (datas[i] == "執行內容") {
            var line = {};
            (i - 6 >= 0) && datas[i - 6] && (line.name = datas[i - 6]);
            (i - 5 >= 0) && datas[i - 5] && (line.type = datas[i - 5]);
            (i - 4 >= 0) && datas[i - 4] && (line.part = datas[i - 4]);
            (i - 3 >= 0) && datas[i - 3] && (line.applyTime = datas[i - 3]);
            (i - 2 >= 0) && datas[i - 2] && (line.changeTime = datas[i - 2]);
            (i + 1 >= 0) && datas[i + 1] && (line.info = datas[i + 1]);
            resultArray.push({ key: "管路" + line.name, value: line });
        }
    }
    return resultArray;
}
module.exports.NISHandOverNote = function (htmlText) {
    var resultArray = [];
    htmlText = htmlText.regreplace(/\\r/g, '').regreplace(/\\n/g, '').regreplace(/\\t/g, '').regreplace(/\\\"/g, '').replaceNbsps().trim();
    var doc = util.getDOM(htmlText);
    var tds = doc.getElementsByTagName('td');
    if (!(tds && tds.length > 0)) { return resultArray; }
    var datas = [];
    for (var i = 0; i < tds.length; i++) {
        var data = tds[i].textContent.trim();
        datas.push(data);
    }
    var startIndex = datas.indexOf("內容");
    if (startIndex < 0) { return resultArray; }
    for (var i = startIndex + 1; i < datas.length; i++) {
        var note = {};
        (i >= 0) && datas[i] && (note.date = datas[i]);
        i++;
        (i >= 0) && datas[i] && (note.text = datas[i]);
        if (note.date && note.text) {
            resultArray.push({ key: note.date, value: note.text });
        }
    }
    return resultArray;
}
//flowSheet
module.exports.flowSheet = function (htmlText) {
    var getProperty = function (name) {
        var match = htmlText.match(new RegExp(name + "(\\s|\\S)*?<\\/script>"));
        if (match) {
            match = match[0].replace(/<\/script>/g, "").replace(new RegExp(name + "="), "").replace(/\\/g, "");
            do {
                var fix = match.replace(/\,\,/g, ",\"\",");
                var fixed = (fix != match);
                match = fix;
            } while (fixed);
            match = match.replace(/\,\]/g, ",\"\"]");
            match = match.replace(/\[\,/g, "[\"\",");
            if (match[match.length - 1] == ";") { match = match.slice(0, match.length - 1) }
            return JSON.parse(match);
        }
        return "";
    }

    var result = {};

    var bodyTemperature = getProperty("bodyTemperature");
    bodyTemperature && (result.bodyTemperature = bodyTemperature);

    var heartRate = getProperty("HeartRate");
    heartRate && (result.heartRate = heartRate);

    var respiratoryRate = getProperty("RespRate");
    respiratoryRate && (result.respiratoryRate = respiratoryRate);

    var saturation = getProperty("Saturation");
    saturation && (result.saturation = saturation);

    var sbp = getProperty("SBP");
    sbp && (result.sbp = sbp);

    var dbp = getProperty("DBP");
    dbp && (result.dbp = dbp);

    var event = getProperty("event_Array");
    event && (result.event = event);

    var peripheral = getProperty("peripheral_Array");
    peripheral && (result.peripheral = peripheral);

    var aline = getProperty("aline_Array");
    aline && (result.aline = aline);

    var central = getProperty("central_Array");
    central && (result.central = central);

    var transfusion = getProperty("transfusion_Array");
    transfusion && (result.transfusion = transfusion);

    var drain = getProperty("drain_Array");
    drain && (result.drain = drain);

    var NGDrain = getProperty("NGDrain");
    NGDrain && (result.NGDrain = NGDrain);

    var POAmount = getProperty("POAmount");
    POAmount && (result.POAmount = POAmount);

    var NGAmount = getProperty("NGAmount");
    NGAmount && (result.NGAmount = NGAmount);

    var RVAmount = getProperty("RVAmount");
    RVAmount && (result.RVAmount = RVAmount);

    var urine = getProperty(" urine");
    urine && (result.urine = urine);

    var stool = getProperty("stool");
    stool && (result.stool = stool);

    var enema = getProperty("enema");
    enema && (result.enema = enema);

    return result;
}