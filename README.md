# ModSyslogUI - Customize router's "System Log" page with custom filtering capabilities
## About:
The default filtering capabilities of what is <ins>displayed</ins> on the System Log page of the router is limited to hardcoded text strings
in a file called "logFilter.json". This script adds a capability to edit that file to your likings. 

This script also updates the System Log page of the Router UI to include dynamic filtering capabilities to:
   - Include all log records, which is the default function, including exclusions noted in logFilter.json  
   - Include only log records containing the string or strings of text you chose (separate each by a comma)  
     Example - to include all Skynet and Diversion log records only, enter Skynet,Diversion (no spaces after comma)  
   - Exlude all log records containing the string or strings of text you chose (separate each by a comma)  
     Example - to exlcude all Skynet log records that where blocked, enter the string BLOCKED
   - Use simple logical operators AND or OR or AND NOT to filter the log records to display  
     Example - only show kernel error msgs (e.g., Jan  8 00:02:32 kernel: WLC_SCB_DEAUTHORIZE error (-30), enter kernel AND error
   - Filter for a tag, combined with a simple logical (term AND term)
     Example - find all kernel: tags with an ethernet port down, enter kernel: eth AND Down
   - Optionally ignore upper / lower case (uncheck **Match case**), e.g. error also matches ERROR and Error
   - Save frequently used filters as Presets, with one optionally loading automatically
   - Export the log records currently displayed (with the active filter applied) to a text file

This script supports Asuswrt-Merlin firmware 3004.388.* and 3006.102.* and associated routers.

*This script DOES NOT equal or replace the functionality that the SCRIBE addon provides.<br>
Instead, it is a simpler lightweight addon that only utilizes the native capabilities of the router.*  

__IT IS NOT RECOMMENDED TO INSTALL THIS SCRIPT AND SCRIBE AT THE SAME TIME. CHOOSE ONE OR THE OTHER__

## Overview:
- Installs script onto router to add filtering capabilities to the routers "System Log" UI page
- The script provides an interactive manu of options to perform various script maintenance functions
- Custom System Log filtering capabilities added with this script include:
	1. Hardcoded Filtering - By default, the System Log page filters log records to display based on the contents of a "logFilter.json" file. This script includes an EDIT option that allows you to customize to your liking.
 	2. Dynamic Filtering - The System Log page is modifed to allow you to interactively seltect which log records to INCLUDE or EXCLUDE, with the default action of filtering records based on the contents of the logFilter.json file 

*Hardcoded Filtering changes are made from an SSH session to the router, and choosing option 4 (Edit) from the modsyslogui menu*


## Install:
*Requires Asuswrt-Merlin and JFFS enabled*

SSH to the router and enter:

```Shell
/usr/sbin/curl --retry 3 "https://raw.githubusercontent.com/kstamand/modsyslogui/main/modsyslogui" -o "/tmp/modsyslogui" && chmod +x /tmp/modsyslogui && sh /tmp/modsyslogui install
```

### Beta testing (develop branch)
*For testers only - the develop branch contains code that is still being tested.*

Once installed, switch to the develop branch with menu option **(sd)** or `modsyslogui develop`. Switch back to the stable release at any time with menu option **(sm)** or `modsyslogui main`.

## Configuration:
*No configuration is required, unless you want to edit the default contents of the "logFilter.json" file --> option 4 (Edit) from the modsyslogui menu.* 

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
ALL System log records, generally start with a date and a tag. Examples;
- The majority of ADDON script contributors prefix their log records with the name of their script (e.g., Diversion, Skynet, Scribe, ...)
- Other than that, scan log records for unique strings from a given record to inlude / exclude, such as
  - wireless events (wlcevented)
  - ethernet connected devices powering on or shutting down (entering listening | learning | forwarding state)
  - specific tags /addon script names (e.g., log records starting with modsyslogui)
	 
## Command line usage:
Once installed, from a terminal ssh session into the router, enter the command **modsyslogui** and choose from one of the menu options:

<img width="642" height="453" alt="image" src="https://github.com/user-attachments/assets/3904ff9c-d1dd-4927-a54b-8d9ff2796222" />


To skip displaying the menu, you can run select options directly by running **modsyslogui** with one of the following parameters;

	- modsyslogui install
	- modsyslogui update
	- modsyslogui enable
	- modsyslogui disable
	- modsyslogui uninstall
	- modsyslogui main      (switch to the stable release branch)
	- modsyslogui develop   (switch to the develop / beta branch - testers only)

## System Log page usage:
The System Log page is customized by this script to add a dynamic **Log Filtering Engine** box, with the following options:
1. Show all log records (default option) - nothing need be entered in the dialog box under the options. All system log records are displayed, minus those log records matching one of the strings in the logFilter.json file
2. Include only - enter a string or series of strings separated by a comma, to only show log records matching the string(s)
3. Exclude containing - enter a string or series of strings separated by a comma, to exclude log records matching the string(s)
4. Logical - enter *term* OPERATOR *term*, where valid operators are AND | OR | AND NOT (UPPERCASE, one operator per filter) and term any string
5. Match case - checked (default) matches upper / lower case exactly. Uncheck to ignore case for Include, Exclude, and Logical terms (operators must still be UPPERCASE)
6. Presets - a drop down list of previously saved filter actions (Include, Exclude, Logical), filter text and Match case setting, with the option to select ONE as the default to automatically load and run on System Log page load
7. Export - saves the log records currently displayed (with the active filter applied) to a text file named `syslog_<filter>_<YYYYMMDD-HHMMSS>.txt`, using your browser's normal download (your Downloads folder, or a "Save As" prompt if your browser is set to ask). The file starts with a short header (router model / firmware, export time, filter used, line count). The page's stock **Save** button still saves the full, unfiltered log
   - To choose where the file is saved, set your browser to ask for a download location: Safari - Settings > General > File download location > *Ask for each download*; Chrome / Edge - *Ask where to save each file before downloading*; Firefox - *Always ask you where to save files*

While Auto refresh is on, the log only jumps to the newest records if you are already at the bottom, so you can scroll up and read older records without being interrupted.

<img width="777" height="772" alt="image" src="https://github.com/user-attachments/assets/64f8cec2-ab94-48ed-b3b9-1a6b1c767722" />


## Support
See [SmallNetBuilder Forum](https://www.snbforums.com/threads/modsyslogui-v1-0-0-released-add-on-providing-system-log-page-ui-filtering-capabilities.96496/) for more information & discussion

## Debuging
In the event script or UI filtering options do not work, collect and provide the following information in the ModSyslogUI thread of snbforums:
- screenshot of error either on the UI or script from SSH session
- if the modsyslogui shell script is generating an error, capture the output from the SSH session, plus any modsyslogui records from the System Log (Include filter: modsyslogui)
- if the UI filtering is not working as expected, open the browser's DEV TOOLS (you may need to enable that first) and capture a screenshot of any CONSOLE errors, then post them in the ModSyslogUI thread of snbforums
- if the System Log page shows no filtering box after a firmware update, the script may have found the stock page in an unexpected format and left it unmodified on purpose. Check the System Log for modsyslogui [ERROR] records and post them in the ModSyslogUI thread of snbforums
- in certain instances, I may ask for a copy of the /tmp/Main_LogStatus_Content.asp file (all the filtering magic happens here). In that event, run the following command and attach the log.txt to ModSyslogUI thread explaining the issue

```Shell
cat /tmp/Main_LogStatus_Content.asp > log.txt
```

## License

Copyright (c) 2026 kstamand

This project is licensed under the MIT License.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, provided that the above copyright notice and this
permission notice are included in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.


