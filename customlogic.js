//+++-Start Custom Asuswrt UI log filter cdoe
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
//+++-End Custom Asuswrt UI log filter code
