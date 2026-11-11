#!/bin/sh
#{
#set -x
# Preset line format (presets.conf):  name|description|mode|filter text|isDefault|matchCase
#   v1.4.0 - added optional 6th field matchCase (true|false); lines without it are treated as true by the UI.
PRESET_CONF="$(cd "$(dirname "$0")" && pwd)/presets.conf"   # v1.4.0 - follow addon directory (prod or test)
SETTINGS_FILE="/jffs/addons/custom_settings.txt"
LOG_TAG="ModSyslogUI"

/usr/bin/logger -t "$LOG_TAG" "Manager triggered. Extraction phase..."

# --- RETRY LOOP ---
MAX_RETRIES=5
COUNT=0
RAW_DATA=""

while [ "$COUNT" -lt "$MAX_RETRIES" ] && [ -z "$RAW_DATA" ]; do
    # Scrape the specific line written by the API
    RAW_DATA=$(grep "ModSyslogUI_data" "$SETTINGS_FILE" | sed 's/ModSyslogUI_data //')

    if [ -z "$RAW_DATA" ]; then
        sleep 1
        COUNT=$((COUNT + 1))
    fi
done

if [ -z "$RAW_DATA" ]; then
    /usr/bin/logger -t "$LOG_TAG" "Error: ModSyslogUI_data not found in settings file."
    exit 1
fi

touch "$PRESET_CONF"

# Clean quotes and parse
RAW_DATA=$(printf '%s\n' "$RAW_DATA" | sed 's/^"//;s/"$//')
ACTION=$(printf '%s\n' "$RAW_DATA" | cut -d: -f1)
PAYLOAD=$(printf '%s\n' "$RAW_DATA" | cut -d: -f2-)

/usr/bin/logger -t "$LOG_TAG" "Action: $ACTION"

##----------------------------------------------------------------------##
## v1.4.0 - exact name matching with awk (names containing / . * etc.   ##
## previously broke or over-matched the sed patterns)                   ##
##----------------------------------------------------------------------##
remove_preset() {
    # $1 = preset name; rewrite presets.conf without lines whose 1st field equals it
    awk -F'|' -v n="$1" '$1 != n' "$PRESET_CONF" > "${PRESET_CONF}.tmp" && mv -f "${PRESET_CONF}.tmp" "$PRESET_CONF"
}

add_preset() {
    # $1 = full preset line
    printf '%s\n' "$1" >> "$PRESET_CONF"
    sort -u -o "$PRESET_CONF" "$PRESET_CONF"
}

case "$ACTION" in
    "setdefault")
        # Global Unset: set the isDefault (5th) field to false on every preset
        awk -F'|' 'BEGIN { OFS = "|" } NF >= 5 { $5 = "false" } { print }' "$PRESET_CONF" > "${PRESET_CONF}.tmp" && mv -f "${PRESET_CONF}.tmp" "$PRESET_CONF"

        NAME=$(printf '%s\n' "$PAYLOAD" | cut -d'|' -f1)
        remove_preset "$NAME"
        add_preset "$PAYLOAD"
        /usr/bin/logger -t "$LOG_TAG" "Set $NAME as new global default."
        ;;
    "save"|"edit")
        NAME=$(printf '%s\n' "$PAYLOAD" | cut -d'|' -f1)
        remove_preset "$NAME"
        add_preset "$PAYLOAD"
        /usr/bin/logger -t "$LOG_TAG" "Updated $NAME in presets."
        ;;
    "delete")
        remove_preset "$PAYLOAD"
        /usr/bin/logger -t "$LOG_TAG" "Deleted $PAYLOAD from presets."
        ;;
esac

# Cleanup ONLY our specific line
sed -i '/^ModSyslogUI_data/d' "$SETTINGS_FILE"
/usr/bin/logger -t "$LOG_TAG" "Process complete."
#} >"/jffs/addons/modsyslogui/debug.log" 2>&1
