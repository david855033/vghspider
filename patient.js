let fs = require('fs');
let gs = require('./global-setting.js');
let util = require('./my-util.js');

module.exports = {
    createPatient: function (hisIDList) {
        return hisIDList.reduce((promise, current) => {
            return promise.then(() => {
                console.log('generate patient from raw data: ' + current);
                var patientRawDataPath = gs.rawDataDir + "\\" + current;
                var patientDataPath = gs.patientDataDir + "\\" + current +"_"+new Date().yyyymmddhhmmss()+ '.json';
                var newPatient = {};
                var files = fs.readdirSync(patientRawDataPath).filter(x => x.match(/\.json$/));

                files.forEach(file => {
                    var jsonFilePath = patientRawDataPath + "\\" + file;
                    var content = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
                    var dataStructure = file.replace("_" + current, '').replace('.json', '');
                    var splitted = dataStructure.split('_');
                    var dataType = splitted[0];
                    if (dataType == "admissionNote" || dataType == "dischargeNote" || dataType == "erNote" || dataType == "progressNote") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        newPatient[dataType].push({
                            caseno: splitted[1],
                            admissionDate: splitted[2],
                            content: content.value,
                            lastUpdate: content.lastUpdate
                        })
                    } else if (dataType == "birthSheet") {
                        newPatient[dataType] || (newPatient[dataType] = {});
                        newPatient[dataType] = content;
                    } else if (dataType == "consultationReply") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        newPatient[dataType].push({
                            caseno: splitted[1],
                            seq: splitted[2],
                            content: content.value,
                            lastUpdate: content.lastUpdate
                        })
                    } else if (dataType == "cummulative") {
                        newPatient[dataType] || (newPatient[dataType] = {});
                        newPatient[dataType][splitted[2]] || (newPatient[dataType][splitted[2]] = []);
                        newPatient[dataType][splitted[2]].push({
                            year: splitted[1],
                            data: content.data,
                            colNames: content.colNames,
                            lastUpdate: content.lastUpdate
                        })
                    } else if (dataType == "flowSheet") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        var container = newPatient[dataType].filter(x => x.caseno == splitted[1]);
                        if (container.length > 0) {
                            container = container[0]
                        } else {
                            container = { caseno: splitted[1], dates: [] }
                            newPatient[dataType].push(container);
                        }
                        var lastUpdate = content.lastUpdate;
                        delete content['lastUpdate'];
                        container.dates.push(
                            {
                                dates: util.getDateFromShortDate(splitted[2]),
                                lastUpdate: lastUpdate,
                                content: content
                            }
                        )
                    } else if (dataType == "medication") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        content.caseno = splitted[1];
                        newPatient[dataType].push(content);
                    } else if (dataType == "medicationInfo") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        var container = newPatient[dataType].filter(x => x.caseno == splitted[1]);
                        if (container.length > 0) {
                            container = container[0]
                        } else {
                            container = { caseno: splitted[1], array: [] };
                            newPatient[dataType].push(container);
                        }
                        container.array.push(content);
                    } else if (dataType == "order") {
                        newPatient[dataType] = content;
                    } else if (dataType == "report") {
                        newPatient[dataType] = content;
                    } else if (dataType == "reportContent") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        var container = newPatient[dataType].filter(x => x.caseno == splitted[2]);
                        if (container.length > 0) {
                            container = container[0]
                        } else {
                            container = { caseno: splitted[2], array: [] };
                            newPatient[dataType].push(container);
                        }
                        container.array.push(content);
                    } else if (dataType == "transfusion"||dataType == "treatment") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        newPatient[dataType].push(content);
                    } else if (dataType == "vitalSign") {
                        newPatient[dataType] || (newPatient[dataType] = []);
                        content.type=splitted[2];
                        newPatient[dataType].push(content);
                    } else {
                        newPatient[dataStructure] = content;
                    }
                });
                fs.writeFileSync(patientDataPath, JSON.stringify(newPatient));
            })
        }, Promise.resolve());
    }
}