# owrt-controller-v1
Openwrt wifi clients dashboard

I have a working centralized wireless clients dashboard page that i want to share with you. The controller should be any openwrt device, while the other ap's from your network will pass data to the controller.

![Only wifi clients works for the moment](https://github.com/gorunul/owrt-controller-v1/blob/main/ss-wifi-clients-er.jpg)

Main AP/Router:

```plaintext
.
├── AP_Principal/
│   ├── usr/
│   │   └── share/
│   │       └── luci/
│   │           └── menu.d/
│   │               └── luci-app-controller.json
│   └── www/
│       ├── cgi-bin/
│       │   └── get_clients
│       └── luci-static/
│           └── resources/
│               └── view/
│                   └── controller/
│                       └── clients_dashboard.js
└── AP_Secundar/
    └── usr/
        └── bin/
            └── report_clients.sh
                    


AP Slaves (you can use it on the main ap/router too):

/
|-- usr/
    |-- bin/
        |-- report_clients.sh

After copying the files you will need to give execute permissions to the following files :
- Main AP: chmod +x /www/cgi-bin/get_clients
- AP Slaves : chmod +x /usr/bin/report_clients.sh

And last, you need the slaves to run the report_clients.sh script each minute (or more):
#crontab -e
* * * * * /usr/bin/report_clients.sh
       
Have fun!



Future steps (if i will keep use openwrt ap's at work):
- convert to C
- push configs to slave ap's ( i personaly need vlans management from a single point and wifi configs for the moment)
- push 802.11kv data to slave ap's 
- device adoption like on Ubiquity, TPlink, Grandstream
