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
var logString = response.toString().slice(26,-4);

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

    // v1.4.0 - Match case (default on = case-sensitive, as before). When off, log lines
    // and search terms are compared in lowercase. Operators stay UPPERCASE-only.
    var caseEl = document.getElementById("match_case");
    var matchCase = caseEl ? caseEl.checked : true;
    var norm = matchCase ? function(s) { return s; } : function(s) { return s.toLowerCase(); };

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
        /**
         * v1.4.0 - operators are checked on the text exactly as typed (UPPERCASE only),
         * using whole words, so terms like ERROR / FORWARD / NOTICE are not mistaken for operators.
         */
        // Valid operators (must be uppercase with spaces); only one per filter is supported
        var opMatches = filterText.match(/ (AND NOT|AND|OR) /g) || [];
        var hasValidOp = opMatches.length > 0;

        // Lowercase operator words are only an error when no valid operator is present
        // (the user most likely meant an operator), otherwise they are plain search words
        var hasLowerOp = !hasValidOp && / (and|or|not) /.test(" " + filterText + " ");

        // Catch typos (e.g., 'ANDNOT', 'NOTT')
        var logicTypo = /ANDNOT|NOTT/.test(filterText);

        // Operator word with a missing term or missing spaces (e.g., 'eth0 NOT', 'kernel AND')
        var logicIntentWithoutSpaces = /\b(AND|OR|NOT)\b/.test(filterText);

        var syntaxMsg = "";
        if (opMatches.length > 1) {
            syntaxMsg = "Syntax: Only ONE operator per filter is supported (' AND ', ' OR ', or ' AND NOT ').";
        } else if (hasLowerOp || logicTypo || (logicIntentWithoutSpaces && !hasValidOp)) {
            syntaxMsg = "Syntax: Use UPPERCASE ' AND ', ' OR ', or ' AND NOT ' with spaces.";
        }

        if (syntaxMsg !== "") {
            if (validEl) {
                validEl.classList.remove("collapsed");
                validEl.innerHTML = syntaxMsg;
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

        term1 = rawT1.trim().split(/\s+/).filter(Boolean).map(norm);
        term2 = rawT2.trim().split(/\s+/).filter(Boolean).map(norm);
    } else {
        // Standard Comma-Separated Mode
        var terms = filterText.split(',').map(function(t){ return norm(t.trim()); }).filter(Boolean);
    }

    /**
     * v1.4.0 - TAG MATCHING (Scribe-style views)
     * A word ending in ':' (e.g. kernel:, dnsmasq-dhcp:, eth7:) is a TAG. It matches the
     * program tag right after the timestamp ([pid] ignored), or the sub-tag right after that:
     *   "Nov 10 19:30:05 kernel: eth7: link down"    -> tags kernel:  eth7:
     *   "Nov 10 19:35:07 dropbear[28824]: Child ..."  -> tag  dropbear:
     * Where it applies:
     *   - Logical: the FIRST word of each side of the operator (kernel: Tuxera AND HFS+)
     *   - Include/Exclude: a term that is only a tag (kernel:, dnsmasq:)
     * Lines not in the standard format fall back to "tag appears anywhere in the line".
     * Every other word must simply appear somewhere in the line (spaces = ALL of these words).
     */
    var TAG_RE = /^\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+([^\s\[:]+)(?:\[\d+\])?:(?:\s+([^\s:]+):(?=\s|$))?/;
    var isTag = function(w) { return w.length > 1 && /^[^\s:]+:$/.test(w); };
    var makeSet = function(words) {
        var set = { tag: null, words: words.slice() };
        if (set.words.length && isTag(set.words[0])) set.tag = set.words.shift();
        return set;
    };
    var isEmptySet = function(set) { return set.tag === null && set.words.length === 0; };
    var lineTags = function(l) {
        var m = TAG_RE.exec(l);
        return m ? [norm(m[1] + ":"), m[2] ? norm(m[2] + ":") : ""] : null;
    };
    var matchSet = function(cmp, tags, set) {
        if (set.tag !== null) {
            var tagOk = tags ? (tags[0] === set.tag || tags[1] === set.tag) : cmp.indexOf(set.tag) !== -1;
            if (!tagOk) return false;
        }
        return set.words.every(function(w) { return cmp.indexOf(w) !== -1; });
    };

    var set1 = makeSet(term1), set2 = makeSet(term2);
    var termSets = (terms || []).map(function(t) {
        return isTag(t) ? { tag: t, words: [] } : { tag: null, words: [t] };
    });
    var needTags = set1.tag !== null || set2.tag !== null || termSets.some(function(s) { return s.tag !== null; });

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
        // v1.4.0 - cmp is the line as compared (lowercased when Match case is off)
        var display = true;
        if (filterText !== "" && mode !== "ShowAll") {
            var cmp = norm(line);
            var tags = needTags ? lineTags(line) : null;   // v1.4.0 - program / sub-tag of this line
            if (mode === "Include") {
                display = termSets.some(function(s) { return matchSet(cmp, tags, s); });
            } else if (mode === "Exclude") {
                display = !termSets.some(function(s) { return matchSet(cmp, tags, s); });
            } else if (mode === "Logical") {
                if (op === "" || isEmptySet(set2)) {
                    display = matchSet(cmp, tags, set1);
                } else {
                    var has1 = matchSet(cmp, tags, set1);
                    var has2 = matchSet(cmp, tags, set2);
                    if (op === "AND NOT") display = (has1 && !has2);
                    else if (op === "AND") display = (has1 && has2);
                    else if (op === "OR") display = (has1 || has2);
                }
            }
        }
        
        if (display) _log += line + '\n';
    }
})();

/**
 * DOM Update and Auto-Scroll
 * v1.4.0 - only rewrite the textarea when the content changed, and only jump to the
 * bottom if the user was already at the bottom (or just changed the filter), so
 * scrolling up to read older lines is no longer interrupted every 3 seconds.
 */
(function() {
    var ta = document.getElementById("textarea");
    if (!ta || ta.value === _log) return;
    var atBottom = (ta.scrollHeight - ta.scrollTop - ta.clientHeight) < 20;
    var keepTop = ta.scrollTop;
    ta.value = _log;
    ta.scrollTop = (atBottom || window.isManualFiltering) ? ta.scrollHeight : keepTop;
})();

window.isManualFiltering = false; 
setTimeout(get_log_data, 3000);
//++ End modsyslogui custom filter code
