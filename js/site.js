//Instantiate map
let map = L.map('map', {
    //Canvas renderer added to create wider selection area. Useful especially on touch devices.
    renderer: L.canvas({
        tolerance: 10
    }),
    gestureHandling: activateGestureHandling(),
    contextmenu: true,
    contextmenuWidth: 150,
    contextmenuItems: [{
        text: 'Open with OSM',
        icon: 'img/osm-logo.png',
        callback: openOSM
    },
    {
        text: 'Open with GMaps',
        icon: 'img/gmaps-logo.png',
        callback: openGmaps
    }]
});

//Either keep hash value in URL (prio 1) or set location.hash with coords from local storage (prio 2).
//If no entry in local storage: Zoom all the way out to "#2/15/-15" (prio 3)
//The map view itself is set within leaflet-hash afterwards ("map.setView")
const hashFromLocalStorage = localStorage.getItem('location-hash');
if (!location.hash) location.hash = hashFromLocalStorage || "#2/15/-15";

//Activate gesture handling only on small screens ("use two fingers to pan and zoom map")
function activateGestureHandling() {
    if (screen.width < 601) return true;
    else return false;
}

//If screen width changes during use of app (e.g. turning phone from portrait to landscape)
//--> Activate gesture handling if screen width is < 601px
window.addEventListener("resize", () => {
    // console.log(screen.width);
    if (screen.width < 601) map.gestureHandling.enable();
    else map.gestureHandling.disable();
});

//Add scale
L.control.scale().addTo(map);

//Add "set current location" button to map
L.control.locate({
    initialZoomLevel: 14,
    strings: {
        title: "Go to my current location"
    }
}).addTo(map);

//Toggle sidebar button on map
let sidebar = document.querySelector(".sidebar");
L.Control.toggleSidebarButton = L.Control.extend(
    {
        options:
        {
            position: 'topleft',
        },
        onAdd: function (map) {
            let controlDiv = L.DomUtil.create('div', 'leaflet-control-toggle leaflet-bar');
            L.DomEvent
                .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                .addListener(controlDiv, 'click', toggleSidebar);

            let controlUI = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', controlDiv);
            controlUI.title = 'Toggle display of sidebar <Spacebar>';
            controlUI.href = '#';

            let barIcon = L.DomUtil.create('span', 'leaflet-control-toggle-icon', controlUI);

            return controlDiv;
        }
    });
let toggleSidebarButton = new L.Control.toggleSidebarButton();
map.addControl(toggleSidebarButton);

/*Toggle sidebar class and update Leaflet map size
(but quite useless because the download button is hidden anyway, thus cannot make use of the added map real estate to download changesets of a larger region)*/
function toggleSidebar() {
    sidebar.classList.toggle("hide");
    // let size = map.getSize();
    // console.log(size);
    // let bounds = map.getBounds();
    // console.log(bounds);
    map.invalidateSize();//make sure that leaflet updates map size
    // size = map.getSize();
    // console.log(size);
    // bounds = map.getBounds();
    // console.log(bounds);
}

//1. Toggle display of sidebar on press of Spacebar
//2. On typing a letter or number: Focus on filter changeset input field and input first letter
document.addEventListener("keyup", event => {
    // console.log(event.key);
    const isLetter = (event.key >= 'a' && event.key <= 'z');
    const isNumber = (event.key >= '0' && event.key <= '9');
    event.preventDefault(); //prevent default, i.e. "page down" for spacebar
    if (event.key == " ") {
        toggleSidebar();
    } else if (isLetter || isNumber) {
        let inputField = document.querySelector(".search-changesets-field");
        //If the input field is empty AND doesn't have focus: Add focus, write typed letter in field and launch filter function.
        if (!inputField.value && document.activeElement !== inputField) {
            inputField.focus();
            inputField.value = event.key;
            showHideCrossThenFilter();
        }
    }
});

//Open link to OSM when "RMB --> Open with..."
function openOSM(e) {
    const url = `https://www.openstreetmap.org/?mlat=${e.latlng.lat}&mlon=${e.latlng.lng}#map=${map.getZoom()}/${e.latlng.lat}/${e.latlng.lng}`;
    window.open(url, '_blank').focus();
}

//Open link to Google Maps when "RMB --> Open with..."
function openGmaps(e) {
    const url = `https://maps.google.com/maps?q=loc:${e.latlng.lat},${e.latlng.lng}`;
    window.open(url, '_blank').focus();
}

//Timeframe
let daysToShow;
// load resolutionFromLocalStorage from local storage, if available
const resolutionFromLocalStorage = localStorage.getItem("resolution");
if (resolutionFromLocalStorage) {
    daysToShow = resolutionFromLocalStorage;
    // select value from local storage in drop down menu
    document.getElementById('resolution').value = daysToShow;
} else {
    // else, i.e. no resolution saved in local storage: Default to 7 days
    daysToShow = 7;
}

//Calculate point in time from where to start analysis
function calculateAnalysisStartTime() {
    const analysisStartTime = (new Date(new Date() - 1000 * 60 * 60 * 24 * daysToShow));
    // console.log(analysisStartTime);
    return analysisStartTime;
}

//Since we want to display a custom attribution: Hide the "Leaflet |" prefix when displaying attribution.
map.attributionControl.setPrefix('');

//Add the standard OSM Carto tile layer to the map
const osmCartoLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 21,//Allow zoom levels up to 21 even though tiles are only available until z19. Leaflet will interpolate.
    maxNativeZoom: 19,
    attribution: "<a target='_blank' href='https://www.openstreetmap.org/copyright' style='background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAMAAACelLz8AAAB11BMVEXZ2dlkZGT///////////8mJibIyMj5+fm6urr///8sLCywsLBJSUn///9eXl7////////j4+P////////Q0ND////u7u7i4uIfHx/s7OxmZmZzc3P39/fw8PDg4OD5+fmNjY1cXFz5+flQUFBGRkaIiIhtbW3///////9hYWHS0tKlpaWsrKzZ2dmgoKCpqalycnLg4OCCgoJLS0tEREQlJSX9/f3///8/Pz/e3t4jIyP///////////+/v7+Ghobp6enDw8Pl5eVXV1f////////U1NT////////////////l5eW1tbX///+4uLj////////////////////////////w8PDNzc3GxsYuLi7w8PD///////9paWmvr6/c3NwhISHe3t5UVFQfHx/y8vLn5+d3d3eXl5f////09PTs7Oz///8zMzN8fHz///+UlJT////////u7u44ODj////p6en///86Ojqurq5ZWVlfX1////////8hISFBQUGioqIlJSXV1dV6enoqKioxMTH39/eLi4s4ODj///9ra2ubm5v9/f3Nzc28vLz///9LS0v///////////+FhYUdHR3////X19cjIyM2Njaenp7///8AAAAbGxtl93oXAAAAnXRSTlNzcE9udnpweG9Gem50TnI9Z3VgbHEWeHR9dnBvendzfG5ye3N0b3A4I3Fxbm5ybm5wdG5zdXt0NHVze14eMW9udW90cld4cUdSFx11bnJvHG1ANj8VQnlwcHl4H1xwb3N8dHN8eXZvbnV5d0t4byluAyd3dwt2VnZucnEvCn11bnxyb3p4e252BHBufXFvYnRzZQxvfWpyfHdufQB9fOn/1AAAAY5JREFUKM+V0mVvwzAQBuCMmZmZmZmZmZmZGcpMa7ukWXK5H7ukVbOpmqbt/WDZfiRLdz6C+8oqAPh6+8BqnANaOI74RoASydLisnzRdiGt9yQa9pVglC7LYws8advLTxEWoJaGx1x6ksx/LdQetI5R55xIE4O2+yvhwZDgwxUaobDh1kn6F/ud9vSMBu3p5lLgycqGAZosjneCe52zLTyjEB17DRAdERkva0Rk34h3x+gNinmy7FqyKOcWiDcWfw4QgL+TXC2sH8yOJ9V1AXRaUZmdkZqCALX4APDhotKjbcZ8LDkyoiyBp3I0ipRWgVgDORu768mJCFt3uEe4SXPA1wRFqgPatEVBJpyZSDcpFBR2mKzFubgGN5BfpjEb3GTVdJtNRqrq+DE9aQcMJFSKhIyW7UFsri7JUyHJqMhNhqT+UPL/iO+8ix4e5y1P38A6zv+X0Pln89jU7LT9mtU575mLkcmZV47/r/Y9+4temIKhARutVO/3H54Mc87ZuG1rFQfn8uq+r/dc7zp8AmmAXy4xp9xiAAAAAElFTkSuQmCC) no-repeat; background-size:26px 26px;width:24px;height:24px;display:block;z-index:1000;bottom:2px;right:5px;bottom:5px;position:absolute;'></a>"
}).addTo(map);

//Create a blank (i.e. white) tile layer. This makes it sometimes easier to find highlighted geometries.
const whiteTileUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAIAAADYVYZuAAAAKUlEQVR4nO3BMQEAAAwCoNm/9HIwAAAAAAAAAAAAAAAAAAAAAAAAAHwFtXIAARgZGQoAAAAASUVORK5CYII=";

const whiteTileLayer = L.tileLayer(whiteTileUrl, {
    tileSize: 256,
    maxZoom: 21,
    attribution: ''
});

const baseMaps = {
    "OSM Carto": osmCartoLayer,
    "Blank": whiteTileLayer
};

//Add the layer control to the top right of the map.
L.control.layers(baseMaps).addTo(map);

//Update hash on map pan/zoom (functionality from leaflet-hash.js)
map.addHash();

//Update map display on zoom and page load
function updateMap() {
    // console.log('updatemap called');
    const mapHtml = document.querySelector("#map");
    const currentZoomLevel = map.getZoom();
    const button = document.getElementById('download-changesets-button');
    const infoText = document.getElementById("zoom-in");
    localStorage.setItem('location-hash', location.hash);
    if (currentZoomLevel > 11) {
        // console.log("Zoom level > 11");
        mapHtml.classList.remove("faded");
        infoText.classList.add("hide");
        button.disabled = "";
        button.title = "Download recent changesets in this region";
        return true;
    } else {
        // console.log("Zoom level <= 11");
        mapHtml.classList.add("faded");
        infoText.classList.remove("hide");
        button.disabled = "disabled";
        button.title = "Zoom in to download changes";
        return false;
    }
}

/**
* Linearly interpolates between two colors based on a factor.
* @param {string} rgb1 - Start rgb color string.
* @param {string} rgb2 - End rgb color string.
* @param {number} factor - Interpolation factor (0.0 to 1.0). 0 = color1, 1 = color2.
* @returns {string} - Interpolated rgb color string.
*/
function interpolateColor(rgb1, rgb2, factor) {
    // Get r, g, b values as numbers
    // Explanation:
    // rgb1.match(/\d+/g) returns an array with the 3 numbers as strings, e.g. ['119', '119', '119']
    // .map(Number) is a shorthand for ['119', '119', '119'].map(str => Number(str)) and converts all strings to numbers
    const [rgb1R, rgb1G, rgb1B] = rgb1.match(/\d+/g).map(Number);
    const [rgb2R, rgb2G, rgb2B] = rgb2.match(/\d+/g).map(Number);

    // Find the 'in-between-color' for r, g and b based on the age of the changeset.
    const r = Math.round(rgb1R + (rgb2R - rgb1R) * factor);
    const g = Math.round(rgb1G + (rgb2G - rgb1G) * factor);
    const b = Math.round(rgb1B + (rgb2B - rgb1B) * factor);

    // console.log(`rgb(${r},${g},${b})`);
    return `rgb(${r},${g},${b})`;
}

// Return color depending on age of changeset. New: bright red, old: dark red/gray
function defineColor(date) {
    // console.log('defineColor() called');

    // Ensure input 'date' is a Date object
    if (!(date instanceof Date)) {
        date = new Date(date); // Attempt to convert if not already a Date
        if (isNaN(date)) { // Check if conversion failed
            console.error("Invalid date passed to defineColor:", date);
            return '#777777'; // Return default gray on error
        }
    }

    const colorOldest = 'rgb(119, 119, 119)'; // Gray for oldest
    const colorNewest = 'rgb(255, 0, 0)';   // Red for newest

    const startDate = calculateAnalysisStartTime(); // Calculate analysis start date
    // console.log(startDate);
    const endDate = new Date(); // Now

    // Get timestamps (milliseconds)
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    const changesetTimestamp = date.getTime();

    // Calculate total duration of the time window
    const totalDuration = endTimestamp - startTimestamp;

    // Handle edge case where start and end times are the same (or invalid)
    if (totalDuration <= 0) {
        return colorNewest; // If no duration, default to newest color
    }

    // Calculate how far the input date is into the duration
    const elapsedTime = changesetTimestamp - startTimestamp;

    // Calculate the proportion (0 to 1)
    let proportion = elapsedTime / totalDuration;

    // Clamp the proportion to be strictly between 0 and 1
    proportion = Math.max(0, Math.min(1, proportion));

    // Interpolate the color based on the proportion
    return interpolateColor(colorOldest, colorNewest, proportion);
}

//Toggle display of loading animation and appearance of download button
function toggleWaitingScreen() {
    const loadingAnimation = document.querySelector("#loading-animation");
    const loadingAnimationText = document.querySelector("#loading-animation-text");
    const button = document.getElementById('download-changesets-button');
    const buttonText = document.getElementById('download-changesets-button-text');

    loadingAnimation.classList.toggle("hide");//display loading spinner
    loadingAnimationText.classList.toggle("hide");//display text below spinner
    if (loadingAnimationText.classList.contains("hide")) {
        loadingAnimationText.innerText = "";//Clear text below spinner when it is hidden
    }
    buttonText.innerText = (buttonText.innerText == "Get Changesets") ? "Loading..." : "Get Changesets";//Toggle button text
    button.disabled = (button.disabled) ? button.disabled = "" : button.disabled = "disabled";//Toggle button disable
}

//On page load: Check if map is zoomed in enough. If yes: Download OSM changeset data from overpass
//There are multiple public Overpass instances available. See https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances
//Array of Overpass servers to try in order. If the first server fails, the fallback servers will be tried.
const overpassServers = [
    '//overpass-api.de/api/', // Primary server (overpass-api.de).
    '//maps.mail.ru/osm/tools/overpass/api/' // Fallback server (VK Maps)
    //'//overpass.private.coffee/api/' // Fallback server 2. Does not work at all. Only returns empty document after 1.1min. Thus commented out.
];
const vandalismThreshold = -3; //If 3 more elements or tags have been deleted than added, the traffic light will change to red
const debugMode = false; //False (default): Do an API call to Overpass. True: Use locally saved xml files for debugging/development purposes

// Reset AbortController to null during load of script. Needed to reset all Promise requests.
window.currentAbortController = null;

// All relevant changeset information will be saved in this object
let changesets = {};

//Check if map is zoomed in enough (only executed on initial page load)
const isMapZoomedInEnough = updateMap();
if (isMapZoomedInEnough) run();

//Start download of changeset data and initiate rendering of changesets list and GeoJSON data on map
function run() {
    d3.select('#map').classed('faded', true);//Map displayed greyish (Cannot go into "toggleWaitingScreen()" because we want to keep the map greyed out in case of unsuccessful overpass query)
    document.querySelector(".filter-container").classList.add("hide");//Hide filter changesets toolbar until load of changesets has been completed successfully
    document.querySelector("#results").innerHTML = "";//Empty old results list (same happens in renderChangeSetsList() later on when filtering)

    toggleWaitingScreen();//Show loading animation and make download button unavailable

    // 1. Abort previous request if it exists
    if (window.currentAbortController) {
        window.currentAbortController.abort();
        console.log("Previous request aborted.");
    }

    // 2. Create a NEW controller for THIS run
    window.currentAbortController = new AbortController();
    const signal = window.currentAbortController.signal; // Get the signal for this run

    // Clear old GeoJSON data from map and reset the main object
    if (changesets.allLeafletLayers) {
        map.removeLayer(changesets.allLeafletLayers);
    }
    changesets = {}; // Reset the main object for the new run

    // Get current extension of displayed leaflet map
    const bounds = map.getBounds();
    const bbox = bounds.getSouthWest().lat + ',' +
        bounds.getSouthWest().wrap().lng + ',' +
        bounds.getNorthEast().lat + ',' +
        bounds.getNorthEast().wrap().lng;
    // const overpass_query = '[adiff:"' + calculateAnalysisStartTime() + '"][bbox:' + bbox + '][out:xml][timeout:22];way->.ways;(.ways>;node;);out meta;.ways out geom meta;';//This query sometimes only returned nodes. Thus replaced with query below
    const overpass_query = '[adiff:"' + calculateAnalysisStartTime().toISOString() + '"][bbox:' + bbox + '][out:xml];nw;out geom meta;';
    // console.log(overpass_server + 'interpreter?data=' + overpass_query);

    let allOverpassXMLDataElements;

    // --- First API call: Fetch GeoJSON data with OSM tags from Overpass ---
    // Function to try fetching from each Overpass server in sequence (fallback mechanism). For debugging purposes a locally saved xml file can be loaded, if debugMode=true.
    function fetchWithFallback(servers, query, signal) {
        if (debugMode) {
            //Load example xml for debugging purposes. Works offline
            return fetch("./examples/exampleOverpassAPI.xml", { signal: signal })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.text();
                });
        }

        // Try each server in sequence until one succeeds
        const tryServer = (index) => {
            const server = servers[index];
            const url = server + 'interpreter?data=' + query;
            const tryingMessage = `Trying Overpass server ${index + 1}/${servers.length}: ${server}`;
            console.log(tryingMessage);

            // Show the same message below the loading spinner while it is visible
            const loadingAnimationText = document.querySelector("#loading-animation-text");
            if (!loadingAnimationText.classList.contains("hide")) {
                loadingAnimationText.innerText = tryingMessage;
            }

            return fetch(url, { signal: signal })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    console.log(`Successfully connected to Overpass server: ${server}`);
                    return response.text();
                })
                .catch(error => {
                    // If this is an abort error, re-throw it
                    if (error.name === 'AbortError') {
                        throw error;
                    }
                    // If there are more servers to try, try the next one
                    if (index < servers.length - 1) {
                        console.warn(`Failed to fetch from ${server}, trying next server...`, error.message);
                        return tryServer(index + 1);
                    }
                    // No more servers to try, throw the error
                    throw new Error(`All Overpass servers failed. Last error: ${error.message}`);
                });
        };

        return tryServer(0);
    }

    // Use the fallback fetch function
    fetchWithFallback(overpassServers, overpass_query, signal)
        .then(text => new window.DOMParser().parseFromString(text, "text/xml")) // Parse the text as XML
        .then(function (data) { // SUCCESS callback - 'data' is now the parsed XML Document
            // Check if aborted before processing (already done after fetch, but good to keep)
            if (signal.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }
            // console.log('Parsed Overpass XML:', data); // Optional: check the parsed data
            let newData = document.implementation.createDocument(null, 'osm');
            let oldData = document.implementation.createDocument(null, 'osm');
            allOverpassXMLDataElements = data.querySelectorAll('action');
            // console.log(allOverpassXMLDataElements);
            //Separate changed (new) and pre-change (old) OSM map data into respective xml objects
            for (let i = 0; i < allOverpassXMLDataElements.length; i++) {
                const element = allOverpassXMLDataElements[i];
                // console.log(element);
                switch (element.getAttribute('type')) {
                    case 'create':
                        newData.documentElement.appendChild(element.querySelector("*").cloneNode(true));//cloneNode needed to keep "data" unchanged
                        break;
                    case 'modify':
                    case 'delete':
                        var newElement = element.querySelector('new > *').cloneNode(true);//cloneNode needed to keep "data" unchanged
                        var oldElement = element.querySelector('old > *').cloneNode(true);
                        // fake changeset id on new data
                        var newestTs = +new Date(newElement.getAttribute("timestamp"));
                        if (newElement.tagName == 'way') {
                            // inherit meta data from newest child node
                            var nodes = newElement.getElementsByTagName('nd');
                            for (var j = 0; j < nodes.length; j++) {
                                var nodeId = nodes[j].getAttribute('ref');
                                var node = newData.querySelector('node[id="' + nodeId + '"]');
                                if (node === null) continue;
                                var nodeTs = +new Date(node.getAttribute("timestamp"));
                                if (nodeTs > newestTs) {
                                    newElement.setAttribute('changeset', node.getAttribute('changeset'));
                                    newElement.setAttribute('user', node.getAttribute('user'));
                                    newElement.setAttribute('uid', node.getAttribute('uid'));
                                    newElement.setAttribute('timestamp', node.getAttribute('timestamp'));
                                }
                            }
                        }
                        // fake changeset meta data on old data
                        oldElement.setAttribute('changeset', newElement.getAttribute('changeset'));
                        oldElement.setAttribute('user', newElement.getAttribute('user'));
                        oldElement.setAttribute('uid', newElement.getAttribute('uid'));
                        oldElement.setAttribute('timestamp', newElement.getAttribute('timestamp'));

                        // add node to 'newData' and 'oldData'
                        if (element.getAttribute('type') == 'modify')
                            newData.documentElement.appendChild(newElement);
                        oldData.documentElement.appendChild(oldElement);
                }
            }

            const newGeojson = osmtogeojson.toGeojson(newData);
            const oldGeojson = osmtogeojson.toGeojson(oldData);

            // Add a property to old features to identify them later for styling purposes
            oldGeojson.features.forEach(function (feature) {
                feature.properties.__is_old__ = true;
            });

            //Combine old and new GeoJSON into one
            let allGeojsonFeatures = [].concat(oldGeojson.features).concat(newGeojson.features);
            // console.log(allGeojsonFeatures);

            // In rare edge cases the reference to an old node in a way might be missing in the overpass data which leads to osmtogeojson returning Null coordinates.
            // The creation of the Leaflet layer will fail when Null coordinates are present ('Error: Invalid LatLng object: (NaN, NaN)'). Thus we filter them out here.
            // Filter out features that contain null coordinates
            allGeojsonFeatures = allGeojsonFeatures.filter(feature => {
                // Check for null values within the coordinates array, handling nested arrays for Polygons/MultiLineStrings
                const nullCoordsFound = JSON.stringify(feature.geometry.coordinates).includes('null')
                if (nullCoordsFound) console.log("Feature with null coordinates found. This feature will not be displayed in the results:", feature);
                // Filter the feature if null coordinates have been found, i.e. 'nullcoordsFound' is true
                // (The .filter() method filters an item out if the expression evaluates to false. Thus we return the inverse of 'nullCoordsFound')
                return !nullCoordsFound;
            });

            //Sort allGeojsonFeatures before writing it into the changesets object
            allGeojsonFeatures.sort(sortGeoJsonFeatures); // Sort features before creating the Leaflet GeoJSON layer

            //Options to create the GeoJSON layers on the map
            const sharedGeoJsonOptions = {
                onEachFeature: onEachFeature,
                style: setStyle,
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, { radius: 8 });
                }
            };

            //Add all GeoJSON features to the map and store them in the changesets object
            changesets.allLeafletLayers = L.geoJSON(allGeojsonFeatures, sharedGeoJsonOptions).addTo(map);

            //Define what functionality is given to each polygon/way/marker
            function onEachFeature(feature, layer) {
                // console.log(layer);

                // Traverse all the layers that have been added to the map and create an entry for each changeset in 'changesets'
                // Create a logical featureGroup for each changeset (not added to the map directly).
                // This featureGroup can later be used to color all layers at once.

                // Guard against features without changeset meta, which can happen if osmtogeojson couldn't associate them
                if (!layer.feature.properties.meta || !layer.feature.properties.meta.changeset) {
                    // console.warn("Feature without changeset meta:", l.feature);
                    return;
                }
                const changesetNumber = layer.feature.properties.meta.changeset;

                if (changesets[changesetNumber] === undefined) {
                    //Note: The color for each changeset is calculated twice - here and in setStyle(). Not very clean. See if this redundancy can somehow be removed.
                    const color = defineColor(new Date(layer.feature.properties.meta.timestamp));
                    // console.log(color);

                    changesets[changesetNumber] = {
                        color,
                        comment: '',
                        deletedFeatures: [],
                        deltaInIdWarningsAndResolves: 0, // Initialize
                        deltaInNodesWays: 0,
                        deltaInTags: 0,
                        discussionCount: 0, // Initialize
                        id: changesetNumber,
                        imageryUsed: [],
                        leafletFeatureGroup: L.featureGroup(), // Logical group, not added to map
                        osmEditor: '',
                        possibleVandalism: false,
                        time: new Date(layer.feature.properties.meta.timestamp),
                        user: layer.feature.properties.meta.user,
                        userId: layer.feature.properties.meta.uid
                    };
                }
                //Add the layer to their respective changeset feature groups in changesets
                changesets[changesetNumber].leafletFeatureGroup.addLayer(layer);

                // Assign a unique layer ID to each Leaflet layer using the OSM feature ID, appended with 'o' for old features and 'n' for new ones.
                const OsmIdOfHoveredElement = feature.properties.id;//OSM element ID
                const isOld = feature.properties.__is_old__;
                layer._leaflet_id = OsmIdOfHoveredElement + (isOld ? 'o' : 'n');

                //Define what happens on mouseover: Increase line weight when feature gets focus. Also highlight twin element if feature has been moved
                layer.on('mouseover', function (e) {
                    // console.log(layer);
                    layer.setStyle({ weight: 6 }); //increase line weight of hovered layer
                    //Now we check if the hovered element got modified (i.e. not deleted nor created).
                    //Write both XML nodes of old and new element into variable "xmlElements"
                    const xmlElements = data.querySelectorAll('[id="' + OsmIdOfHoveredElement + '"]');
                    // console.log(xmlElements);
                    // Guard against missing elements or parent structure
                    if (!xmlElements || xmlElements.length === 0 || !xmlElements[0].parentNode || !xmlElements[0].parentNode.parentNode) return;
                    const action = xmlElements[0].parentNode.parentNode.getAttribute('type');
                    // console.log(action);
                    //Check if action is 'modify'. If yes: Highlight non-hovered twin element of nodes, lines and polygons as well. Skip unmoved elements.
                    if (action === 'modify') {
                        // console.log('Modify! Highlight non-hovered twin element as well (i.e. old or new version). If the element is a node: Only highlight twin element if node has been moved');

                        //First check if element is a node. If it is: Check if coordinates have changed. If yes: Highlight twin node. If no: stop function execution (no need to traverse layer object and waste resources)
                        if (xmlElements[0].tagName === "node") {
                            // console.log('This is a NODE! Now check if the node has been moved');
                            const latEl0 = xmlElements[0].getAttribute('lat');
                            const latEl1 = xmlElements[1].getAttribute('lat');
                            const lonEl0 = xmlElements[0].getAttribute('lon');
                            const lonEl1 = xmlElements[1].getAttribute('lon');
                            if (latEl0 !== latEl1 || lonEl0 !== lonEl1) {
                                // console.log('Coordinates of old and new node are NOT identical --> node has been moved! Highlight twin element.');
                                // Get the Leaflet layer of the twin element. It shares the same ID number but has the opposite suffix from the hovered element.
                                const leafletLayerOfTwin = changesets.allLeafletLayers.getLayer(OsmIdOfHoveredElement + (isOld ? 'n' : 'o'));

                                if (!leafletLayerOfTwin) {
                                    // console.log('Twin element is not available. This usually means that 1. The node is part of way 2. The old version of the node had no tags. "osmtogeojson" will NOT convert those nodes into GeoJSON');
                                    return;
                                }
                                highlightTwinElementLocation(layer, leafletLayerOfTwin);
                            }
                        }
                        //All other elements (i.e. lines and polygons): Highlight twin element if the geometry has been changed.
                        //A way to check if a line or polygon has been changed is to compare the length of new and old element.
                        //If there is a difference the element has been changed. Solution below is from https://github.com/tyrasd/geojson-length.
                        else if (xmlElements[0].tagName === "way") {
                            // Get the Leaflet layer of the twin element. It shares the same ID number but has the opposite suffix from the hovered element.
                            const leafletLayerOfTwin = changesets.allLeafletLayers.getLayer(OsmIdOfHoveredElement + (isOld ? 'n' : 'o'));
                            // console.log('Name of leafletLayerOfTwin: ' + OsmIdOfHoveredElement + (isOld ? 'n' : 'o'));
                            if (!leafletLayerOfTwin) return; // Return if there is no twin. Should never happen.

                            // Compare length and position of hovered and twin element. Check if comparison for those features has happened before.
                            // If yes: Use stored value. If no: calculate and store result in layer.
                            const geometryIsDifferent =
                                layer.feature.geometryIsDifferent !== undefined
                                    ? layer.feature.geometryIsDifferent
                                    : (
                                        // Execute length comparison and write result into 'feature.geometryIsDifferent' property of new and old layer.
                                        // For subsequent calls the length calculation does not have to be performed again
                                        layer.feature.geometryIsDifferent =
                                        leafletLayerOfTwin.feature.geometryIsDifferent =
                                        checkIfLengthOfLineOrPolygonHasChanged(layer, leafletLayerOfTwin)
                                    );
                            // console.log(layer.feature, leafletLayerOfTwin.feature);
                            // If the geometry of old and new layers are different highlight the twin layer.
                            if (geometryIsDifferent) highlightTwinElementLocation(layer, leafletLayerOfTwin);
                        }
                    }
                });

                //Change line weight back when feature loses focus
                layer.on('mouseout', function (e) {
                    layer.setStyle({ weight: 3 });
                    // The highlightTwinElementLocation function handles resetting the twin's style more comprehensively
                });
            }

            //Define style of GeoJSON elements
            function setStyle(f) {
                // console.log('setStyle called');
                const cs = changesets[f.properties.meta.changeset];
                return {
                    // If specific color has already been defined in the 'changesets' object then use it. Else calculate in defineColor()
                    // setStyle() is also called when using .resetStyle(). By saving the color in 'changesets' we can make sure that
                    // the whole defineColor() does not have to be re-executed on .resetStyle().
                    color: cs?.color !== undefined //"If cs exists, and it has a color property, use it. Otherwise, fall back."
                        ? cs.color
                        : defineColor(new Date(f.properties.meta.timestamp)),
                    opacity: f.properties.__is_old__ === true ? 0.2 : 1,
                    weight: 3
                }
            };

            //Change app display from "loading" to "ready"
            d3.select('#map').classed('faded', false);
            toggleWaitingScreen();

            //Display filter changesets toolbar
            document.querySelector(".filter-container").classList.remove("hide");
            //Remove content of "filter changeset input" and hide X (in case old text from a previous download is still there)
            document.querySelector(".search-changesets-field").value = "";
            document.querySelector(".delete-filter-input").classList.add("hide");
            //Reset display of "filter-red-checkbox" (in case it has been checked on a previous download)
            document.querySelector(".traffic-light-filter").classList.add("filter-red-color");
            document.querySelector("#filter-red-checkbox").checked = false;

            //Compare length and position of hovered and twin element.
            //return true: Geometry has been changed
            //return false: Geometry is unchanged
            function checkIfLengthOfLineOrPolygonHasChanged(leafletLayerOfHoveredElement, leafletLayerOfTwin) {
                // console.log('checkIfLengthOfLineOrPolygonHasChanged called');
                /*
                //The length check can be computationally demanding on complex LineStrings and polgyons. Thus simply highlight all
                //twin elements - regardless of whether the geometry has been changed or not - if node count is greater than 50.
                //Check if node count of line/polygon is greater than 50. if yes just highlight twin without measuring
                const nNodes = xmlElements[0].getElementsByTagName('nd').length;
                // console.log(nNodes);
                if (nNodes > 50) {
                    // console.log('Node count is large (>50). So skip the length comparison and highlight twin geometry no matter if there is a length difference or not.');
                    highlightTwinElementLocation(layer, leafletLayerOfTwin);
                    return;
                };
                */

                //Helper function to determine if the geometry is a LineString or Polygon and return the appropriate coordinate path.
                const getCoordinates = layer =>
                    layer.feature.geometry.type === 'LineString'
                        ? layer.feature.geometry.coordinates
                        : layer.feature.geometry.coordinates[0]; // For Polygons

                //Calculate length of both elements
                const coordinatesOfHoveredElement = getCoordinates(leafletLayerOfHoveredElement);
                // console.log(coordinatesOfHoveredElement);
                const coordinatesOfTwinElement = getCoordinates(leafletLayerOfTwin);
                // console.log(coordinatesOfTwinElement);

                //Do a first quick check of the first coordinate. If the first coordinate of hovered and twin element is more than 1m apart:
                //Highlight twin element. Note: This quick check produces false positives for ways with reversed direction.
                // console.log(`Distance between first nodes: ${distance(coordinatesOfHoveredElement[0][0], coordinatesOfHoveredElement[0][1], coordinatesOfTwinElement[0][0], coordinatesOfTwinElement[0][1])}`);
                if (distance(coordinatesOfHoveredElement[0][0], coordinatesOfHoveredElement[0][1], coordinatesOfTwinElement[0][0], coordinatesOfTwinElement[0][1]) > 1) return true;

                //If they are identical do a more thorough length comparison.
                //Get length of hovered element
                const lengthOfHoveredElement = calculateLength(coordinatesOfHoveredElement);
                // console.log('lengthOfHoveredElement: ' + lengthOfHoveredElement);

                //Get length of twin element
                const lengthOfTwinElement = calculateLength(coordinatesOfTwinElement);
                // console.log('lengthOfTwinElement: ' + lengthOfTwinElement);

                //Compare the two. First round to 0.1 meters. If length is different: Highlight twin element.
                // console.log('lengthOfHoveredElement (rounded): ' + +lengthOfHoveredElement.toFixed(1));
                if (+lengthOfHoveredElement.toFixed(1) !== +lengthOfTwinElement.toFixed(1)) {
                    // console.log('The elements have different lengths, thus the geometry most probably got changed. Highlight the twin element.');
                    return true;
                }

                //Else it can be assumed that the geometry is unchanged. Do not highlight twin element.
                else return false;

                //Calculate length of LineString or polygon. Needed to compare 2 LineStrings or polygons to see if they have different lengths
                function calculateLength(lineString) {
                    // console.log(lineString);
                    if (lineString.length < 2)
                        return 0;
                    let result = 0;
                    for (let i = 1; i < lineString.length; i++) {
                        // console.log(result);
                        result += distance(lineString[i - 1][0], lineString[i - 1][1],
                            lineString[i][0], lineString[i][1]);
                    }
                    return result;
                }

                /**
                 * Calculate the approximate distance between two coordinates (lat/lon)
                 * Further explanation see /doc/Equirectangular_Distance_Explanation.md
                 * © Chris Veness, MIT-licensed,
                 * http://www.movable-type.co.uk/scripts/latlong.html#equirectangular
                 */
                function distance(λ1, φ1, λ2, φ2) {
                    const R = 6371000;
                    const Δλ = (λ2 - λ1) * Math.PI / 180;
                    φ1 = φ1 * Math.PI / 180;
                    φ2 = φ2 * Math.PI / 180;
                    const x = Δλ * Math.cos((φ1 + φ2) / 2);
                    const y = (φ2 - φ1);
                    const d = Math.sqrt(x * x + y * y);
                    return R * d;
                };
            }

            //Highlight the non-hovered twin element (i.e. the new or old geometry) as well.
            function highlightTwinElementLocation(leafletLayerOfHoveredElement, leafletLayerOfTwin) {
                let count = 3;
                let direction = 1; // 1 for counting up, -1 for counting down

                //if it is blue: change back to blue on mouseout, else change back to shade of red
                const preHoverColor = leafletLayerOfTwin.options.color;
                //console.log('%c Pre-hover color: ' + preHoverColor + '', 'background: ' + preHoverColor + '; color: #000000');

                const interval = setInterval(function () {
                    if (count === 10) {
                        direction = -1; // Change direction to count down
                    } else if (count === 3) {
                        direction = 1; // Change direction to count up
                    }

                    count += direction; // Increment or decrement count based on direction

                    // Set the weight property dynamically
                    leafletLayerOfTwin.setStyle({
                        color: '#ff9900',//Highlight twin geometry in a bright orange
                        opacity: 1,
                        weight: count
                    });

                }, 100); // Change the interval duration (in milliseconds) as needed

                // Clear the interval when mouse is not hovering
                leafletLayerOfHoveredElement.once('mouseout', function () {
                    //'Once' is needed to remove the mouseout event listener after execution. Else multiple mouseout
                    //event listeners are created on each mouseover event. This would lead to the following situation:
                    //This mouseout function would be called multiple times on subsequent mouseouts,
                    //e.g. after 'mouseovering' over the same element the 6th time this mouseout function is called 6 times instead of once.

                    // console.log('clearInterval called!');
                    clearInterval(interval);//stop oscillation of line weight

                    //Reset style of oscillating geometry, i.e. line weight back to 3, opacity back to previous value and color back shade of red
                    changesets.allLeafletLayers.resetStyle(leafletLayerOfTwin);

                    //If this geometry belongs to highlighted changeset --> change it back to the highlighting color (i.e. blue)
                    if (preHoverColor === '#008dff') {
                        // console.log('%c The color is blue! ', 'background: ' + preHoverColor + '; color: #000000', 'So change color back to blue');
                        leafletLayerOfTwin.setStyle({
                            color: '#008dff',//Change color of twin geometry back to blue
                        });
                    }
                });
            }

            // Attach click listener to the main GeoJSON layer
            changesets.allLeafletLayers.on('click', function (e) {
                //Highlight clicked layer on map and in sidebar
                click(e.layer.feature, null); // Pass feature as first arg, null for d to match signature
                //Scroll selected element into view in sidebar
                //(Only on large screens. On small screens the map would scroll out of view, which is annoying)
                if (screen.width > 600) {
                    const activeEl = document.querySelector('.active');
                    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth' });
                }

                const tableHtml = createTable(e.layer.feature.properties.id)
                let mapContainer = document.querySelector(".map-container");

                //Popup with tag comparison table
                L.popup({
                    maxWidth: mapContainer.clientWidth - 45,
                    maxHeight: mapContainer.clientHeight - 40,
                    className: "stylePopup"
                })
                    .setLatLng(e.latlng)
                    .setContent(tableHtml)
                    .openOn(map);
            });

            // Expose createTable to global scope so sidebar clicks can use it (i.e. clicking on the button of a deleted feature in order to center map and open popup)
            // 'window' allows the function to "remember" the specific data variable from the specific fetch request that created it.
            window.createTagComparisonTable = createTable;

            //Create tag comparison table
            function createTable(id) {
                const node = data.querySelectorAll('[id="' + id + '"]');
                //First check what type of action has been performed on the element (i.e. create, modify, delete)
                let action = node[0].parentNode.parentNode.getAttribute('type');//Check if action is "modify", "delete" or "null"
                if (!action) action = "create";//The xml data structure is different for "create" nodes, thus action will be "null" in the line above
                // console.log(action);

                // Helper functions to create OSM wiki links from OSM tags and URL links if URL is detected
                // Creation of link from key (e.g. highway --> link to OSM wiki page of "Key:highway")
                function linkKey(k) {
                    const url = `https://wiki.openstreetmap.org/wiki/Key:${encodeURIComponent(k)}`;
                    return `<a title="Go to OSM Wiki page of this tag"href="${url}" target="_blank" rel="noopener noreferrer">${k}</a>`;
                };

                // Creation of link from value (e.g. motorway --> link to OSM wiki page of "Value:highway=motorway" or linkify URL)
                function linkValue(k, v) {
                    if (!v || v === "") return "";

                    // 1. Direct URL keys: treat the whole value as a link
                    if (/^(website|contact:website|url|image|mapillary|flickr)$/i.test(k)) {
                        let url = v;
                        // Prepend http:// if missing (for www. entries in website tags)
                        if (!/^https?:\/\//i.test(url) && !/^ftp:\/\//i.test(url)) {
                            url = 'http://' + url;
                        }
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${v}</a>`;
                    }

                    // 2. Free text fields that might CONTAIN URLs: use linkify()
                    if (/^(note|description|comment|source|fixme|todo|opening_hours|color|contact)/i.test(k)) {
                        return linkify(escapeHtml(v));
                    }

                    // 3. Wikidata id's
                    // Matches any key containing 'wikidata' (e.g. 'wikidata', 'brand:wikidata', 'operator:wikidata')
                    if (/wikidata/i.test(k)) {
                        const url = `https://www.wikidata.org/wiki/${v}`;
                        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${v}</a>`;
                    }

                    // 4. Wikipedia links
                    // Matches any key containing 'wikipedia' (e.g. 'wikipedia', 'brand:wikipedia')
                    // Expected value format: "lang:Page Name" (e.g. "en:London" or "de:München")
                    if (/wikipedia/i.test(k)) {
                        // Split by the first colon to separate language code from page title
                        const parts = v.split(':');
                        if (parts.length >= 2) {
                            const lang = parts[0];
                            // Join the rest back together in case the title itself contains colons,
                            // trim whitespace, and replace spaces with underscores for the URL.
                            const page = parts.slice(1).join(':').trim().replace(/ /g, "_");
                            // encodeURIComponent ensures special characters (like accents) are handled correctly
                            const url = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page)}?uselang=en`;
                            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${v}</a>`;
                        }
                    }

                    // 5. Skip Wiki linking for names, refs, phones, emails, addr:*, numeric values, etc.
                    const isNoWikiLink = /^(name|note|description|comment|source|ref|phone|mobile|website|email|addr:|tiger:|gnis:|created_by|fixme|todo|opening_hours|color|operator|contact:|start_date|brand|disused:|demolished:|branch|check_date)/i.test(k) || !isNaN(v.replace(",", "."));

                    if (isNoWikiLink) {
                        return v;
                    }

                    // 6. Default: OSM Wiki Link
                    const url = `https://wiki.openstreetmap.org/wiki/Tag:${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
                    return `<a title="Go to OSM Wiki page of this tag" href="${url}" target="_blank" rel="noopener noreferrer">${v}</a>`;
                };

                //Create header with type of action (i.e. create, modify or delete), type of element (i.e. node or way), OSM id and link to 'OSM Deep History'.
                let tableHtml = `
                    <span class="${action} capitalize">${action}</span>
                    ${node[0].nodeName}
                    <a href="https://www.openstreetmap.org/${node[0].nodeName}/${node[0].getAttribute("id")}" target="_blank" rel="noopener noreferrer">${node[0].getAttribute("id")}</a>
                    <a href="http://osmlab.github.io/osm-deep-history/#/${node[0].nodeName}/${node[0].getAttribute("id")}" title="Get complete history of element in 'OSM Deep History'" target="_blank" rel="noopener noreferrer">
                        <svg class="clock-with-circular-arrow-symbol"><use href="img/icons.svg#clock-with-circular-arrow"></use></svg>
                    </a>
                    <table class="tag-table-container">
                `;

                //Object with all key-value pairs for new and old feature and relevant meta tags for table
                const keyvalues = { old: { meta: {}, tags: {} }, new: { meta: {}, tags: {} } };

                //1 CREATE
                if (action === "create") {
                    //Copy meta tags
                    const keysNew = node[0].querySelectorAll("tag");

                    //Create table
                    tableHtml += `
                        <thead>
                            <tr>
                                <th>Tag</th>
                                <th>New</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr class="metatags">
                                <td>version</td>
                                <td>${node[0].getAttribute("version")}</td>
                            </tr>
                            <tr class="metatags">
                                <td>timestamp</td>
                                <td>${moment(node[0].getAttribute("timestamp")).fromNow()}</td>
                            </tr>
                            <tr class="metatags">
                                <td>user</td>
                                <td>
                                    <a title="Go to OSM user page of ${node[0].getAttribute("user")}" target="_blank" href="//openstreetmap.org/user/${node[0].getAttribute("user")}">${node[0].getAttribute("user")}</a>
                                </td>
                            </tr>
                    `;

                    for (let i = 0; i < keysNew.length; i++) {
                        const k = keysNew[i].getAttribute('k');
                        const v = keysNew[i].getAttribute('v');
                        tableHtml += `
                            <tr class="create">
                                <td>${linkKey(k)}</td>
                                <td>${linkValue(k, v)}</td>
                            </tr>
                        `;
                    }
                }

                //2 MODIFY/DELETE
                else {
                    //Create Set with all unique key-values from old and new
                    const uniqueKeysSet = new Set();
                    //Start with old
                    //Copy meta tags
                    keyvalues.old.meta["version"] = node[0].getAttribute("version");
                    keyvalues.old.meta["timestamp"] = moment(node[0].getAttribute("timestamp")).fromNow();
                    keyvalues.old.meta["user"] = node[0].getAttribute("user");
                    const keysOld = node[0].querySelectorAll("tag");
                    for (let i = 0; i < keysOld.length; i++) {
                        keyvalues.old.tags[keysOld[i].getAttribute('k')] = keysOld[i].getAttribute('v');
                        uniqueKeysSet.add(keysOld[i].getAttribute('k'));
                    }
                    //Continue with new
                    //Copy meta tags
                    keyvalues.new.meta["version"] = node[1].getAttribute("version");
                    keyvalues.new.meta["timestamp"] = moment(node[1].getAttribute("timestamp")).fromNow();
                    keyvalues.new.meta["user"] = node[1].getAttribute("user");
                    const keysNew = node[1].querySelectorAll("tag");
                    for (let i = 0; i < keysNew.length; i++) {
                        keyvalues.new.tags[keysNew[i].getAttribute('k')] = keysNew[i].getAttribute('v');
                        uniqueKeysSet.add(keysNew[i].getAttribute('k'));
                    }
                    // console.log(keyvalues);
                    //Create array in which all keys are ordered alphabetically
                    const uniqueKeysArr = Array.from(uniqueKeysSet).sort();
                    // console.log(uniqueKeysArr);

                    //Create table
                    tableHtml += `
                            <thead>
                                <tr>
                                    <th>Tag</th>
                                    <th>Old</th>
                                    <th>New</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr class="metatags">
                                    <td>version</td>
                                    <td>${keyvalues.old.meta["version"]}</td>
                                    <td>${keyvalues.new.meta["version"]}</td>
                                </tr>
                                <tr class="metatags">
                                    <td>timestamp</td>
                                    <td>${keyvalues.old.meta["timestamp"]}</td>
                                    <td>${keyvalues.new.meta["timestamp"]}</td>
                                </tr>
                                <tr class="metatags">
                                    <td><div>user</td>
                                    <td>
                                        <a title="Go to OSM user page of ${keyvalues.old.meta["user"]}" target="_blank" href="//openstreetmap.org/user/${keyvalues.old.meta["user"]}">${keyvalues.old.meta["user"]}</a>
                                    </td>
                                    <td>
                                        <a title="Go to OSM user page of ${keyvalues.new.meta["user"]}" target="_blank" href="//openstreetmap.org/user/${keyvalues.new.meta["user"]}">${keyvalues.new.meta["user"]}</a>
                                    </td>
                                </tr>
                            `;

                    //Traverse uniqueKeysArray and check in object which value this key has in new and old
                    for (let i = 0; i < uniqueKeysArr.length; i++) {
                        const key = uniqueKeysArr[i];
                        let oldTag = keyvalues.old.tags[key];
                        let newTag = keyvalues.new.tags[key];
                        let cssClass;
                        //Case 1: Tag deleted in new --> Background color red, change from "undefined" to ""
                        if (!newTag) {
                            cssClass = "delete";
                            newTag = "";
                        }
                        //Case 2: Tag created in new --> Background color green, change from "undefined" to ""
                        else if (!oldTag) {
                            cssClass = "create";
                            oldTag = "";
                        }
                        //Case 3: Tag different in new --> Background color yellow
                        else if (oldTag !== newTag) cssClass = "modify";

                        //Case 4: Tags similar --> Default (i.e. no) background color
                        else cssClass = "unchanged";

                        tableHtml += `
                            <tr ${(cssClass ? 'class=' + cssClass : '')}>
                                <td>${linkKey(key)}</td>
                                <td>${linkValue(key, oldTag)}</td>
                                <td>${linkValue(key, newTag)}</td>
                            </tr>
                        `;
                    }
                }

                tableHtml += `
                    </tbody>
                        </table>
                `;

                //Create link to edit geometry in iD editor (only if element has not been deleted - deleted elements cannot be edited)
                if (action !== "delete") {
                    tableHtml += `<a href="https://www.openstreetmap.org/edit?${node[0].nodeName}=${node[0].getAttribute("id")}" target="_blank" rel="noopener noreferrer">Edit in iD</a>`;
                }

                return tableHtml;
            }

            // --- Start of the second async API call ---
            // Download changeset text and changeset comment count from OSM API.
            // Once done render changesets list on the left side

            //Write changeset id's in an array. This is used to create URL for API call.
            const changesetIds = [];
            for (const key in changesets) {
                changesetIds.push(key);
            }
            // console.log(changesetIds);

            const promises = []; // Array to hold promises for changeset details
            const fetchChangesetBatch = (ids) => {
                const url = debugMode
                    ? "./examples/exampleOSMAPI.xml" // Handle debug mode (only makes one request)
                    : 'https://api.openstreetmap.org/api/0.6/changesets?changesets=' + ids.join(',');

                // Use fetch, check response, parse XML
                return fetch(url, { signal: signal }) // Return the promise chain
                    .then(response => {
                        if (!response.ok) { // Check if the HTTP request was successful
                            throw new Error(`HTTP error fetching changeset details! Status: ${response.status} ${response.statusText || ''} URL: ${url}`);
                        }
                        return response.text(); // Get the response body as text
                    })
                    .then(text => new window.DOMParser().parseFromString(text, "text/xml")); // Parse the text as XML
            };
            //Load a local example file if debug mode is on. If not call the OSM API.
            if (debugMode) {
                promises.push(fetchChangesetBatch([])); // Pass empty array if URL is fixed
            } else {
                //Fetch data from OSM database. If there are more than 100 changesets to query make multiple API requests with a hundred CS each.
                while (changesetIds.length > 0) {
                    promises.push(fetchChangesetBatch(changesetIds.splice(0, 100)));
                }
            }
            // Use Promise.all to wait for all changeset detail requests
            return Promise.all(promises); // IMPORTANT: Return this promise to chain correctly
            // --- End of the second async operation ---

        }) // This .then() receives the result of Promise.all(promises)
        .then(function (xmls) { // SUCCESS callback for the *second* async operation (Promise.all)
            // Check if aborted before processing results
            if (signal.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }
            // console.log(xmls);
            // 'xmls' is the array of parsed XML documents from the changeset details
            // the forEach below is needed if there have been more than 100 changesets fetched and the length of the xmls array is > 1.
            xmls.forEach(function (xmlDoc) {
                // console.log(xmlDoc);
                const css = xmlDoc.getElementsByTagName('changeset');
                // console.log(css);
                for (let i = 0; i < css.length; i++) {
                    const cid = css[i].getAttribute('id');
                    if (changesets[cid]) { // Check if changeset exists in our main object
                        //Write discussion count to changesets object after converting it to a number
                        changesets[cid].discussionCount = +css[i].getAttribute("comments_count");
                        //Write changeset comment to changesets object
                        const commentTag = css[i].querySelector('tag[k="comment"]');
                        if (commentTag) changesets[cid].comment = commentTag.getAttribute('v');

                        //Get sum of warnings and resolved iD warnings for each changeset and write the delta into changesets object
                        // console.log(css[i]);
                        const tagsWithResolvedIdWarnings = css[i].querySelectorAll('tag[k^="resolved"]');
                        const nIdResolvedWarnings = getSumOfiDWarningsAndResolvedWarnings(tagsWithResolvedIdWarnings);
                        const tagsWithIdWarnings = css[i].querySelectorAll('tag[k^="warning"]');
                        const nIdWarnings = getSumOfiDWarningsAndResolvedWarnings(tagsWithIdWarnings);

                        function getSumOfiDWarningsAndResolvedWarnings(tagsWithWarnings) {
                            let counter = 0;
                            tagsWithWarnings.forEach(tag => { // Use the passed parameter
                                const value = +tag.getAttribute('v');
                                // console.log(value);
                                counter += value;
                            });
                            return counter;
                        }
                        changesets[cid].deltaInIdWarningsAndResolves = nIdResolvedWarnings - nIdWarnings;

                        //Get name of used OSM editor
                        const osmEditorTag = css[i].querySelector('tag[k="created_by"]');
                        if (osmEditorTag)
                            changesets[cid].osmEditor = osmEditorTag.getAttribute('v');

                        //Write the names of the used satellite imagery providers into changeset object
                        const imageryUsedTag = css[i].querySelector('tag[k="imagery_used"]');
                        const sourceTag = css[i].querySelector('tag[k="source"]');

                        const imageryUsedValue = imageryUsedTag?.getAttribute('v') || "";
                        const sourceValue = sourceTag?.getAttribute('v') || "";

                        // Combine both strings with a semicolon (only if both are non-empty)
                        const combined = [imageryUsedValue, sourceValue]
                            .filter(s => s.trim() !== "")  // remove empty strings
                            .join(';');

                        const imageryUsedArray = combined
                            .split(';')
                            .map(s => s.trim())
                            .filter(s => s); // final cleanup

                        // console.log(cid + ': ' + imageryUsedArray + ' length: ' + imageryUsedArray.length);
                        // console.log(imageryUsedArray);
                        changesets[cid].imageryUsed = imageryUsedArray;
                    }
                }
            });

            /*Vandalism Checker
            Simple sanity checker for all the downloaded changesets. 3 things are checked:
            1. It summarizes the number of all elements which have been added or deleted
            2. It summarizes the number of all tags which have been added or deleted
            3. It summarizes the number of all iD warnings and resolved iD warnings
            for each changeset. If the sum is below a certain treshold (currently -3) then a traffic light changes to red to alert the user
            about this changeset.*/
            function vandalismChecker() {
                // console.log(elements);
                for (let i = 0; i < allOverpassXMLDataElements.length; i++) {
                    //Get type, i.e. "create", "modify" or "delete"
                    const type = allOverpassXMLDataElements[i].getAttribute("type");
                    // console.log(type);

                    //Get changeset number
                    let changesetNumber;
                    if (type === "create") changesetNumber = allOverpassXMLDataElements[i].lastElementChild.getAttribute("changeset");
                    else changesetNumber = allOverpassXMLDataElements[i].lastElementChild.firstElementChild.getAttribute("changeset");
                    // console.log(changesetNumber);

                    if (changesets[changesetNumber]) { // Check if changeset exists in our main object
                        //Check which action is performed
                        //"Create"
                        //deltaInNodesWays++
                        //deltaInTags += nTagsAdded
                        if (type === "create") {
                            //Check the amount of tags that have been added
                            const nTagsAdded = allOverpassXMLDataElements[i].lastElementChild.querySelectorAll("tag").length;
                            // console.log(nTagsAdded);
                            changesets[changesetNumber].deltaInTags += nTagsAdded;

                            //If a node with 0 tags has been created: Do not add it to deltaInNodesWays
                            //(normally it is just a newly created node of an already existing way)

                            //Get element type (i.e. "node" or "way")
                            const elementType = allOverpassXMLDataElements[i].firstElementChild.nodeName;
                            // console.log(elementType);

                            if (elementType === "node" && nTagsAdded == 0) continue;
                            else changesets[changesetNumber].deltaInNodesWays++;
                        }

                        // "Modify"
                        //deltaInNodesWays = unchanged
                        //deltaInTags += nTagsNew - nTagsOld
                        if (type === "modify") {
                            const nTagsNew = allOverpassXMLDataElements[i].lastElementChild.firstElementChild.querySelectorAll("tag").length;
                            const nTagsOld = allOverpassXMLDataElements[i].firstElementChild.firstElementChild.querySelectorAll("tag").length;
                            // console.log(nTagsNew);
                            // console.log(nTagsOld);
                            changesets[changesetNumber].deltaInTags += (nTagsNew - nTagsOld);
                        }

                        // "Delete"
                        //deltaInNodesWays--
                        //deltaInTags -= nTags
                        if (type === "delete") {
                            // The 'old' element in a delete action is under element.firstElementChild.firstElementChild
                            const oldElementNode = allOverpassXMLDataElements[i].firstElementChild.firstElementChild;
                            const nTagsDeleted = oldElementNode.querySelectorAll("tag").length;//Number of deleted tags
                            // console.log(nTagsDeleted);
                            changesets[changesetNumber].deltaInTags -= nTagsDeleted;

                            //Get element type (i.e. "node" or "way")
                            const elementType = oldElementNode.nodeName;
                            // console.log(elementType);

                            //If a node with 0 tags has been deleted: Do not subtract it from deltaInNodesWays
                            // (normally it is just a newly deleted node of an already existing way)
                            if (elementType === "node" && nTagsDeleted == 0) continue;
                            else {
                                //Decrement number of nodes/ways count
                                changesets[changesetNumber].deltaInNodesWays--;
                                //Add id of deleted feature to 'deletedFeatures' array within 'changesets' object
                                changesets[changesetNumber].deletedFeatures.push(oldElementNode.getAttribute("id"));
                            }
                        }
                    }
                }

                //Write boolean value 'possibleVandalims' into 'changesets'
                for (const changesetId in changesets) {
                    const cs = changesets[changesetId];
                    // console.log(changesetId);
                    //Check how many warnings and resolves iD editor produced.
                    // console.log("Changeset number: " + changesetId + ", deltaInIdWarningsAndResolves: " + cs.deltaInIdWarningsAndResolves);

                    if ((cs.deltaInNodesWays < vandalismThreshold) || (cs.deltaInTags < vandalismThreshold) || (cs.deltaInIdWarningsAndResolves < vandalismThreshold)) {
                        cs.possibleVandalism = true;
                    }
                }
            }

            // console.log(changesets);
            vandalismChecker();//Analyse each changeset and create boolean "possibleVandalism" within "changesets" object
            renderChangesetsList(changesets);//Render changesets list on the left side
            fetchAndDisplayUserDetails(changesets);//After the whole data is loaded and rendered download some 'nice-to-have' user data (total edits & sign-up date) and add it to the changeset information
            fetchAndDisplayChangesetDiscussions(changesets);//After the whole data is loaded and rendered download changeset discussions and add it to the changeset information
        })
        .catch(function (error) { // ERROR handler for ANY error in the Promise chain above
            if (error.name === 'AbortError') {
                console.log("Fetch aborted.");
                // Don't show a user error for deliberate aborts, just ensure UI is reset
                // (toggleWaitingScreen might already be handled if the abort happens early)
                // May need explicit UI reset here depending on state.
                d3.select('#map').classed('faded', false); // Un-fade map
                // Ensure loading animation is off if it was turned on
                const loadingAnimation = document.querySelector("#loading-animation");
                if (!loadingAnimation.classList.contains("hide")) {
                    toggleWaitingScreen();
                }

            } else {
                // Handle actual network or processing errors
                toggleWaitingScreen(); // Ensure loading screen is off
                console.error("Error fetching or processing data:", error); // Log the actual error
                message("alarm", "Server error: " + (error.message || "Could not load data."));
            }
        })
        .finally(() => {
            // Cleanup: Clear the controller reference ONLY if it's the one from this run
            if (window.currentAbortController && signal === window.currentAbortController.signal) {
                window.currentAbortController = null;
                // console.log("AbortController reference cleared.");
            }
        });
}

// --- Third API call: Fetch extended user details (total edits & sign-up date) from the OSM API and update the UI ---
function fetchAndDisplayUserDetails(changesetsToDisplay) {
    // 1. Collect all unique user IDs from the visible changesets
    const userIds = new Set();
    for (const id in changesetsToDisplay) {
        if (changesetsToDisplay[id] && changesetsToDisplay[id].userId) {
            userIds.add(changesetsToDisplay[id].userId);
        }
    }

    if (userIds.size === 0) return; // No users to fetch

    // 2. Form the URL for the OSM User API
    const userIdsArray = Array.from(userIds);
    const url = debugMode
        ? "./examples/exampleUsers.json" // Use a local file for debugging
        : `https://api.openstreetmap.org/api/0.6/users.json?users=${userIdsArray.join(',')}`;

    // 3. Fetch the data. This is a "nice-to-have" call, so we handle errors gracefully.
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error fetching user data! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // 4. Write the response into our 'changesets' object
            // console.log(data);
            changesets.userData = {};
            if (data && data.users) {
                data.users.forEach(user => {
                    // console.log(user.user.id);
                    changesets.userData[user.user.id] = { accountCreated: user.user.account_created, changesetCount: user.user.changesets.count };
                });
            }

            // 5. Update the DOM with the fetched data
            // Select all result list items that have a 'osm-user-id' attribute
            d3.selectAll('.result[user-id]').each(function () {
                const li = d3.select(this);
                const userId = li.attr('user-id');
                // console.log(userId);
                const userData = changesets.userData[userId];
                // console.log(userData);

                if (userData) {
                    // Unhide the "User Experience" section
                    li.selectAll('.user-experience-heading, .user-experience-row').classed('hide', false);

                    // Update the table cells with the new data
                    li.select('.user-changesets-count').text(userData.changesetCount.toLocaleString());
                    li.select('.user-time-since-signup').text(moment(userData.accountCreated).fromNow());

                    // Update the title of '.user-name' link to include total changesets and signup date
                    const userNameLink = li.select('.user-name');
                    const originalTitle = userNameLink.attr('title') || '';
                    const newTitle = `\n\nTotal changesets: ${userData.changesetCount.toLocaleString()}\nSigned up: ${moment(userData.accountCreated).fromNow()}`;
                    userNameLink.attr('title', originalTitle ? originalTitle + newTitle : newTitle);
                }
            });
        })
        .catch(error => {
            // If the API call fails, we just log it and do nothing. The UI will simply not show the extra info.
            console.warn("Could not fetch extended user details:", error.message);
        });
}

// --- Fourth API call: Fetch changeset comments from the OSM API and update the UI. ---
// As of 2025 the OSM API only allows to download changeset comments for one changeset at a time
async function fetchAndDisplayChangesetDiscussions(changesetsToDisplay) {
    // 1. Collect all changeset numbers, where discussionCount > 0
    const changesetsWithDiscussions = [];
    for (const id in changesetsToDisplay) {
        if (changesetsToDisplay[id].discussionCount > 0) {
            changesetsWithDiscussions.push(id);
        }
    }
    // console.log(changesetsWithDiscussions);

    //Return early if there are no changesets with discussions
    if (changesetsWithDiscussions.length === 0) return;

    // Get the current abort signal
    const signal = window.currentAbortController ? window.currentAbortController.signal : null;

    // 2. Iterate over each changeset ID and fetch its discussion
    for (const changesetID of changesetsWithDiscussions) {

        // Check if aborted before starting the next request
        if (signal && signal.aborted) {
            console.log("Fetch discussions aborted.");
            break;
        }

        const url = debugMode
            ? "./examples/exampleDiscussions.json"
            : `https://api.openstreetmap.org/api/0.6/changeset/${changesetID}.json?include_discussion=true`;

        try {
            // 3. Await the fetch. This ensures requests are done sequentially (1 by 1),
            // preventing API rate limiting issues or browser network congestion.
            const response = await fetch(url, { signal: signal });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Update the main object (the discussion data in the changesets object is used, when the changesets list is filtered and thus rerendered)
            const discussion = data.changeset.comments;

            // 4. Update the DOM

            // Select the discussion heading and unhide it
            const discussionHeading = d3.select(`[changeset-id="${changesetID}"] .changeset-discussion-heading`);
            discussionHeading.classed('hide', false);

            // Select the discussion container for this changeset
            const discussionTR = d3.select(`[changeset-id="${changesetID}"] .changeset-discussion`);

            // Loop through each comment and append it to the discussion container
            for (let j = 0; j < discussion.length; j++) {
                const comment = discussion[j];
                const singleCommentDiv = discussionTR.append('article')
                    .classed('comment-container', true);

                singleCommentDiv.append('div')
                    .classed('comment-info', true)
                    .html(`
                        Comment from <a href="https://www.openstreetmap.org/user/${comment.user}" target="_blank" rel="noopener noreferrer" title="Go to OSM user page of ${comment.user}">${comment.user}</a> ${moment(comment.date).fromNow()}
                    `);

                singleCommentDiv.append('div')
                    .classed('comment-text', true)
                    .html(linkify(escapeHtml(comment.text))); // Escape HTML and linkify URLs
            }
            //Write discussion HTML to changeset object for future use (i.e. when filtering the changesets list)
            changesets[changesetID].discussionHTML = discussionTR.html();

        } catch (error) {
            if (error.name === 'AbortError') {
                // Silent return/break on abort
                return;
            }
            console.warn(`Could not fetch discussions for changeset ${changesetID}:`, error.message);
        }
    }
}

/* Sort GeoJSON features by geometry type and size.
   By doing this we can make sure that an element which is completely covered by a larger polygon can still be selected.
   Sort order (i.e. order in which they are added to the map):
   1. Polygons (largest to smallest)
   2. Lines
   3. Points
*/
function sortGeoJsonFeatures(a, b) { // a and b are GeoJSON features
    const typeOrder = { 'Polygon': 1, 'LineString': 2, 'Point': 3 };
    const aType = a.geometry.type;
    const bType = b.geometry.type;
    if (typeOrder[aType] !== typeOrder[bType]) {
        return typeOrder[aType] - typeOrder[bType];
    }
    if (aType === 'Polygon') {
        const aArea = calculateArea(a.geometry);
        const bArea = calculateArea(b.geometry);
        return bArea - aArea; // Largest first (Reverse the subtraction for descending order)
    }
    return 0;
};

/*Calculate relative area of polygon.
This so called 'Shoelace formula' does not return accurate results in m² because it only works for planar
2D coordinates. Our geo coordinates are on a sphere though (in degrees). Since we only want to compare
the relative size of each polygon for sorting purposes the formula is sufficient.*/
function calculateArea(geometry) {
    let area = 0;
    const coords = geometry.coordinates[0];
    for (let i = 0; i < coords.length; i++) {
        const j = (i + 1) % coords.length; //j is always x+1 except on the last element of the array where it is 0.
        const [xi, yi] = coords[i];
        const [xj, yj] = coords[j];
        area += xi * yj - xj * yi;
    }
    // console.log(area);
    return Math.abs(area) / 2;
};

//Render changesets list on the left side
function renderChangesetsList(changesetsToDisplay) {
    // console.log(changesetsToDisplay);
    //Object.values writes all values of 'changesetsToDisplay' object into an array
    //Then the array elements (i.e. changesets) are sorted newest to oldest
    const bytime = Object.values(changesetsToDisplay)
        // Filter out non-changeset properties like 'allLeafletLayers'.
        // Workflow: Is 'cs' NOT 'null' or undefined? And does it have a valid '.id' property? If true: keep this changeset in 'bytime'.
        // If false: Filter it out. 'allLeafletLayers' does not have an '.id' property.
        .filter(cs => cs && typeof cs.id !== 'undefined')
        .sort((a, b) => (+b.time) - (+a.time));

    // console.log(bytime);

    //From here onwards the creation of the changesets section starts
    const results = d3.select('#results').html("");//Select and Clear the Results Container
    const allresults = results
        .selectAll('li.result')//Since li.results is nonexistent at this point in time D3 creates an empty selection
        .data(bytime, d => d.id);//Bind data
    // console.log(allresults);
    //Below a single changeset div container 'rl' with all its content (e.g. loupe, traffic light, username, ...) is created.
    const rl = allresults.enter()
        .append('li')
        .attr('class', 'result')
        .attr('changeset-id', d => d.id)
        .attr('user-id', d => d.userId)
        // .attr('title', 'Changeset is highlighted on map')
        .style('color', d => changesets[d.id].color)
        .on('click', (event, d) => click(null, d))//Highlight changeset on click (desktop/mobile) - Pass null for feature, d for data
        .on('mouseover', (event, d) => click(null, d));//Highlight changeset on mouseover (desktop) - Pass null for feature, d for data
    // console.log(rl);
    allresults.order();

    //"Zoom to changeset" button
    rl.append('div')
        .classed('zoom', true)
        .attr('title', 'Zoom to changeset')
        //.html('&#x1F50E; ')//Unicode glyph for a loupe
        .on('click', function (event, d) {
            //Fit the bounds of the Leaflet layers featureGroup for this changeset
            if (changesets[d.id] && changesets[d.id].leafletFeatureGroup) {
                const groupToZoom = changesets[d.id].leafletFeatureGroup;
                const bounds = groupToZoom.getBounds();
                map.fitBounds(bounds, { padding: [50, 50] });//Add padding so that features are not directly at the edge of the map
            }

            //On small screens (screen width < 601px) scroll all the way down, so that map is completely visible on screen
            if (screen.width < 601) {
                window.scrollTo({
                    top: document.body.scrollHeight, // Scroll to the bottom of the page ('document.body.scrollHeight' returns the total height of the entire document body)
                    behavior: 'smooth'
                });
            }
        })
        .append('svg')
        .classed('loupe', true)
        .append('use')
        .attr('href', 'img/icons.svg#loupe');

    //Vandalism Checker traffic light
    let trafficLightContainer = rl.append("div")
        .classed("traffic-light-container", true)
        .attr('title', function (d) {
            const changesetData = changesets[d.id];
            if (!changesetData) return "Changeset data not available for title.";

            const possibleVandalism = changesetData.possibleVandalism;
            const deltaInNodesWays = changesetData.deltaInNodesWays;
            const deltaInTags = changesetData.deltaInTags;
            const deltaInIdWarningsAndResolves = changesetData.deltaInIdWarningsAndResolves;
            const usedEditorWasId = changesetData.osmEditor && changesetData.osmEditor.toLowerCase().startsWith("id");
            // console.log('OSM Editor: ' + changesetData.osmEditor + ', usedEditorWasId: ' + usedEditorWasId);
            let titleText;
            //Only show the line "All resolved iD warnings..." if the used editor was actually iD
            if (possibleVandalism) {
                titleText = `This changeset is potentially destructive!\nAll added nodes/ways - All deleted nodes/ways: ${deltaInNodesWays}. ${deltaInNodesWays < vandalismThreshold ? "This is suspicious!" : ""}\nAll added tags - All deleted tags: ${deltaInTags}. ${deltaInTags < vandalismThreshold ? "This is suspicious!" : ""}\n${usedEditorWasId ? `All resolved iD warnings - New iD warnings: ${deltaInIdWarningsAndResolves}. ${deltaInIdWarningsAndResolves < vandalismThreshold ? "This is suspicious!" : ""}` : ""}\n\nReminder: It is often NOT necessary to delete elements in OSM. For example a closed shop should be tagged as 'disused:shop'. One day a new shop might open at the same exact lot and the tags can be updated. The same is true for demolished buildings ('demolished:building')`;
            } else {
                titleText = `This changeset looks good!\nAll added nodes/ways - All deleted nodes/ways: ${deltaInNodesWays}. ${deltaInNodesWays < vandalismThreshold ? "This is suspicious!" : ""}\nAll added tags - All deleted tags: ${deltaInTags}. ${deltaInTags < vandalismThreshold ? "This is suspicious!" : ""}\n${usedEditorWasId ? `All resolved iD warnings - New iD warnings: ${deltaInIdWarningsAndResolves}. ${deltaInIdWarningsAndResolves < vandalismThreshold ? "This is suspicious!" : ""}` : ""}`;
            }
            return titleText;
        });
    let trafficLight = trafficLightContainer.append("div")
        .classed("traffic-light", true);
    trafficLight.append("span")
        .attr('class', function (d) {
            const possibleVandalism = changesets[d.id].possibleVandalism;
            return (possibleVandalism ? "gray" : "green");
        });
    trafficLight.append("span")
        .attr('class', function (d) {
            const possibleVandalism = changesets[d.id].possibleVandalism;
            return (possibleVandalism ? "red" : "gray");
        });

    //Adds a span element for displaying a text bubble SVG symbol if this OSM changeset has received comments
    rl.append('div')
        .classed('text-bubble', true)
        .filter(d => d.discussionCount > 0) // Filter this span based on the data ('d.discussionCount' from 'bytime')
        // If 'discussionCount' is larger 0 the 'span' html tag will pass the filter and the attributes below will be attached to it:
        .attr('title', d => `Changeset has ${d.discussionCount} comment${d.discussionCount !== 1 ? "s" : ""}`)
        .append('svg') // Append SVG only to filtered spans
        .classed('text-bubble-svg', true)
        .append('use')
        .attr('href', 'img/icons.svg#speech-bubble');

    //Container for name and age of changeset
    let containerNameDate = rl.append('div')
        .classed('container-name-date', true);

    //User name.
    containerNameDate.append('a')
        .classed('user-name', true)
        .html(function (d) {
            return d.user; // d.user might contain HTML highlights from filtering
        })
        .attr('title', function (d) {
            // Get unaltered user name from changesets. The value in d.user might have html in it if filtered,
            // e.g. <span class="highlight">rene</span>78. We don't want that in the title and href.
            const unalteredUserName = changesets[d.id].user;
            let titleText = `Go to OSM user page of ${unalteredUserName}`;
            // If we have extended user data, add total changesets and signup date to the title
            if (changesets.userData?.[d.userId]) {
                return `${titleText}\n\nTotal changesets: ${changesets.userData?.[d.userId]?.changesetCount}\nSigned up: ${moment(changesets.userData?.[d.userId]?.accountCreated).fromNow()}`;
            } else return titleText;
        })
        .attr('target', '_blank')
        .attr('href', function (d) {
            const unalteredUserName = changesets[d.id].user;//Get unaltered user name from changesets object.
            return '//openstreetmap.org/user/' + unalteredUserName;
        });

    //Timespan since changeset creation
    containerNameDate.append('span')
        .attr('title', function (d) {
            return moment(d.time).format('MMM Do YYYY, h:mm:ss a');
        })
        .attr('class', 'date').text(function (d) {
            return moment(d.time).fromNow();
        });

    //Arrow to expand changeset information
    rl.append('div')
        .classed('arrow', true)
        .attr('title', 'Open details of changeset')
        .on('click', function (event, d) {
            //Element related to the arrow animation
            const arrowDiv = d3.select(this);  // 'this' refers to the clicked element
            const arrowSvg = arrowDiv.select('svg').node(); // grab the SVG node inside the arrow div

            //Elements related to the expansion of the changeset details
            const thisResult = this.closest('.result'); // find parent element
            const changesetComment = thisResult.querySelector('.changeset-comment'); //Changeset comment
            const tableContainer = thisResult.querySelector('.table-container'); //Changeset details

            const isCollapsed = tableContainer.classList.toggle('hidden');

            if (isCollapsed) {
                //Collapsing
                arrowSvg.classList.remove('rotated');
                // Only after collapse transition ends, restore truncation. Else it looks very choppy.
                setTimeout(() => {
                    changesetComment.classList.remove('expanded');
                    changesetComment.innerHTML = linkify(d.comment);
                }, 300);
                // Update tooltip when hovering over arrow
                arrowDiv.attr('title', 'Open changeset information');
                // Add back the changeset comment once the details are collapsed
                changesetComment.title = `Go to OSM changeset page\n\n${changesets[d.id].comment}`;
            } else {
                // Expanding
                arrowSvg.classList.add('rotated');
                changesetComment.classList.add('expanded');
                changesetComment.innerText = "Information";
                //Remove the changeset comment from the tooltip when details are expanded.
                changesetComment.title = "Go to OSM Changeset page";
                // Update tooltip when hovering over arrow
                arrowDiv.attr('title', 'Close changeset information');
            }
        })
        .append('svg')
        .classed('arrow-up-svg', true)
        .append('use')
        .attr('href', 'img/icons.svg#arrow-up');

    //Changeset comment
    rl.append('a')
        .classed('changeset-comment', true)
        .attr('href', d => `https://www.openstreetmap.org/changeset/${d.id}`)
        .attr('target', '_blank')
        .attr('title', d => `Go to OSM changeset page\n\n${changesets[d.id].comment}`)
        //Changeset title (was downloaded separately from OSM API)
        .html((d) => {// d.comment might contain HTML highlights from filtering
            // We apply linkify to make URLs clickable. 
            // Note: If a URL matches the search term, the highlighting <mark> might interfere with the <a> tag creation, but this is a rare edge case.
            return linkify(d.comment) || '<span class="no-comment">—</span>';
        })

    //Changeset details. Appears after clicking on the arrow button
    let tableContainer = rl.append('div')
        .classed('table-container hidden', true)

    //The changeset details table which is hidden by default
    tableContainer.append('table')
        .classed('changeset-table', true)
        .html(function (d) {
            let imageryHtml;
            const imageryUsed = changesets[d.id].imageryUsed;
            if (imageryUsed.length === 0) imageryHtml = '-';
            else if (imageryUsed.length === 1) imageryHtml = imageryUsed[0];
            else {
                imageryHtml = '<ul class="imagery-list">';
                imageryUsed.forEach((provider, index) => {
                    imageryHtml += `<li>${provider}</li>`;
                })
                imageryHtml += '</ul>';
            }

            const usedEditorWasId = changesets[d.id].osmEditor && changesets[d.id].osmEditor.toLowerCase().startsWith("id");//code is written twice. not very clean.
            htmlForIdWarningsCheck = `
                <tr class="integrity ${changesets[d.id].deltaInIdWarningsAndResolves < vandalismThreshold ? "delete" : "create"}">
                    <td>iD Warnings<br>Resolved-New</td>
                    <td>${changesets[d.id].deltaInIdWarningsAndResolves}</td>
                </tr>`;

            // Infos regarding the "User Experience" data: After executing run() the user data (i.e. total edits & sign-up date) has not been
            // downloaded and written into the 'changesets' object yet. When using the filter function the user data is already in 'changesets' though.
            // That is why we check if 'changesets.userData?.[d.userId]' is available or not. The same is true for the discussion data further down.
            let tableHtml = `
                    <tbody>
                        <tr class="table-heading">
                            <td colspan="2">Changeset Details</td>
                        </tr>
                        <tr class="border-bottom">
                            <td>Comment</td>
                            <td class="table-changeset-comment">${d.comment}</td>
                        </tr>
                        <tr class="border-bottom">
                            <td>Imagery</td>
                            <td>${imageryHtml}</td>
                        </tr>
                        <tr>
                            <td>Editor</td>
                            <td class="editor">${changesets[d.id].osmEditor || '-'}</td>
                        </tr>
                        <tr class="table-heading user-experience-heading ${!(changesets.userData?.[d.userId]) ? "hide" : ""}">
                            <td colspan="2">User Experience</td>
                        </tr>
                        <tr class="border-bottom user-experience-row ${!(changesets.userData?.[d.userId]) ? "hide" : ""}">
                            <td>Edits count</td>
                            <td class="user-changesets-count">${!(changesets.userData?.[d.userId]) ? "..." : changesets.userData[d.userId].changesetCount.toLocaleString()}</td>
                        </tr>
                        <tr class="user-experience-row ${!(changesets.userData?.[d.userId]) ? "hide" : ""}">
                            <td>Joined</td>
                            <td class="user-time-since-signup">${!(changesets.userData?.[d.userId]) ? "..." : moment(changesets.userData[d.userId].accountCreated).fromNow()}</td>
                        </tr>
                        <tr class="table-heading">
                            <td colspan="2">Changeset Integrity</td>
                        </tr>
                        <tr class="integrity border-bottom ${changesets[d.id].deltaInNodesWays < vandalismThreshold ? "delete" : "create"}">
                            <td>Elements<br>Added-Deleted</td>
                            <td>${changesets[d.id].deltaInNodesWays}</td>
                        </tr>
                        <tr class="integrity border-bottom ${changesets[d.id].deltaInTags < vandalismThreshold ? "delete" : "create"}">
                            <td>Tags<br>Added-Deleted</td>
                            <td>${changesets[d.id].deltaInTags}</td>
                        </tr>
                        ${usedEditorWasId ? htmlForIdWarningsCheck : ""}
                        <tr class="table-heading">
                            <td colspan="2" title="Deleted nodes or ways. Please check if deletion is really necessary. A lifecycle tag like 'demolished:' or 'disused:' might be more appropriate.">Deleted Elements</td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <div class="deleted-elements-button-container">
                                    ${changesets[d.id].deletedFeatures?.length
                                        ? changesets[d.id].deletedFeatures.map(featureId => `
                                            <button class="center-map-on-feature" feature-id="${featureId}" title="Zoom to deleted element ${featureId}">
                                                <svg><use href="img/icons.svg#loupe"></use></svg>
                                                ${featureId}
                                            </button>`).join("")
                                        : "none"
                                    }
                                </div>
                            </td>
                        </tr>
                        <tr class="changeset-discussion-heading table-heading ${!(changesets[d.id].discussionHTML) ? "hide" : ""}">
                            <td colspan="2">Discussion</td>
                        </tr>
                        <tr>
                            <td class="changeset-discussion" colspan="2">
                                ${!(changesets[d.id].discussionHTML) ? "" : changesets[d.id].discussionHTML}
                            </td>
                        </tr>
                    </tbody>`;
            return tableHtml;
        })
}

//Highlight clicked layer on map and in sidebar (happens when selecting element in sidebar or on map)
// eventOrFeature can be a Leaflet GeoJSON feature (from map click) or null (from sidebar click/hover)
// d can be changeset data (from sidebar click/hover) or null (from map click)
function click(eventOrFeature, d) {
    // console.log("--- click Function Called ---");
    // console.log("Argument 1 (eventOrFeature):", eventOrFeature);
    // console.log("Argument 2 (d):", d);

    let changesetNumber;
    if (d && typeof d.id !== 'undefined') { // Click/hover from sidebar (d is changeset data from bytime array)
        changesetNumber = d.id;
    } else if (eventOrFeature?.properties?.meta?.changeset) { // Click from map (eventOrFeature is a GeoJSON feature)
        changesetNumber = eventOrFeature.properties.meta.changeset;
    } else {
        console.warn("Could not determine changeset number in click handler.", eventOrFeature, d);
        return; // Cannot proceed without a changeset number
    }
    // console.log('changesetNumber: ' + changesetNumber);

    //Reset style of previously highlighted changeset
    //The code 'changesets.allLeafletLayers.resetStyle();' is possible, too. But for this setStyle() is called for every element on the map.
    //Computationally demanding for no added value since we only need to reset the color of the previously highlighted featureGroup.
    highlightedChangeset = changesets.highlightedChangeset;
    // console.log(highlightedChangeset);
    if (highlightedChangeset) changesets[highlightedChangeset].leafletFeatureGroup.setStyle({ color: changesets[highlightedChangeset].color });//Change color back to shade of red
    changesets.highlightedChangeset = changesetNumber;//Change highlighted changeset to the currently selected one.

    const results = d3.select('#results');
    results
        .selectAll('li.result')
        .classed('active', function (dataItem) { // dataItem here is an element from the 'bytime' array
            //assign the class "active" if id of li element equals changeset number
            return dataItem.id == changesetNumber; //returns true if dataItem.id equals the changeset number from above. Else it returns false.
        });

    //Highlight featureGroup belonging to the selected changeset number.
    if (changesets[changesetNumber] && changesets[changesetNumber].leafletFeatureGroup) {
        changesets[changesetNumber].leafletFeatureGroup.setStyle({ color: '#008dff' }); //Highlighting color: blue
    }

    //Make sure that sidebar is displayed (if it was hidden)
    sidebar.classList.remove("hide");
}

// Helper function to highlight search term in a given text
function highlightSearchTermInText(text, searchTerm) {
    const originalText = text || ""; // Ensure we have a string, even if input is null/undefined
    let highlightedText = originalText;
    let matchFound = false;

    // Only proceed if searchTerm is provided and text is not empty
    if (searchTerm && originalText) {
        // Check if the original text (case-insensitively) contains the search term
        if (originalText.toLowerCase().includes(searchTerm.toLowerCase())) {
            matchFound = true;
            highlightedText = ''; // Rebuild with highlights
            let lastIndex = 0;
            // Safely handle any user input, even special regex symbols. Make it case-insensitive.
            const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            let match;
            while ((match = regex.exec(originalText)) !== null) {
                highlightedText += originalText.substring(lastIndex, match.index); // The original text up until the search term encounter...
                highlightedText += `<mark>${match[0]}</mark>`; // ...plus the highlighted search term...
                lastIndex = regex.lastIndex; // index at the end of the search term
            }
            highlightedText += originalText.substring(lastIndex); // ...plus the part of the text after the highlighted search term
        }
    }
    return { highlightedText, matchFound };
}

//Filter changesets and update changesets list and GeoJSON data on map
function filterChangesets() {
    let foundChangesets = {}; // This will store data for rendering (potentially with highlighted text)
    const searchTerm = document.querySelector(".search-changesets-field").value.toLowerCase();
    const onlyRed = document.querySelector("#filter-red-checkbox").checked;

    // If searchTerm is empty AND "onlyRed" is not checked, show all changesets by writing all the data from 'changesets' object into 'foundChangesets'
    if (!searchTerm && !onlyRed) {
        for (const changesetId in changesets) {
            // Ensure we are only processing actual changeset entries, not 'allLeafletLayers'
            if (changesets.hasOwnProperty(changesetId) && changesetId !== 'allLeafletLayers') {
                foundChangesets[changesetId] = changesets[changesetId]; // Use original data
            }
        }
        renderChangesetsList(foundChangesets);
        displayGeoJson(foundChangesets); // Pass the same object, displayGeoJson will look up groups in changesets
        return;
    }

    for (const changesetId in changesets) {
        if (!changesets.hasOwnProperty(changesetId) || changesetId === 'allLeafletLayers') continue;

        const currentChangesetData = changesets[changesetId]; // Original data

        // Apply "onlyRed" filter first. If it's active and current changeset is not marked as 'possible vandalism', skip.
        if (onlyRed && !currentChangesetData.possibleVandalism) continue;

        let matchFoundBySearchTerm = false;
        let modifiedComment = currentChangesetData.comment || ""; // Start with original or empty string
        let modifiedUserName = currentChangesetData.user || "";   // Start with original or empty string

        if (searchTerm) { // Only perform search term matching if searchTerm is present
            // 1. Search within COMMENTS for search term and get highlighted version
            const commentResult = highlightSearchTermInText(currentChangesetData.comment, searchTerm);
            modifiedComment = commentResult.highlightedText;
            if (commentResult.matchFound) {
                matchFoundBySearchTerm = true;
            }

            // 2. Search within USER NAME for search term and get highlighted version
            const userNameResult = highlightSearchTermInText(currentChangesetData.user, searchTerm);
            modifiedUserName = userNameResult.highlightedText;
            if (userNameResult.matchFound) {
                matchFoundBySearchTerm = true;
            }
        }

        // Determine if this changeset should be included in results:
        // - If searchTerm is entered AND matchFoundBySearchTerm must be true.
        // - If searchTerm is NOT entered BUT onlyRed IS (due to initial check)
        if ((searchTerm && matchFoundBySearchTerm) || (!searchTerm && onlyRed)) {
            foundChangesets[changesetId] = {
                ...currentChangesetData, // Copy all original properties
                user: modifiedUserName,    // Override with (potentially) highlighted user
                comment: modifiedComment   // Override with (potentially) highlighted comment
            };
        }
    }
    // console.table(foundChangesets);
    renderChangesetsList(foundChangesets); // Pass the object with potentially highlighted text
    displayGeoJson(foundChangesets);

    //Filter GeoJSON on map
    function displayGeoJson(fSets) { // fSets is the foundChangesets object
        if (!changesets.allLeafletLayers) return;

        // Clear layers. Important: The layers are just detached from the map. The reference to those layers
        // inside 'changesets[csId].leafletFeatureGroup' is still intact.
        changesets.allLeafletLayers.clearLayers();

        // 1. Collect all Leaflet layer instances that should be visible from the filtered sets
        const visibleLayers = [];
        for (const csId in fSets) { // Iterate over the fSets (which are the filtered changesets)
            if (fSets.hasOwnProperty(csId)) {
                // Get the original changeset data from the main object to access its leafletFeatureGroup
                const originalChangesetData = changesets[csId];
                if (originalChangesetData && originalChangesetData.leafletFeatureGroup) {
                    originalChangesetData.leafletFeatureGroup.eachLayer(layer => {
                        visibleLayers.push(layer);
                    });
                }
            }
        }

        // 2. Sort these visible layers using the same logic as the initial sort.
        // The Leaflet layer instance (`layer`) has `layer.feature`.
        visibleLayers.sort((layerA, layerB) => {
            // Use your existing sortGeoJsonFeatures by passing the features
            return sortGeoJsonFeatures(layerA.feature, layerB.feature);
        });

        // 3. Add the sorted layers back to the main display group
        visibleLayers.forEach(layer => {
            if (changesets.allLeafletLayers && typeof changesets.allLeafletLayers.addLayer === 'function') {
                changesets.allLeafletLayers.addLayer(layer);
            }
        });
    }
}

// --- Helper Functions for URL Linking ---

// Escapes HTML characters to prevent XSS and broken layout
function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Converts text URLs into clickable HTML <a> tags
function linkify(inputText) {
    if (!inputText) return "";

    // Pattern for http/https/ftp URLs
    const protocolPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    /* Replace the URL within the input text with the URL wrapped in an anchor tag
    Example: "Visit http://osm.org" becomes 'Visit <a href="http://osm.org" target="_blank" rel="noopener noreferrer">http://example.com</a>' */
    let replacedText = inputText.replace(protocolPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

    // Pattern for "www." URLs (add http:// automatically)
    const wwwPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(wwwPattern, '$1<a href="http://$2" target="_blank" rel="noopener noreferrer">$2</a>');

    return replacedText;
}

//Show a modal with a message
function message(type, text) {
    // Get the infobox modal
    const infobox = document.querySelector(".infobox");

    infobox.classList.remove("show", "alarm", "success");
    void infobox.offsetWidth; //Found here: https://css-tricks.com/restart-css-animation/#update-another-javascript-method-to-restart-a-css-animation
    infobox.innerHTML = text;
    infobox.classList.add("show", type);
}

//Scroll to top when clicking on "Back-to-top" button
function scrollToTop() {
    sidebar.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

//Only show X to remove content of filter input after at least one char has been entered. Then launch filterChangesets function.
function showHideCrossThenFilter() {
    const searchTerm = document.querySelector(".search-changesets-field").value;
    const deleteFilterInput = document.querySelector(".delete-filter-input");
    if (searchTerm.length > 0) deleteFilterInput.classList.remove("hide");
    else deleteFilterInput.classList.add("hide");

    //Filter changesets
    filterChangesets();
}

//Check current zoom level of map and show info message, if zoomed out too far
map.on('zoom', updateMap);
//Update location in local storage when panning the map
map.on('drag', function (e) {
    localStorage.setItem('location-hash', location.hash);
});

//Update variable "daysToShow" after change in time range selector
d3.select('#resolution')
    .attr('title', 'Select a time range')
    .on('change', function () {
        switch (this.selectedIndex) {
            case 0: // last 24h
                daysToShow = 1;
                break;
            case 1: // last 3 days
                daysToShow = 3;
                break;
            case 2: // last week
                daysToShow = 7;
                break;
            case 3: // last month
                daysToShow = 30;
                break;
        }
        localStorage.setItem("resolution", daysToShow);
    });

//Start download on click of button
document.querySelector("#download-changesets-button").addEventListener("click", run);

//Once text is typed into the filter changeset input --> Start filterChangesets function
document.querySelector(".search-changesets-field").addEventListener("input", showHideCrossThenFilter);

//Remove content of "filter changeset input" once X is clicked
document.querySelector(".delete-filter-input").addEventListener("click", () => {
    document.querySelector(".search-changesets-field").value = "";
    showHideCrossThenFilter(); // Call this to hide cross and re-filter (showing all)
});

//Only show changesets with red traffic light when clicking on the "filter red" checkbox
document.querySelector("#filter-red-checkbox").addEventListener("click", (e) => {
    document.querySelector(".traffic-light-filter").classList.toggle("filter-red-color");
    filterChangesets();
});

//Display "Back-to-top" button if changesets in sidebar are overflowing and user scrolled down a bit
sidebar.addEventListener("scroll", event => {
    let toTop = document.querySelector(".to-top");
    // console.log(sidebar.scrollTop);
    if (sidebar.scrollTop > 50) toTop.classList.remove("hide");//display to-top button
    else toTop.classList.add("hide");//hide to-top button
});

//Click sidebar button to center map on deleted feature and open tag comparison table
document.getElementById('results').addEventListener('click', (e) => {
    // Check if the click originated inside one of our buttons
    const button = e.target.closest('.center-map-on-feature');
    // console.log(button);

    if (button) {
        const osmFeatureId = button.getAttribute('feature-id');
        // console.log(osmFeatureId);

        // Deleted features are stored with 'o' suffix (old version) in the Leaflet layer group
        const layerId = osmFeatureId + 'o';

        const layer = changesets.allLeafletLayers.getLayer(layerId);

        if (layer) {
            // 1. Center map to feature
            let popupLocation;

            // Check if the layer has bounds (Ways/Polygons) or just a point (Nodes)
            if (typeof layer.getBounds === 'function') {
                // It is a Way or Polygon
                const bounds = layer.getBounds();
                map.fitBounds(bounds, { padding: [50, 50] }); // Zoom to fit bounds with padding
                popupLocation = bounds.getCenter(); // Place popup in center of line or polygon
            } else if (typeof layer.getLatLng === 'function') {
                // It is a Node (Marker/CircleMarker)
                popupLocation = layer.getLatLng();
                map.setView(popupLocation, 19); // Zoom directly to the node
            }

            // 2. Open Tag Comparison Table Popup
            if (window.createTagComparisonTable) {
                const tableHtml = window.createTagComparisonTable(osmFeatureId);
                let mapContainer = document.querySelector(".map-container");

                L.popup({
                    maxWidth: mapContainer.clientWidth - 45,
                    maxHeight: mapContainer.clientHeight - 40,
                    className: "stylePopup"
                })
                    .setLatLng(popupLocation)
                    .setContent(tableHtml)
                    .openOn(map);
            }
        } else {
            console.warn(`Layer for deleted element ${osmFeatureId} not found on map.`);
            // This happens if the element was deleted but wasn't in the initial Overpass bbox download
            // or filtered out for having null coordinates.
        }

    }
});