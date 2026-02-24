#!/bin/sh
#{
#set -x
PRESET_CONF="/jffs/addons/modsyslogui/presets.conf"
SETTINGS_FILE="/jffs/addons/custom_settings.txt"

/usr/bin/logger -t ModSyslogUI "Manager triggered. Extraction phase..."

# --- RETRY LOOP ---
MAX_RETRIES=5
COUNT=0
RAW_DATA=""

while [ $COUNT -lt $MAX_RETRIES ] && [ -z "$RAW_DATA" ]; do
    # Scrape the specific line written by the API
    RAW_DATA=$(grep "ModSyslogUI_data" "$SETTINGS_FILE" | sed 's/ModSyslogUI_data //')
    
    if [ -z "$RAW_DATA" ]; then
        sleep 1
        COUNT=$((COUNT + 1))
    fi
done

if [ -z "$RAW_DATA" ]; then
    /usr/bin/logger -t ModSyslogUI "Error: ModSyslogUI_data not found in settings file."
    exit 1
fi

# Clean quotes and parse
RAW_DATA=$(echo "$RAW_DATA" | sed 's/^"//;s/"$//')
ACTION=$(echo "$RAW_DATA" | cut -d: -f1)
PAYLOAD=$(echo "$RAW_DATA" | cut -d: -f2-)

/usr/bin/logger -t ModSyslogUI "Action: $ACTION"

case "$ACTION" in
    "setdefault")
        # Global Unset: Change any existing '|true' to '|false'
        sed -i 's/|true$/|false/' "$PRESET_CONF"
        
        NAME=$(echo "$PAYLOAD" | cut -d'|' -f1)
        sed -i "/^$NAME|/d" "$PRESET_CONF"
        echo "$PAYLOAD" >> "$PRESET_CONF"
        sort -u -o "$PRESET_CONF" "$PRESET_CONF"
        /usr/bin/logger -t ModSyslogUI "Set $NAME as new global default."
        ;;
    "save"|"edit")
        NAME=$(echo "$PAYLOAD" | cut -d'|' -f1)
        sed -i "/^$NAME|/d" "$PRESET_CONF"
        echo "$PAYLOAD" >> "$PRESET_CONF"
        sort -u -o "$PRESET_CONF" "$PRESET_CONF"
        /usr/bin/logger -t ModSyslogUI "Updated $NAME in presets."
        ;;
    "delete")
        sed -i "/^$PAYLOAD|/d" "$PRESET_CONF"
        /usr/bin/logger -t ModSyslogUI "Deleted $PAYLOAD from presets."
        ;;
esac

# Cleanup ONLY our specific line
sed -i '/^ModSyslogUI_data/d' "$SETTINGS_FILE"
/usr/bin/logger -t ModSyslogUI "Process complete."
#} >"/jffs/addons/modsyslogui/debug.log" 2>&1
