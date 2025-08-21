'use strict';
'require view';
'require dom';
'require ui';
'require poll';
'require request';

function formatBytes(bytes, decimals = 1) { 
    if (!+bytes) return '0 B'; 
    const k=1024,dm=decimals<0?0:decimals,s=['B','KB','MB','GB','TB'],i=Math.floor(Math.log(bytes)/Math.log(k)); 
    return `${parseFloat((bytes/Math.pow(k,i)).toFixed(dm))} ${s[i]}` 
}

function formatUptime(seconds) { 
    if(!seconds&&seconds!==0)return'N/A';
    if(seconds<60)return `${seconds}s`;
    const d=Math.floor(seconds/86400),h=Math.floor(seconds%86400/3600),m=Math.floor(seconds%3600/60);
    let r='';if(d>0)r+=`${d}d `;if(h>0)r+=`${h}h `;if(m>0)r+=`${m}m`;
    return r.trim()||`${Math.floor(seconds)}s`
}

function getSignalClass(signalStr) {
    if(!signalStr) return '';
    const signalValue = parseInt(signalStr, 10);
    if(signalValue > -60) return 'signal-strong';
    if(signalValue > -75) return 'signal-medium';
    return 'signal-weak';
}

return view.extend({
    load: function() {
        return request.get('/cgi-bin/get_clients');
    },

    render: function(response) {
        var clients = [];
        
        try {
            if (response && response.json) {
                var jsonData = response.json();
                if (Array.isArray(jsonData)) {
                    clients = jsonData;
                } else if (jsonData && typeof jsonData === 'object') {
                    clients = jsonData.clients || jsonData.data || [];
                }
            }
        } catch (e) {
            console.error('Error parsing client data:', e);
            clients = [];
        }

        var filterInput = E('input', {
            'type': 'text',
            'placeholder': _('Filter by MAC, SSID, AP, etc...'),
            'style': 'width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px;'
        });

        var tableContainer = E('div', {
            'style': 'overflow-x: auto; margin-bottom: 15px;'
        });

        var table = E('table', {
            'class': 'table',
            'style': 'width: 100%; border-collapse: collapse;'
        });

        var tableHeader = E('thead', {}, [
            E('tr', {}, [
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('Station')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('SSID')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('Band')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('Signal')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('RX / TX Rate')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('Total Data')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('Connected Time')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('AP')),
                E('th', { 'style': 'padding: 12px; border: 1px solid #ddd; background: #f5f5f5; text-align: left;' }, _('Interface'))
            ])
        ]);

        var tableBody = E('tbody', {});

        table.appendChild(tableHeader);
        table.appendChild(tableBody);
        tableContainer.appendChild(table);

        var lastUpdatedElem = E('p', {
            'style': 'font-style: italic; color: #666; margin-top: 15px;'
        });

        var populateTable = function(clientList) {
            tableBody.innerHTML = '';

            var filterText = filterInput.value.toLowerCase().trim();
            var filteredClients = clientList.filter(function(client) {
                if (!filterText) return true;
                
                var searchText = [
                    client.mac || '',
                    client.ssid || '',
                    client.band || '',
                    client.signal || '',
                    client.ap || '',
                    client.iface || ''
                ].join(' ').toLowerCase();
                
                return searchText.includes(filterText);
            });

            if (filteredClients.length === 0) {
                var noResultsRow = E('tr', {}, [
                    E('td', { 
                        'colspan': '9',
                        'style': 'padding: 20px; text-align: center; color: #666; border: 1px solid #ddd;'
                    }, _('No matching clients found.'))
                ]);
                tableBody.appendChild(noResultsRow);
                return;
            }

            filteredClients.forEach(function(client, index) {
                var mac = client.mac || 'N/A';
                var ssid = client.ssid || 'N/A';
                var band = client.band || 'N/A';
                var signal = client.signal || 'N/A';
                var rxRate = client.rx_rate || 'N/A';
                var txRate = client.tx_rate || 'N/A';
                var totalData = client.total_data || 0;
                var connTime = client.conn_time || 0;
                var ap = client.ap || 'N/A';
                var iface = client.iface || '';

                var bandClass = band === '5G' ? 'badge-5g' : 'badge-2-4g';
                var signalClass = getSignalClass(signal);

                var stationCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle;' }, [ E('code', { 'style': 'background: #f8f9fa; padding: 2px 4px; border-radius: 3px;' }, mac) ]);
                var ssidCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle;' }, ssid);
                var bandCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle;' }, [ E('span', { 'style': 'display: inline-block; padding: 3px 8px; font-size: 12px; font-weight: bold; background: ' + (band === '5G' ? '#6f42c1' : '#17a2b8') + '; color: white; border-radius: 4px;' }, band) ]);
                var signalCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle; color: ' + (signalClass === 'signal-strong' ? '#28a745' : signalClass === 'signal-medium' ? '#ffc107' : '#dc3545') + ';' }, signal);
                var rateCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle;' }, rxRate + ' / ' + txRate);
                var dataCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle;' }, formatBytes(totalData));
                var timeCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle;' }, formatUptime(connTime));
                var apCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle; font-weight: 500;' }); apCell.textContent = ap;
                var ifaceCell = E('td', { 'style': 'padding: 8px 12px; border: 1px solid #ddd; vertical-align: middle; color: #6c757d; font-size: 0.9em;' }); ifaceCell.textContent = iface;
                var row = E('tr', { 'style': 'border-bottom: 1px solid #ddd; transition: background-color 0.2s ease;', 'onmouseover': function() { this.style.backgroundColor = '#f8f9fa'; this.style.cursor = 'pointer'; }, 'onmouseout': function() { this.style.backgroundColor = ''; this.style.cursor = 'default'; } });

                row.appendChild(stationCell);
                row.appendChild(ssidCell);
                row.appendChild(bandCell);
                row.appendChild(signalCell);
                row.appendChild(rateCell);
                row.appendChild(dataCell);
                row.appendChild(timeCell);
                row.appendChild(apCell);
                row.appendChild(ifaceCell);
                tableBody.appendChild(row);
            });
        };

        filterInput.addEventListener('input', function() {
            populateTable(clients);
        });
        
        populateTable(clients);
        lastUpdatedElem.textContent = _('Last updated') + ': ' + new Date().toLocaleTimeString();

        poll.add(function() {
            return request.get('/cgi-bin/get_clients').then(function(response) {
                try {
                    var newClients = [];
                    if (response && response.json) {
                        var jsonData = response.json();
                        if (Array.isArray(jsonData)) {
                            newClients = jsonData;
                        } else if (jsonData && typeof jsonData === 'object') {
                            newClients = jsonData.clients || jsonData.data || [];
                        }
                    }
                    clients = newClients;
                    populateTable(clients);
                    lastUpdatedElem.textContent = _('Last updated') + ': ' + new Date().toLocaleTimeString();
                } catch (e) {
                    console.error('Error updating client data:', e);
                }
            }).catch(function(error) {
                console.error('Error fetching client data:', error);
            });
        }, 5);

        var mainContainer = E('div', { 'class': 'cbi-map' }, [
            E('h2', {}, _('Wireless Clients Dashboard')),
            filterInput,
            tableContainer,
            lastUpdatedElem
        ]);

        return mainContainer;
    },

    handleSaveApply: null, 
    handleSave: null, 
    handleReset: null
});
