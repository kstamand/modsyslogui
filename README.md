# modsyslogui - Customize routers "System Log" page with custom filtering capabilities

This script has been developed and tested on a RT-BE96U, running Asuswrt-Merlin 3006.102.6

## Overview:
- Installs script onto router and adds call to "services-start" to custome System Log page on router bootup
- Provides and interactive manu of options to maintain the script and perform various maintenance functions
- Custom System Log filtering capabilities added with this script:
	1. Hardcoded Filtering - By default, the System Log page filters log records to display based on the contents of a "logFilter.json" file. This script includes an EDIT option that allows you to customize to your liking.
 	2. Dynamic Filtering - The System Log page is modifed to allow you to interactively seltect which log records to INCLUDE or EXCLUDE, with the default action of filtering records based on the contents of the logFilter.json file 

*Hardcoded Filtering changes are made from an SSH session to the router, and choosing option 5 from the modsyslogui menu*


## Install:
*Requires Asuswrt-Merlin, JFFS enabled, and entware installed via AMTM*

SSH to the router and enter:

```Shell
/usr/sbin/curl --retry 3 "https://raw.githubusercontent.com/kstamand/modsyslogui/master/modsyslogui" -o "/jffs/addons/modsyslogui/modsyslogui" --create-dirs && chmod +x /jffs/addons/modsyslogui/modsyslogui && sh /jffs/addons/modsyslogui/modsyslogui install
```

## Configuration:
*No configuration is required, unless you want to edit the default contents of the "logFilter.json" file --> option 5 from the modsyslogui menu. 

The default contents of the logFilter.json file are:

		{
		"filter": [
		"already exist in UDB, can't add it",
		"not mesh client, can't update it's ip",
		"not exist in UDB, can't update it",
		"send_redir_page"
		]
		}

To edit this file, add one line for each string from a given log record you want to exclude from being displayed
		*string needs to be enclosed in quotes ("")
		each line, except the last line of strings, must end in a comma (,)*

Example custimized logFilter.json file, to exclude all wireless events ("wlceventd"), Diversion records ("Diversion:"), and Skynet BLOCKED records ("BLOCKED"):

		{
		"filter": [
		"already exist in UDB, can't add it",
		"not mesh client, can't update it's ip",
		"not exist in UDB, can't update it",
		"send_redir_page",
		"wlceventd",
		"Diversion:",
		"BLOCKED"
		]
		}


	 
## Usage:
Once installed, from a terminal ssh session into the router, enter the command **modsyslogui** and choose from one of the menu options:

  (1) About        explain functionality
	(2) Help         information on how to use this script
	(3) Install      install all script files
	(4) Update       check for script updates
  (5) Edit         edit the default list of log records to exclude from displaying in the UI
  (6) Add          select this only if you removed the filtering capabilities for some reason
  (7) Remove       remove the filtering capabilities temporarily
  (8) Debug        enable verbose logging for troubleshooting
  (9) Uninstall    completely remove HideUIMenus from the router
  (e) Exit         exit without doing anything
