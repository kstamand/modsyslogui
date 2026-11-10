//++ Start modsyslogui custom function code
/**
 * @file customfunction.js
 * @project ModSyslogUI (Asuswrt-Merlin Addon)
 * * ARCHITECTURE OVERVIEW:
 * 1. THE STATE: Managed via `window.custom_settings`. 
 * 2. THE TRANSPORT: Uses `msui_form` targeting `hidden_frame` via `start_apply.htm`.
 * 3. THE STORAGE: Presets are stored in a flat-file JSON at `/user/modsyslogui/presets.json`.
 * 4. THE UI: Features a Modal-based CRUD (Create, Read, Update, Delete) system for log filters.
 */

(function() {
    /** * Purpose: Ensure the Merlin global settings object exists.
     * Dependency: customui.xml ASP block.
     */
    if (typeof window.custom_settings === 'undefined') {
        window.custom_settings = {};
    }

    /* --- Configuration & State --- */
    var PRESET_PATH = "/user/modsyslogui/presets.json"; 
    /** * Note: This is a symlink to /jffs/addons/modsyslogui/presets.conf. 
     * The .json extension ensures the router's webserver (httpd) serves it 
     * with the correct MIME type for AJAX fetching. 
     */
     
    /* --- State Management Variables --- */

    // Client-side cache of the JFFS preset file to minimize disk I/O.
    var presetsData = [];

    // Reference for the debounce timer; prevents CPU spikes by 
    // delaying log refreshes until the user stops typing.
    var filterTimeout = null;

    // Flag to ensure "Default Preset" logic only executes once per session,
    // preventing manual filter overrides from being reset by the auto-loader.
    var isInitialLoad = true;

    /**
     * @function debounceFilter
     * @purpose Prevents rapid-fire log refreshing while typing in the filter box.
     * @dependency get_log_data() (Internal firmware function)
     */
    window.debounceFilter = function() {
        if (filterTimeout) clearTimeout(filterTimeout);
        filterTimeout = setTimeout(function() {
            window.isManualFiltering = true; 
            if (typeof get_log_data === 'function') get_log_data();
        }, 250); 
    };

    /**
     * @function exportFilteredLog
     * @purpose v1.4.0 - Saves exactly what is displayed in the log textarea (filtered) to a file.
     * @logic
     * 1. Snapshot #textarea.value (already filtered by customfilter.js).
     * 2. Prepend a short "#" header: version, router, time, active filter, line count.
     * 3. Download via Blob + <a download>; the browser decides the location
     *    (Downloads folder, or a "Save As" prompt if the user enabled that in the browser).
     * @dependency msui_router (customui.xml), custom_settings.ModSyslogUI_ver
     */
    window.exportFilteredLog = function() {
        var ta = document.getElementById("textarea");
        var body = ta ? ta.value : "";
        if (!body.trim()) { alert("Nothing to export - the log view is empty."); return; }
        if (body.charAt(body.length - 1) !== "\n") body += "\n";

        var modeEl = document.querySelector('input[name="filter_options"]:checked');
        var inputEl = document.getElementById("filter_text");
        var validEl = document.getElementById("logical-validation");
        var text = inputEl ? inputEl.value.trim() : "";
        var mode = (modeEl && text !== "") ? modeEl.id : "ShowAll";
        var filterDesc = (mode === "ShowAll") ? "Show All" : mode + ": " + text;
        var caseEl = document.getElementById("match_case");
        if (mode !== "ShowAll" && caseEl && !caseEl.checked) filterDesc += "  (case-insensitive)";
        if (mode === "Logical" && validEl && !validEl.classList.contains("collapsed")) {
            filterDesc += "  (syntax error - log shown unfiltered)";
        }

        var d = new Date();
        var p2 = function(n) { return (n < 10 ? "0" : "") + n; };
        var ymd = d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
        var hms = p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds());
        var stamp = ymd.replace(/-/g, "") + "-" + hms.replace(/:/g, "");

        var r = window.msui_router || {};
        var fw = (r.firmver ? r.firmver.replace(/\./g, "") + "." : "") + (r.buildno || "");
        var ver = (window.custom_settings && window.custom_settings.ModSyslogUI_ver) || "";
        var count = body.split("\n").filter(Boolean).length;

        var header = [
            "# ModSyslogUI " + ver + " filtered log export",
            "# Router:   " + (r.model || "unknown") + (fw ? " (" + fw + ")" : ""),
            "# Exported: " + ymd + " " + hms,
            "# Filter:   " + filterDesc,
            "# Lines:    " + count,
            "#" + new Array(60).join("-"),
            ""
        ].join("\n");

        var blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "syslog_" + mode + "_" + stamp + ".txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
    };

    /**
     * @function applyPresetSelection
     * @purpose Maps a chosen preset from the dropdown to the active UI filters.
     * @param {string} val - The name of the preset to apply.
     */
    window.applyPresetSelection = function(val) {
        if(!val) return;
        var p = presetsData.find(function(x) { return x.name === val; });
        if (!p) return;
        var radio = document.getElementById(p.action);
        if (radio) radio.checked = true;
        document.getElementById("filter_text").value = p.filter_text;
        var mc = document.getElementById("match_case");   // v1.4.0
        if (mc) mc.checked = p.matchCase;
        window.debounceFilter();
    };

    /**
     * @function openPresetModal
     * @purpose Prepares and displays the Modal for adding or editing presets.
     * @param {string} action - 'add' or 'edit'
     */
    window.openPresetModal = function(action) {
        var modal = document.getElementById("preset_modal");
        if (!modal) return;
        window.currentModalAction = action;
        if (action === 'edit') {
            var sel = document.getElementById("preset_select");
            var p = presetsData.find(function(x) { return x.name === sel.value; });
            if (!p) { alert("Select a preset to edit."); return; }
            document.getElementById("m_preset_name").value = p.name;
            document.getElementById("m_preset_name").readOnly = true;
            document.getElementById("m_preset_desc").value = p.desc || "";
            document.getElementById("m_preset_mode").value = p.action;
            document.getElementById("m_preset_text").value = p.filter_text;
            document.getElementById("m_preset_default").checked = p.isDefault;
            document.getElementById("m_preset_matchcase").checked = p.matchCase;   // v1.4.0
        } else {
            document.getElementById("m_preset_name").value = "";
            document.getElementById("m_preset_name").readOnly = false;
            document.getElementById("m_preset_desc").value = "";
            var cur = document.querySelector('input[name="filter_options"]:checked');
            document.getElementById("m_preset_mode").value = cur ? cur.id : "Include";
            document.getElementById("m_preset_text").value = document.getElementById("filter_text").value;
            document.getElementById("m_preset_default").checked = false;
            var mc = document.getElementById("match_case");   // v1.4.0 - start from the current setting
            document.getElementById("m_preset_matchcase").checked = mc ? mc.checked : true;
        }
        modal.classList.remove("collapsed");
    };

    /**
     * @function closePresetModal
     * @purpose UI cleanup; hides the Preset management overlay.
     * @logic Leverages CSS transitions by adding the 'collapsed' class, 
     * which typically handles the opacity/visibility/transform state.
     */
    window.closePresetModal = function() { 
        document.getElementById("preset_modal").classList.add("collapsed"); 
    };

    /**
     * @function confirmPresetSave
     * @purpose Validates Modal input and initiates the Round-trip save.
     * @logic Concatenates fields into a pipe-delimited string for the shell backend.
     */
    window.confirmPresetSave = function() {
        var n = document.getElementById("m_preset_name").value.trim().replace(/\|/g, "");
        var d = document.getElementById("m_preset_desc").value.trim().replace(/\|/g, "");
        var m = document.getElementById("m_preset_mode").value;
        var t = document.getElementById("m_preset_text").value.trim().replace(/\|/g, "");
        
        var isDefault = document.getElementById("m_preset_default").checked;
        var def = isDefault ? "true" : "false";
        
        /**
         * LOGIC: If saving a new default, we change the action prefix to 'setdefault'.
         * This signals the shell script to unset existing stars before saving this one.
         */
        var action = window.currentModalAction;
        if (isDefault) {
            action = "setdefault";
        }

        if(!n) { alert("Name required."); return; }
        if (m === "Logical") {
            // v1.4.0 - same rule as the live filter: ONE uppercase operator with spaces
            var ops = t.match(/ (AND NOT|AND|OR) /g) || [];
            if (ops.length !== 1) {
                alert("Logical mode requires ONE of: AND, OR, or AND NOT (uppercase, with spaces)"); return;
            }
        }

        // v1.4.0 - 6th field: match case (true|false). Older presets without it default to true.
        var mcase = document.getElementById("m_preset_matchcase").checked ? "true" : "false";

        var payload = action + ":" + n + "|" + d + "|" + m + "|" + t + "|" + def + "|" + mcase;
        submitToRouter(payload);
        window.closePresetModal();
    };

    /**
     * @function handlePresetAction
     * @purpose Orchestrates high-level preset commands (e.g., Deletion).
     * @param {string} act - The action key to execute.
     * @logic 
     * 1. Validates selection state from the 'preset_select' dropdown.
     * 2. Implements a UX safety check (confirm dialog) before data loss.
     * 3. Forwards the command to 'submitToRouter' with the 'delete:' protocol prefix.
     */
    window.handlePresetAction = function(act) {
        if (act === 'delete') {
            var n = document.getElementById("preset_select").value;
            if (!n || !confirm("Delete '" + n + "'?")) return;
            submitToRouter("delete:" + n);
        }
    };

    /**
     * @function submitToRouter
     * @purpose The "Transport" engine. Encapsulates payload and submits via hidden frame.
     * @dependency msui_form, amng_custom (hidden input)
     * 1. Using Asuswrt-Merlin addon-api which enables passing information(payload) to add-on shell script on router by:
     * 2. firing a service-event, where an associated command line is listening
     * 3. the listening command checks the paramert ($2) for the name passed (modsyslogui) to then fire an action script
     * 4. action script is /jffs/addons/modsyslogui/preset_manager.sh
     * 5. the information passed is stored in /jffs/addons/custom_settings.txt
     * 6. addons use a "name space" unique to the addon - ModSyslogUI_data for this addon
     */
    function submitToRouter(payload) {
        // 1. Sync payload to global object
        window.custom_settings.ModSyslogUI_data = payload;

        // 2. Inject stringified state into the hidden form field
        var amngField = document.getElementById("amng_custom");
        if (amngField) {
            amngField.value = JSON.stringify(window.custom_settings);
        }

        // 3. Visual feedback using firmware built-ins
        /* if (typeof showLoading === 'function') {
            showLoading(2);
        } */

        // 4. Submit to hidden_frame to avoid UI refresh
        if (document.msui_form) {
            document.msui_form.submit();
        } else {
            console.error("ModSyslogUI: msui_form not found in DOM.");
        }
        
        // 5. Cleanup: Refresh the preset list after the router processes the write
        setTimeout(function() {
            if (typeof hideLoading === 'function') hideLoading();
            loadPresets();
        }, 2500);
    }

    /**
     * @function loadPresets
     * @purpose AJAX fetch of the presets.json file to refresh the UI dropdown.
     * @dependency /user/modsyslogui/presets.json (symlink to /jffs/addons/modsyslogui/presets.conf, containing a line of strings for each prest)
     * Note - we are NOT using JSON formatted data, for purposes of simplifying data parsing/handling
     */
    function loadPresets() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", PRESET_PATH + "?v=" + Date.now(), true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                presetsData = [];
                var lines = xhr.responseText.split('\n');
                var sel = document.getElementById("preset_select");
                if(!sel) return;
                sel.innerHTML = '<option value="">-- Select Preset --</option>';
                var defaultPreset = null;
                lines.forEach(function(line) {
                    var bits = line.trim().split('|');
                    if (bits.length < 5) return;
                    var p = { 
                        name: bits[0], 
                        desc: bits[1], 
                        action: bits[2], 
                        filter_text: bits[3], 
                        isDefault: bits[4] === "true",
                        matchCase: bits.length > 5 ? bits[5] !== "false" : true   // v1.4.0 - optional 6th field
                    };
                    presetsData.push(p);
                    var opt = document.createElement("option");
                    opt.value = p.name;
                    opt.textContent = (p.isDefault ? "★ " : "") + p.name;
                    sel.appendChild(opt);
                    if (p.isDefault) defaultPreset = p;
                });

                // Auto-apply the "Star" preset on first load
                if (defaultPreset && isInitialLoad) {
                    isInitialLoad = false;
                    sel.value = defaultPreset.name;
                    setTimeout(function() { window.applyPresetSelection(defaultPreset.name); }, 800);
                }
            }
        };
        xhr.send();
    }
    
    // Initial bootstrap
    setTimeout(loadPresets, 1200);
})();
 //++ End modsyslogui custom function code
