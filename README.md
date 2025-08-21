# owrt-controller-v1
Openwrt wifi clients dashboard

I have a working centralized wireless clients dashboard page that i want to share with you. The controller should be any openwrt device, while the other ap's from your network will pass data to the controller.
All my ap at work are dumb ap's with vlans for office and guests and management. As long are your ap's are on the LAN side of your main ap and you can ping from each other, the scripts should work.

![Only wifi clients works for the moment](https://github.com/gorunul/owrt-controller-v1/blob/main/ss-wifi-clients-er.jpg)

```plaintext
.
├── Main AP / Router
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
└── AP Slaves
    └── usr/
        └── bin/
            └── report_clients.sh

After copying the files on that specific locations you will need to:

Main AP:
* edit /www/cgi-bin/get_clients and specify the interfaces to check
* chmod +x /www/cgi-bin/get_clients

AP Slaves:
* edit /usr/bin/report_clients.sh and specify the interfaces to check and the ip address of the main ap
* chmod +x /usr/bin/report_clients.sh
* #crontab -e and add * * * * * /usr/bin/report_clients.sh

       
Have fun!



Future steps (if i will keep use openwrt ap's at work):
- convert to C
- push configs to slave ap's ( i personaly need vlans management from a single point and wifi configs for the moment)
- push 802.11kv data to slave ap's 
- device adoption like on Ubiquity, TPlink, Grandstream
