
# VesselMap PCF Control

## 1. Introduction
This document provides a detailed technical design for the **VesselMap PCF control**. The control is designed to display vessel locations and ports on a map, with various functionalities such as filtering, clustering, and displaying additional information about each vessel.

## 2. Overview
The VesselMap control is a virtual control that integrates with external map services (Azure Maps) to display vessel data. It supports various data sources and properties to customize the display and behavior of the map.

<img width="1373" height="737" alt="image" src="https://github.com/user-attachments/assets/821ba701-45bc-4b96-8a43-2aecb2d2a803" />

<img width="1377" height="585" alt="image" src="https://github.com/user-attachments/assets/24d81dc6-ecab-4325-a0d8-93e10fb251c2" />

## 3. Different Ways of Displaying Information
The PCF allows displaying points on the map using different data sources:
- **Data Set** (array of points)
- **Lookup** (single point)
- **Fields** (single point)

## 4. Properties of the Control

The following properties from the `ControlManifest.Input.xml` file are required based on the selected source:

### DataSet

- `dataSetPoints`: Array of records that contain the data to display on the map. Requires a configured view of an entity. By default, this PCF is configured for the standard 'Field Service' entity called functional locations (msdyn_functionallocation).
- `modeLoad`: Must be set to `DataSet`. Only this mode allows filter display.

### Lookup

**Point Property**

- `lookupIdLookupPoint`: Lookup linked to the record with data to show a point. Requires three text fields:
  - Record name
  - Latitude
  - Longitude
- `modeLoad`: Must be set to `LookupPoint`.

### Fields

**Single Point Properties**

- `latitudeFieldPoint`: Numeric field with latitude of the point.
- `longitudeFieldPoint`: Numeric field with longitude of the point.
- `textFieldPoint`: Text field with the name of the point.
- `modeLoad`: Must be set to `FieldPoint`.

### Global Properties

- `showCurrentLocationUser`: `true` enables a button to geolocate the user and show their position on the map.
- `lockInteractiveUser`: `true` makes the map read-only (non-interactive).
- `showControlsMap`: `true` shows map controls (type, zoom, rotation, tilt).
- `popupType`:  
  - `default`: Popup shown at point after selection or filter.  
  - `rightPanel`: Popup shown on the right.  
  - `leftPanel`: Popup shown on the left.
- `maxZoom`: Max zoom (1–24). Must be ≥ `minZoom`.
- `minZoom`: Min zoom (1–24). Must be ≤ `maxZoom`.
- `zoomDefaultSelectedPoint`: Default zoom level when selecting a point (1–24). Default is `11`.
- `environmentUrl`: Root URL of the environment to load images and styles properly.

## 5. Resources of the Control

The control requires the following **resources** preloaded in the **Dynamics CRM** environment:

### Control Style

- Stylesheet (`.css`):  
  `vesselMap.css` – defines layout for control components.

### Images (Ships and Locations)

Used to visually represent map points.

- `functionalLocation.png`  
- `iconvessel_a_going.png`  
- `iconvessel_still.png`

## 6. Connecting to Dynamics CRM API

The control uses the **Dynamics CRM API** to retrieve information on ports and vessels when `modeLoad = DataSet`.

### Functionality Highlights:

- **Search and filter vessels**
<img width="753" height="162" alt="image" src="https://github.com/user-attachments/assets/17453960-860b-4360-b27a-097196af7e68" />

- **Search counter, results list, vessel status**
<img width="743" height="368" alt="image" src="https://github.com/user-attachments/assets/04582c28-04cc-4ae5-96ec-cd9d5dbe12d7" />
  
- **Multiple filters** (e.g. vessel type) and **point clustering**
<img width="820" height="757" alt="image" src="https://github.com/user-attachments/assets/b6642b3e-a8d2-4d9b-bdbf-866f3bdc6549" />

- **Port search results and status**
<img width="751" height="366" alt="image" src="https://github.com/user-attachments/assets/2c8b8272-85d5-48c9-a13b-4f50451817a2" />
  
- **User geolocation and map positioning**
<img width="148" height="140" alt="image" src="https://github.com/user-attachments/assets/db480af1-78e7-492b-9c01-ca40c3707d1d" />
<img width="400" height="339" alt="image" src="https://github.com/user-attachments/assets/7ce01762-626d-4024-956a-f6a092a5eead" />

- **Custom button to reset view**
<img width="141" height="192" alt="image" src="https://github.com/user-attachments/assets/01df7769-93d5-4568-98a1-39c47f1507b6" />

- **Popups with vessel information**
<img width="1563" height="715" alt="image" src="https://github.com/user-attachments/assets/a2650d06-56b6-4a48-a7f0-18c987b7829c" />
<img width="960" height="439" alt="image" src="https://github.com/user-attachments/assets/7b04e499-fc1d-40be-9532-7664cdd87dcc" />

- **Popups with port information**
<img width="1564" height="713" alt="image" src="https://github.com/user-attachments/assets/0e7c2bc6-412d-492d-aa38-dbee7b7dd9c7" />


