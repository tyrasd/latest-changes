![Intro Pic][social-media-pic]
# Introduction
*OSM Latest Changes* is a web application that helps to check recent OSM changes within a certain cartographic boundary, for example your home town. It displays all changesets in a list and on a map. The elements can be selected on the map whereby a tag comparison table opens up that highlights all created, modified or deleted tags. Furthermore a "Vandalism Checker" helps to find suspicious edits.

![Picture of App][screenshot]

# Visualization
Newer edits are displayed in more saturated colors than older modifications. Deleted objects as well as the "previous state" of modified map features are displayed semi-transparently. Intermediate states of objects that have been modified more than once in the selected time period are not shown.

# How to use
1. Zoom to the area of interest and click the *Get Changesets* button to see the changes of the last 7 days (or 1 day, 3 days, 1 month).
2. Analyse changesets by...
- filtering for suspicous edits (hover over red traffic light to get infos)
- selecting elements on the map and see tag modifications
3. Bookmark the URL to regularly come back and monitor your area of interest.

## Vandalism Checker
A simple tool that verifies the integrity of downloaded changesets. It calculates the total number of elements, tags and iD warnings added and deleted in each changeset. If the net change is below a specified threshold (currently -3), a red traffic light alert is triggered to notify users about the suspicious changeset.

### Examples
|   Type        |   Case                                                                          |   Sum  |   Result      |
|---------------|---------------------------------------------------------------------------------|--------|:-------------:|
| Element       | A user added **one** new supermarket and deleted **two** roads.                 |     -1 | 🟢⚫️          |
| Tag           | A user added **three** tags to a restaurant but deleted **seven** of a library. |     -4 | ⚫️🔴          |
| iD Warning    | A user fixed **one** iD warning but caused **five** new ones.                   |     -4 | ⚫️🔴          |

# Limitations
- The site currently doesn't show OSM modifications of relation objects.
- Too many or too large download requests can cause the Overpass server to deny the request.

# Running
Just `git clone` and [boot up a quick development server](https://gist.github.com/tmcw/4989751). If you use *Visual Studio Code* you can alternatively install the *Live Server* extension.

# History
## 2013
It was first [prototyped](https://osmlab.github.io/latest-changes/) by [@lxbarth](https://github.com/lxbarth) and [@tmcw](https://github.com/tmcw) during the [Chicago Hack weekend](https://wiki.openstreetmap.org/wiki/Chicago_Hack_Weekend_April_2013) on the 26th-28th April 2013 (see [diary entry of lxbarth](http://www.openstreetmap.org/user/lxbarth/diary/19185) for background). This was conceived to be an enhancement to the OSM history tab with other notable users of the community working on coming up with a solution for a history tab that visualizes local changesets in an easy to understand way.
## 2013-2021
A hacked version of this prototype has been created with aims into saving bandwith and rendering time. Furthermore it allows lower zoom levels. It will show changes made in the last 24h, 3 days, 7 days or 30 days. Those enhancements were mainly implemented by [@tyrasd](https://github.com/tyrasd)
## 2022-now
As of July 2022 another [updated version](https://www.openstreetmap.org/user/rene78/diary/399505) has been created, that offers added functionality, i.e. a tag comparison table, a vandalism checker and a filter functionality.

[social-media-pic]: img/SocialMedia-Latest-Changes.png "Intro Pic"
[screenshot]: img/multi-devices.png "Picture of the App"