//++ Start Custom Asuswrt UI log filter cdoe
if (document.getElementById("ShowAll").checked == true) {
    for(var i=0;i<_string.length;i++){
        var found = filter.find(function(e){
            return (_string[i].indexOf(e) != -1)
        });
        if(!found){
            _log += _string[i] + '\n';
        }
    }
}
else if (document.getElementById("Exclude").checked == true) {
    if (document.getElementById("filter_text").value == "") {
        alert ("Text filter data required. Please fill in and try again!!");
        document.getElementById("ShowAll").checked = "Checked";
    }
    else {
        var xfilter = document.getElementById("filter_text").value;
        var ary_filter = [];
        ary_filter = xfilter.split(",");
        for(var i=0;i<_string.length;i++){
            found = ary_filter.find(function(e){
                return (_string[i].indexOf(e) != -1)
            });
            if(!found){
                _log += _string[i] + '\n';
            }
        }
    }
}
else if (document.getElementById("Include").checked == true) {
    if (document.getElementById("filter_text").value == "") {
        alert ("Text filter data required. Please fill in and try again!!");
        document.getElementById("ShowAll").checked = "Checked";
    }
    else {
        var ifilter = document.getElementById("filter_text").value;
        var ary_filter = [];
        ary_filter = ifilter.split(",");
        for(var i=0;i<_string.length;i++){
            found = ary_filter.find(function(e){
                return (_string[i].indexOf(e) != -1)
            });
            if(found){
                _log += _string[i] + '\n';
            }
        }
    }
}
else if (document.getElementById("Boolean").checked == true) {
    // define regex to ensure only two search strings providedd and only an AND or OR or AND NOT in the input field
    var filter_regex = /^(?!.*\b(?:AND|OR|AND OR|AND NOT)\b.*\b(?:AND|OR|AND OR|AND NOT)\b)[\W\w]+\b(?:AND|OR|AND OR|AND NOT)\b[\W\w]+$/;
    var filter_input = document.getElementById("filter_text").value;
    const trimmed_input = filter_input.trim();
    const words = trimmed_input.split(/\s+/);
    const num_words = words.length
    // Make sure something was entered in input field
    if ( !filter_regex.test(filter_input)) {
        alert (filter_input + " Contains logical operators not supported by this script. Input must contain 3 - 4 words and middle words must be either AND or OR or AND NOT!!");
        document.getElementById("ShowAll").checked = "Checked";
    }
    // filter logs based on string1 OPERATOR string2 provided on input
    else if (num_words === 3) {
        var [string1, operator, string2] = filter_input.split(" ");
        if (operator === "AND") {
            for(var i=0;i<_string.length;i++){
                if (_string[i].includes(string1) && _string[i].includes(string2)) {
                    _log += _string[i] + `\n`;
                }
            } 
        }
        else if (operator === "OR") {
            for(var i=0;i<_string.length;i++){
                if (_string[i].includes(string1) || _string[i].includes(string2)) {
                    _log += _string[i] + `\n`;
                }
            } 
        }
        if (_log == '') {
            alert (" No records found with that search criteria >> " + filter_input);
            document.getElementById("ShowAll").checked = "Checked";
        }
    }
    // filter logs based on string1 OPERATOR1 OPERATOR2 string2, making sure the 2 operators are not the same
    else if (words.length === 4) {
        var [string1, operator1, operator2, string2] = filter_input.split(" ");
        if (operator1 === operator2) {
            alert ("The logical operators you entered cannot be the same: Operator 1 = " + operator1 + " Operator2 = " + operator2 + " Please correct and retry");
            document.getElementById("ShowAll").checked = "Checked";
        }
        else if (operator1 === "AND" && operator2 === "OR") {
            alert ("The logical operators AND + OR is not a valid combination. Please correct and retry");
            document.getElementById("ShowAll").checked = "Checked";
        }
        // if we got to here, the only valid combination of logical operators left is AND NOT, so let's find strings that includes those criteria
        else {
            for(var i=0;i<_string.length;i++){
                if (_string[i].includes(string1) && !_string[i].includes(string2)) {
                    _log += _string[i] + `\n`;
                }
            } 
        }
    }
}
//++ End Custom Asuswrt UI log filter code
