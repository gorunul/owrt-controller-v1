#!/bin/sh

# --- CONFIGURARE ---
# IP address of the main ap
PRINCIPAL_AP_IP="10.109.1.10"
# Specity wifi interfaces to monitor, separated by space
INTERFACES_TO_CHECK="2g-work 5g-work 2g-guests"
# --------------------

MY_AP_NAME=$(uci -q get system.@system[0].hostname)
POST_URL="http://${PRINCIPAL_AP_IP}/cgi-bin/get_clients"

ALL_CLIENTS_JSON=""

for iface in $INTERFACES_TO_CHECK; do
    if [ ! -d "/sys/class/net/$iface" ]; then continue; fi

    BAND="N/A"
    FREQ_MHZ=$(iw dev "$iface" info | sed -n 's/.*(\([0-9]\{4\}\) MHz).*/\1/p' | head -n 1)
    if [ -n "$FREQ_MHZ" ]; then
        if [ "$FREQ_MHZ" -gt 3000 ]; then BAND="5G"; else BAND="2.4G"; fi
    fi

    SSID_NAME="($iface)"
    SECTION_ID=$(uci show wireless | grep "\.ifname='$iface'" | sed 's/\.ifname=.*//')
    if [ -n "$SECTION_ID" ]; then
        SSID_NAME=$(uci -q get "${SECTION_ID}.ssid" || echo "($iface)")
    fi

    CLIENTS_ON_THIS_IFACE=$(iw dev "$iface" station dump | awk -v ap_name="$MY_AP_NAME" -v iface_name="$iface" -v band="$BAND" -v ssid="$SSID_NAME" '
        BEGIN { RS = "\nStation"; FS = "\n"; comma = ""; }
        {
            if (NR == 1 && $0 !~ /signal:/) { next }
            mac = sig = rx = tx = "";
            conn_time = rx_bytes = tx_bytes = 0;
            mac = $1;
            sub(/^Station /, "", mac); sub(/^[ \t]+/, "", mac); sub(/ \(on.*\)/, "", mac);
            for (i=2; i<=NF; i++) {
                if ($i ~ /signal:/) { sig = $i; sub(/^.*signal:[\t ]*/, "", sig); sub(/ .*/, "", sig); sig = sig " dBm"; }
                if ($i ~ /rx bitrate:/) { rx = $i; sub(/^.*rx bitrate:[\t ]*/, "", rx); sub(/ .*/, "", rx); sub(/\..*/, "", rx); rx = rx "Mbps"; }
                if ($i ~ /tx bitrate:/) { tx = $i; sub(/^.*tx bitrate:[\t ]*/, "", tx); sub(/ .*/, "", tx); sub(/\..*/, "", tx); tx = tx "Mbps"; }
                if ($i ~ /connected time:/) { conn_time = $i; sub(/^.*connected time:[\t ]*/, "", conn_time); sub(/ .*/, "", conn_time); }
                if ($i ~ /rx bytes:/) { rx_bytes = $i; sub(/^.*rx bytes:[\t ]*/, "", rx_bytes); }
                if ($i ~ /tx bytes:/) { tx_bytes = $i; sub(/^.*tx bytes:[\t ]*/, "", tx_bytes); }
            }
            if (mac != "") {
                gsub(/\t/, "", mac); gsub(/\t/, "", sig); gsub(/\t/, "", rx); gsub(/\t/, "", tx);
                printf "%s{\"mac\":\"%s\", \"ssid\":\"%s\", \"signal\":\"%s\", \"conn_time\":%s, \"rx_rate\":\"%s\", \"tx_rate\":\"%s\", \"total_data\":%d, \"ap\":\"%s\", \"iface\":\"%s\", \"band\":\"%s\"}", \
                comma, mac, ssid, sig, conn_time, rx, tx, (rx_bytes+tx_bytes), ap_name, iface_name, band;
                comma = ",";
            }
        }
    ')

    if [ -n "$CLIENTS_ON_THIS_IFACE" ]; then
        if [ -n "$ALL_CLIENTS_JSON" ]; then
            ALL_CLIENTS_JSON="${ALL_CLIENTS_JSON},"
        fi
        ALL_CLIENTS_JSON="${ALL_CLIENTS_JSON}${CLIENTS_ON_THIS_IFACE}"
    fi
done

if [ -n "$ALL_CLIENTS_JSON" ]; then
    JSON_DATA="[${ALL_CLIENTS_JSON}]"
    wget -q -O - --post-data="$JSON_DATA" "$POST_URL" >/dev/null
fi
