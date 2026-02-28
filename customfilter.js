//++ Start modsyslogui custom filter code
/**
 * @file customfilter.js
 * @project ModSyslogUI
 * @description The Log Processing Engine. 
 * Intercepts the router's syslog response and applies multi-layered filtering
 * (Merlin Tag Filter -> User Manual Filter -> Logical Boolean Parser).
 */

/* --- State Management Variables --- */

/**
 * @variable logString
 * @purpose Extracts raw log text from the router's RPC envelope.
 * @logic 
 * 1. .slice(26, -4): Strips 'memory_log = "' prefix and '";' suffix from AJAX response.
 * 2. htmlEncode: Sanitizes < and > to prevent UI breakage or HTML injection.
 */
var logString = htmlEnDeCode.htmlEncode(response.toString().slice(26,-4));

// Accumulator for lines passing the filter; injected into the textarea at the end.
var _log = '';

// The logString split into an array for line-by-line processing.
var _string = logString.split('\n');

/**
 * REFRESH CONTROL:
 * @logic Pauses refresh if Auto-Refresh is off OR user is currently typing (isManualFiltering).
 */
if(!document.getElementById("auto_refresh").checked && !window.isManualFiltering) {
    setTimeout(get_log_data, 3000);
    return;
}

/**
 * @function IIFE (Immediately Invoked Function Expression)
 * @purpose Creates a private "Sandbox" for the filtering logic.
 * @logic Encapsulates local variables to prevent memory leaks or global scope pollution.
 */
(function() {
    /* --- Local UI Configuration --- */
    var modeEl = document.querySelector('input[name="filter_options"]:checked');
    var inputEl = document.getElementById("filter_text");
    var validEl = document.getElementById("logical-validation");
    
    var mode = modeEl ? modeEl.id : "ShowAll";
    var filterText = inputEl ? inputEl.value.trim() : ""; 

    /**
     * UI State Reset:
     * Clears previous Logical Mode syntax warnings. Ensures the error box 
     * disappears immediately once the user corrects their input.
     */
    if (validEl) {
        validEl.classList.add("collapsed");
        validEl.innerHTML = "";
    }

    var term1 = [], term2 = [], op = "";

    /**
     * LOGICAL MODE PARSER & ANTI-SILENT-FAIL VALIDATION:
     * @purpose Processes AND, OR, AND NOT queries with strict whitelisting.
     * @logic 
     * 1. VALIDATION: Checks for lowercase operators or missing spaces (e.g., 'and', 'ANDNOT').
     * 2. SPACE-WHORING: We strictly require " AND ", " OR ", or " AND NOT " (spaces included).
     * 3. ANTI-SILENT-FAIL: If logic-like words are found but don't match our strict whitelist, 
     * we trigger a syntax error instead of showing an empty log.
     */
    if (filterText !== "" && mode === "Logical") {
        var upText = filterText.toUpperCase();
        
        // Check for common lowercase errors
        var hasLowerOp = (filterText.includes(" and ") || filterText.includes(" or ") || filterText.includes(" not "));
        
        // Identify valid whitelisted operators (must have spaces)
        var hasValidOp = (upText.indexOf(" AND ") !== -1 || upText.indexOf(" OR ") !== -1 || upText.indexOf(" AND NOT ") !== -1);
        
        // Catch typos (e.g., 'AAND', 'ORR', 'NOTT') or missing spaces
        var logicTypo = (upText.indexOf("NOTT") !== -1 || upText.indexOf("ANDNOT") !== -1);
        var logicIntentWithoutSpaces = (upText.includes("AND") || upText.includes("OR") || upText.includes("NOT"));

        if (hasLowerOp || logicTypo || (logicIntentWithoutSpaces && !hasValidOp)) {
            if (validEl) {
                validEl.classList.remove("collapsed");
                validEl.innerHTML = "Syntax: Use UPPERCASE ' AND ', ' OR ', or ' AND NOT ' with spaces.";
            }
            _log = _string.join('\n'); // Fallback: Show all logs during error state
            return;
        }

        // --- PARTITIONING PHASE ---
        var rawT1 = "", rawT2 = "";
        if (filterText.indexOf(" AND NOT ") !== -1) { 
            op = "AND NOT"; 
            var parts = filterText.split(" AND NOT "); 
            rawT1 = parts[0]; rawT2 = parts[1]; 
        }
        else if (filterText.indexOf(" AND ") !== -1) { 
            op = "AND"; 
            var parts = filterText.split(" AND "); 
            rawT1 = parts[0]; rawT2 = parts[1]; 
        }
        else if (filterText.indexOf(" OR ") !== -1) { 
            op = "OR"; 
            var parts = filterText.split(" OR "); 
            rawT1 = parts[0]; rawT2 = parts[1]; 
        }
        else { 
            rawT1 = filterText; 
        }

        term1 = rawT1.trim().split(/\s+/).filter(Boolean);
        term2 = rawT2.trim().split(/\s+/).filter(Boolean);
    } else {
        // Standard Comma-Separated Mode
        var terms = filterText.split(',').map(function(t){ return t.trim(); }).filter(Boolean);
    }

    /* --- Primary Processing Loop --- */
    for (var i = 0; i < _string.length; i++) {
        var line = _string[i];
        if (!line) continue;
        
        // LAYER 1: Merlin Global Tag Filter
        var skipByTag = false;
        if (typeof filter !== 'undefined' && filter.length > 0) {
            for (var j = 0; j < filter.length; j++) {
                if (line.indexOf(filter[j]) !== -1) { skipByTag = true; break; }
            }
        }
        if (skipByTag) continue;

        // LAYER 2: ModSyslogUI Manual/Logical Filter
        var display = true;
        if (filterText !== "" && mode !== "ShowAll") {
            if (mode === "Include") {
                display = terms.some(function(t) { return line.indexOf(t) !== -1; });
            } else if (mode === "Exclude") {
                display = !terms.some(function(t) { return line.indexOf(t) !== -1; });
            } else if (mode === "Logical") {
                /**
                 * @function matchWords
                 * @logic Checks if a line contains EVERY word in a term set (Array.every).
                 */
                var matchWords = function(l, words) {
                    return words.every(function(w) { return l.indexOf(w) !== -1; });
                };

                if (op === "") {
                    display = matchWords(line, term1);
                } else if (term2.length > 0) {
                    var has1 = matchWords(line, term1);
                    var has2 = matchWords(line, term2);
                    if (op === "AND NOT") display = (has1 && !has2);
                    else if (op === "AND") display = (has1 && has2);
                    else if (op === "OR") display = (has1 || has2);
                } else {
                    display = matchWords(line, term1);
                }
            }
        }
        
        if (display) _log += line + '\n';
    }
})();

// DOM Update and Auto-Scroll
document.getElementById("textarea").value = _log;
document.getElementById("textarea").scrollTop = 9999999;

window.isManualFiltering = false; 
setTimeout(get_log_data, 3000);
//++ End modsyslogui custom filter code
