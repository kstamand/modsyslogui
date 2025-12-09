<!-- //+++ Start Custom Asuswrt UI log filter code -->
<fieldset id="filter_optons">
    <p style="color: cyan"> <em> No selection is necessary. Default is to show all log records + exlcude content matching logFilter.json content.</em></p>
    <legend>Log Filtering Options</legend>
    <input type="radio" id="ShowAll" value="" name="filter_options" checked="checked">
    <label for="ShowAll">Show All Log records</label>
    <input type="radio" id="Include" value="" name="filter_options">
    <label for="Include">Include Only</label>
    <input type="radio" id="Exclude" value="" name="filter_options">
    <label for="Exclude">Exclude Containing </label>
    <input type="text" id="filter_text" placeholder="Enter filtering text here, then select either Include or Exclude to filter log. Text ignored when selecting Show All" style="width: 700px;"><br>
    <p style="color: palegreen"> Multiple comma delimited text filtering fields are supported (e.g., Diversion:, Skynet:, BLOCKED, wlceventd, Dissassociated)</p>
    <form action="/post" method="post" onsubmit="filterHandler(event)">
        <input type="submit" value="Submit">
    </form>
</fieldset>
<!-- //+++ End Custom Asuswrt UI log filter code --->
