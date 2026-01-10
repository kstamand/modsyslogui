![ShellCheck](https://img.shields.io/badge/ShellCheck-passing-brightgreen)

# modsyslogui - Customize router's "System Log" page with custom filtering capabilities
## About:
The default filtering capabilities of what is <ins>displayed</ins> on the System Log page of the router is limited to hardcoded text strings
in a file called "logFilter.json". This script adds a capability to edit that file to your likings. 

This script also updates the System Log page of the Router UI to include dynamic filtering capabilities to:
   - Include all log records, which is the default function, including exclusions noted in logFilter.json  
   - Include only log records containing the string or strings of text you chose (separate each by a comma)  
     Example - to include all Skynet and Diversion log records only, enter Skynet,Diversion (no spaces after comma)  
   - Exlude all log records containing the string or strings of text you chose (separate each by a comma)  
     Example - to exlcude all Skynet log records that where blocked, enter the string BLOCKED
   - Use the logical operators AND or OR or AND NOT to filter the log records to display  
     Example - only show kernel error msgs (e.g., Jan  8 00:02:32 kernel: WLC_SCB_DEAUTHORIZE error (-30), enter kernel AND error
     
This script has been developed under Asuswrt-Merlin 3006.102.6 firmeware and tested on the following routers:
- RT-BE96U
- RT-AX88U Pro
- GT-AX6000

*This script DOES NOT equal or replace the functionality that the SCRIBE addon provides.<br>
Instead, it is a simpler lightweight addon that only utilizes the native capabilities of the router.*  

__IT IS NOT RECOMMENDED TO INSTALL THIS SCRIPT AND SCRIBE AT THE SAME TIME. CHOOSE ONE OR THE OTHER__

## Overview:
- Installs script onto router to add filtering capabilities to the routers "System Log" UI page
- The script provides an interactive manu of options to perform various script maintenance functions
- Custom System Log filtering capabilities added with this script include:
	1. Hardcoded Filtering - By default, the System Log page filters log records to display based on the contents of a "logFilter.json" file. This script includes an EDIT option that allows you to customize to your liking.
 	2. Dynamic Filtering - The System Log page is modifed to allow you to interactively seltect which log records to INCLUDE or EXCLUDE, with the default action of filtering records based on the contents of the logFilter.json file 

*Hardcoded Filtering changes are made from an SSH session to the router, and choosing option 5 from the modsyslogui menu*


## Install:
*Requires Asuswrt-Merlin, JFFS enabled, and entware installed via AMTM*

SSH to the router and enter:

```Shell
/usr/sbin/curl --retry 3 "https://raw.githubusercontent.com/kstamand/modsyslogui/master/modsyslogui" -o "/tmp/modsyslogui" && chmod +x /tmp/modsyslogui && sh /tmp/modsyslogui install
```

## Configuration:
*No configuration is required, unless you want to edit the default contents of the "logFilter.json" file --> option 5 from the modsyslogui menu.* 

The default contents of the logFilter.json file are:

		{
		"filter": [
		"already exist in UDB, can't add it",
		"not mesh client, can't update it's ip",
		"not exist in UDB, can't update it",
		"send_redir_page"
		]
		}

To edit this file, add one line for each string from a given log record you want to exclude assocated log records from being displayed
- string needs to be enclosed in quotes ("")
- each line, except the last line of the list of filtering strings, must end in a comma (,)

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

**TIPS**
ALL System log records, generally start with a script function name. Examples;
- The majority of ADDON script contributors prefix their log records with the name of their script (e.g., Diversion, Skynet, Scribe, ...)
- Other than that, scan log records for unique strings from a given record to inlude / exclude, such as
  - wireless events (leaving or joining) = wlcevented
  - ethernet connected devices powering on or shutting down (entering listening | learning | forwarding state)
  - specific addon scripts (e.g., log records starting with modsyslogui)
	 
## Command line usage:
Once installed, from a terminal ssh session into the router, enter the command **modsyslogui** and choose from one of the menu options:

<img width="1090" height="455" alt="image" src="https://github.com/user-attachments/assets/69a9d914-7bfc-4de4-abc0-1469fa85f50d" />

To skip displaying the menu, you can run select options directly by running **modsyslogui** with one of the following parameters;

	- modsyslogui install
	- modsyslogui update
	- modsyslogui enable
	- modsyslogui disable
	- modsyslogui uninstall

## System Log page usage:
The System Log page is customized by this script to add a dynamic **Log Filtering Option** box, where you have three options:
1. Show all log records (default option) - nothing need be entered in the dialog box under the three options. All system log records are displayed, minus those log records matching one of the strings in the logFilter.json file
2. Include only - enter a string or series of strings separated by a comma, with no spaces, to only show log records matching the string(s)
3. Exclude containing - enter a string or series of strings separated by a comma, with no spaces, to exclude log records matching the string(s)

<img width="767" height="732" alt="image" src="https://github.com/user-attachments/assets/488fb885-fb5b-406d-9b72-bc066f459d66" />

## Support
See [SmallNetBuilder Forum](https://www.snbforums.com/threads/modsyslogui-v1-0-0-released-add-on-providing-system-log-page-ui-filtering-capabilities.96496/) for more information & discussion
