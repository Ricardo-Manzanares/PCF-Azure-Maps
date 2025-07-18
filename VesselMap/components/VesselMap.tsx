import * as React from 'react';
import { DialogContent, keyframes, SearchBox } from '@fluentui/react';

import { Button, Field, FluentProvider, makeStyles, Persona, Spinner, Tooltip, webLightTheme, useId, Dialog, DialogSurface, DialogBody, DialogTitle, DialogActions, DialogTrigger, Radio, RadioGroup, Accordion, AccordionHeader, AccordionItem, AccordionPanel, AccordionToggleEventHandler, CheckboxProps, OptionGroup, Option, Combobox, ComboboxProps, RadioGroupProps } from '@fluentui/react-components';
import { List, ListItem} from "@fluentui/react-list";
import { useMediaQuery } from 'react-responsive';
import { FilterRegular, GlobeSyncRegular, LocationRegular, SparkleFilled } from "@fluentui/react-icons";
import { useEffect } from 'react';

import { Toast, useToastController, Toaster, ToastTitle} from "@fluentui/react-toast";
import { Checkbox} from "@fluentui/react-checkbox";

import * as atlas from 'azure-maps-control';
import { IFilter, IVesselMapProps } from './IVesselMap';

import { getAllVessel, getAzureMapSucriptionKey, getFunctionalLocations, getLookupPoint, getSearchVessel, getUrlEnvironment } from "../providers/CRMProvider";

const useStyles = makeStyles({
  root: {
    // Stack the label above the field with a gap
    display: "block",
    marginTop: "8px",
  },
  containerspinner:{
    width:"100%",
    justifyItems:'center'
  },
  spinner:{
    paddingTop: "20px",
  },
  show:{
    display: "block",
    visibility: "visible",
    width: "100%"
  },
  hide:{
    display: "none",
    visibility: "hidden"
  },
  containerInputs:{   
    position: "absolute",
    top: "10px",
    left: "10px",
    right: "10px",
    zIndex: 100,
    height: "123px",
    backgroundColor: "white",
    
    '@media(min-width: 1024px) and (max-width: 1279px)': {
      display: "grid",
      gridTemplateColumns: '46% 46% 8%',
    },
    '@media(min-width: 1280px)': {
      display: "grid",
      gridTemplateColumns: '48% 48% 4%',
    }
  },
  containerButtonRestoreZoom:{
    position: "absolute",
    zIndex: 100,
    right: "44px",
    height: "32px",
    backgroundColor: "white",
  },
  buttonShowOnMap:{
    marginTop: "36px",
    marginRight: "10px", 
    marginBottom: "10px",
    marginLeft: "10px",
    height: "33px",
    backgroundColor: "rgba(236,123,47,1)",
    color: "white",

    '@media(min-width: 320px) and (max-width: 1023px)': {      
      marginTop: "10px",
      marginRight: "10px", 
      marginBottom: "10px",
      marginLeft: "10px",
    },
  },
  buttonShowFilters:{
    position: "absolute",
    top: "3px",
    right: "1.9%",     
    height: "33px",
    backgroundColor: "rgba(236,123,47,1)",
    color: "white"
  },
  containerVesselSearchs:{
    position: "absolute",
    left: "10px",
    right: "10px",
    zIndex: 100,
    backgroundColor: "white",
    
    '@media(min-width: 320px) and (max-width: 1023px)': {
      top: "270px",
    },
    '@media(min-width: 1024px) and (max-width: 1279px)': {
      width: '42%',
      top: "130px",
    },
    '@media(min-width: 1280px)': {
      width: '45%',
      top: "130px",
    }
  },
  containerFunctionalLocationsSearchs:{
    position: "absolute",    
    left: "10px",
    right: "10px",
    zIndex: 100,
    backgroundColor: "white",

    '@media(min-width: 320px) and (max-width: 1023px)': {
      top: "495px",
    },
    '@media(min-width: 1024px) and (max-width: 1279px)': {
      marginLeft: "46%",
      width: '42%',
      top: "130px",
    },
    '@media(min-width: 1280px)': {
      marginLeft: "48%",
      width: '45%',
      top: "130px",
    }
  },
  containerShowing:{
    position: "absolute", 
    top: "5px", 
    right: "10px"
  },
  containerSearchItems:{
    maxHeight: "200px",
    overflowY: "auto",
    ':first-child': {
      marginTop: "12px",
    }
  },
  containerSearchItem:{
    ':hover': {
      backgroundColor: "rgba(236, 123, 47, 0.64)"
    }
  },
  tooltip:{
    backgroundColor: "rgba(236,123,47,1)",
    color: "white"
  },
  dialogBody:{
    display: "block"     
  },
  accordionHeader : {
    fontSize: "10px"
  },
  containerPopupRight:{   
    position: "absolute",
    top: "10px",
    left: "10px",
    right: "10px",
    zIndex: 100,
    height: "123px",
    backgroundColor: "white",
    
    '@media(min-width: 1024px) and (max-width: 1279px)': {
      display: "grid",
      gridTemplateColumns: '46% 46% 8%',
    },
    '@media(min-width: 1280px)': {
      display: "grid",
      gridTemplateColumns: '48% 48% 4%',
    }
  },
});

let map : atlas.Map, mapPopup : atlas.Popup, mapDataSources : atlas.source.DataSource[] = [new atlas.source.DataSource], latitudeInitial : number = 25, longitudeInitial : number = 0, loadingMap = true, zoomDefaultSelectedPoint = 11;

const limitShowSearchPoint = 100;

const azureMapSubscriptionKey = 'SUBSCRIPTION_KEY';
const textToSearchDefault = "Press enter to search.";
//A duration for the animation in ms.
const mapDurationAnimationSelectedPoint = 2500;
//Max radius of the pulse circle. 
const mapMaxRadiusSelectedPoint = 30;


export const VesselMapComponent: React.FunctionComponent<IVesselMapProps> = (props) => {  
  const isLaptop = useMediaQuery({ query: '(min-width: 1024px) and (max-width: 1279px)' });
  const isMonitor = useMediaQuery({ query: '(min-width: 1280px) and (max-width: 1919px)' });
  const isPanonamic = useMediaQuery({ query: '(min-width: 1920px)' });

  const [loading, setLoading] = React.useState(true);

  const [textMessageToSearchVessel, setTextMessageToSearchVessel] = React.useState("");
  const [textSearchVessel, setTextSearchVessel] = React.useState("");
  const [listSearchVessel, setListSearchVessel] = React.useState<ComponentFramework.PropertyHelper.DataSetApi.EntityRecord[]>([]);
  const [listVessels, setListVessels] = React.useState<ComponentFramework.PropertyHelper.DataSetApi.EntityRecord[]>([]);
  const [showPointsInMapVessel, setShowPointsInMapVessel] = React.useState<CheckboxProps["checked"]>(true);
  const [limitValueSearchVessel, setLimitValueSearchVessel] = React.useState("searchTypeInJobs");
  const [selectedFiltersVessels, setSelectedFiltersVessels] = React.useState<IFilter[]>([{property: "inJob", value: [true]}]);

  const [textMessageToSearchFunctionalLocation, setTextMessageToSearchFunctionalLocation] = React.useState("");
  const [textSearchFunctionalLocation, setTextSearchFunctionalLocation] = React.useState("");  
  const [listSearchFunctionalLocations, setListSearchFunctionalLocations] = React.useState<any[]>([]);
  const [listFunctionalLocations, setListFunctionalLocations] = React.useState<any[]>([]);
  const [showPointsInMapFunctionalLocations, setShowPointsInMapFunctionalLocations] = React.useState<CheckboxProps["checked"]>(false);


  const toasterSearchResult = useId("SearchResults");
  const toasterSearchResultClose = useId("SearchResultsClose");
  const { dispatchToast: dispatchToastSearch, dismissToast: dissmissToastSearch} = useToastController(toasterSearchResult);
  
  const [showDialog, setShowDialog] = React.useState(false);
  const [textTitleWarning, setTextTitleWarning] = React.useState("");
  const [textDescriptionWarning, setTextDescriptionWarning] = React.useState("");
  const [showHideFilters, setShowHideFilters] = React.useState(true);

  const textTitleWarningDefault = "Unable to display vessel on the map.";
  const textDescriptionWarningDefault = "Vessel position data (longitud and latitude) not provided by external service.";
  const shipTypes = [{ text : "Fire Fighting Vessel", value : 920470000}, {text : "Fishing Vessel", value : 920470001}, {text : "Tug", value : 920470002}, {text : "General Cargo Ship", value : 920470003}, {text : "Bulk Carrier", value : 920470004}, {text : "Container Ship", value : 920470005}, {text : "Dry Cargo/Passenger", value : 920470006}, {text : "Oil Products Tanker", value : 920470007}, {text : "Chemical/Oil Products Tanker", value : 920470008}, {text : "Platform Supply Ship", value : 920470009}, {text : "Passenger Ship", value : 920470010}, {text : "Crude Oil Tanker", value : 920470011}, {text : "Passenger/Ro-Ro Cargo Ship", value : 920470012}, {text : "Offshore Tug/Supply Ship", value : 920470013},{text : "Bulk Carriers", value : 920470014}, {text : "Fishing", value : 920470015}, {text : "Tankers", value : 920470016}, {text : "Others", value : 0}];
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const Style = useStyles();

  useEffect(() => {
    console.log("Load fetchData");  
    loadData().then(async function(data){
      console.log("Load map"); 
  
      initMap(data).then(async () => {
        map.events.add('ready', async function () { 
          //Add the image sprite to the map style.
          await getIcons().then(function (mapIcons)
          {
              mapIcons.map(sprite => !map.imageSprite.hasImage(sprite.id) && map.imageSprite.add(sprite.id, sprite.url))              
          });

          //Disable the default UI interactions.
          if(props.lockInteractiveUser){

            map.setUserInteraction({
              boxZoomInteraction: false,
              dblClickZoomInteraction: false,
              dragPanInteraction: false,
              dragRotateInteraction: false,
              interactive: false,
              keyboardInteraction: false,
              scrollZoomInteraction: false,
              touchInteraction: false
            });
          }

          map.events.add('click', onClickMap);

          onClickClosePopup();
          // Initialize the popup
          mapPopup = new atlas.Popup();
          mapDataSources = [new atlas.source.DataSource];

          switch(props.modeLoad){
            case "DataSet":
              if(data.vessels.length > 0 && data.functionalLocations.length > 0)
              {                             
                addPointsInClusterBubble("vessels", data.vessels, undefined);
                addPointsInClusterBubble("functionalLocations", undefined, data.functionalLocations);
                
                configureShowHidePointsInMapVessel(showPointsInMapVessel === true);
                filterVessels(showPointsInMapVessel === true, "vessels", selectedFiltersVessels);
                configureShowHidePointsInMapFunctionalLocations(showPointsInMapFunctionalLocations === true);

                setLoading(false);
              }
              break;
            case "FieldPoint":
              if(props.longitudeFieldPoint === "" || props.latitudeFieldPoint === "" || props.textFieldPoint === "")
              {
                openDialog()
                return;
              }
    
              loadFieldPoint();              
              break;
            case "LookupPoint":
              if(props.lookupIdLookupPoint === "" || document.location.host.includes('localhost'))
              {
                openDialog();
                return;
              }
              await loadLookupPoint();
              break;
            default:
              break;
          }
        })
      }).catch(function(error) {
        console.error('Error loading map:', error);
      });      
    });
  }, [(props.modeLoad == "DataSet") ? props.dataSetPoints : props.modeLoad == "FieldPoint" ? (props.latitudeFieldPoint, props.longitudeFieldPoint, props.textFieldPoint) : props.modeLoad == "LookupPoint" ? props.lookupIdLookupPoint : null]);

  const loadData = async () => {
    let returnData : { vessels : any[], functionalLocations : any[] } = {vessels : [], functionalLocations : []};
    if(document.location.host.includes('localhost'))
    {      
      //
      // START ONLY LOCALHOST BY DEBUG
      //     

      //Get vessels       
      let arrayVessels : any[] = [];
      if(props.dataSetPoints != null && props.dataSetPoints != undefined && props.dataSetPoints.sortedRecordIds != null && props.dataSetPoints.sortedRecordIds != undefined)
      {
        for (let currentRecordId of props.dataSetPoints.sortedRecordIds) {
          let currentRecord = props.dataSetPoints.records[currentRecordId];
          arrayVessels.push(currentRecord);
        }
      }
      setListVessels(arrayVessels);
      returnData.vessels = arrayVessels;


      //Get functional Locations
      let functionalLocationDummy = `
      msdyn_country;msdyn_latitude;msdyn_longitude;msdyn_name;msdyn_shortname
      Denmark;55,03333;9,43333;Aabenraa;DKAAB
      Norway;62,03333;5,51667;Aaheim;NOAAH
      Western Sahara;27,08333;-13,43333;Aaiun;EHAAI
      Denmark;57,05;9,93333;Aalborg;DKAAL
      Norway;62,46667;6,15;Aalesund;NOAES
      Norway;62,55;7,65;Aandalsnes;NOAAN
      Denmark;56,16667;10,23333;Aarhus;DKAAR
      Greenland;68,71667;-52,86667;Aasiaat;GLAAS
      Iran;30,33333;48,28333;Abadan;IRABA
      Japan;44,01667;144,3;Abashiri;JPABA
      Australia;-19,85;148,08333;Abbot Point;AUABB
      United Kingdom;52,25;-4,26667;Aberaeron;GBABE
      United Kingdom;57,15;-2,08333;Aberdeen (United Kingdom);GBABD
      United States of America;46,93333;-123,85;Aberdeen (USA);USABU
      United Kingdom;52,55;-4,05;Aberdovey;GBABE
      Côte D'Ivoire;5,25;-4,01667;Abidjan;CIABI
      Côte D'Ivoire;5,26;-3,99;Abidjan;ABI
      Finland;60,45;22,25;Abo;FIABO
      Nigeria;5,7;4,48333;Abo Terminal;NGABT
      Nigeria;4,73333;6,76667;Abonnema;NGABO
      Japan;34,76667;134,56667;Aboshi;JPABO
      Spain;43,33333;-3;Abra;ESABR
      United Arab Emirates;25,46667;53,08333;Abu Al Bukhoosh;AEABU
      Iraq;30,46667;48;Abu Al Khasib;IQABU
      United Arab Emirates;24,51667;54,38333;Abu Dhabi;AEABD
      Iraq;30,46667;48,01667;Abu Fulus;IQABU
      Egypt;24,43333;35,2;Abu Ghosoun;EGABU
      Libya;33,08333;11,81667;Abu Kammash;LYABU
      Malaysia;6,13333;105,28333;Abu Marine Terminal;MYABU
      `;
      
      let lines = functionalLocationDummy.trim().split('\n');
      let headers = lines[0].split(';');
      let listFunctionalLocations : any[] = [];
      lines.slice(1).forEach((line) => {
        let columns = line.split(';');
        let record = {
          getFormattedValue: (fieldName: string): string => {
            let index = headers.indexOf(fieldName);
            return index !== -1 ? columns[index] : '';
          },
          getValue: (fieldName: string) => {
            let index = headers.indexOf(fieldName);
            return index !== -1 ? columns[index] : '';
          },
          getRecordId: () => {
            return columns[0]; // Assuming the first column is the record ID
          },
          getNamedReference: () => {
            return { id: { guid: columns[0] }, name: columns[3] }; // Assuming the first column is the ID and the second is the name
          }
        };
        listFunctionalLocations.push(record);
      });
      
      setListFunctionalLocations(listFunctionalLocations);
      console.log('Functional Locations loaded:', listFunctionalLocations.length);      
      returnData.functionalLocations = listFunctionalLocations;
    }else{
      if(props.modeLoad === "DataSet"){
        //Get vessels
        let arrayVessels : any[] = [];

        if(props.dataSetPoints != null && props.dataSetPoints != undefined && props.dataSetPoints.sortedRecordIds != null && props.dataSetPoints.sortedRecordIds != undefined)
        {
            for (let currentRecordId of props.dataSetPoints.sortedRecordIds) {
              let currentRecord = props.dataSetPoints.records[currentRecordId];
              arrayVessels.push(currentRecord);
            }
          returnData.vessels = arrayVessels;
          setListVessels(arrayVessels);
        }else if(listVessels.length > 0){
          returnData.vessels = listVessels;
        }

        if(listFunctionalLocations.length <= 0){
          //Get functional Locations
          let listFunctionalLocations = await getFunctionalLocations(props.webAPI);
          if(listFunctionalLocations != undefined && listFunctionalLocations.length > 0){
            setListFunctionalLocations(listFunctionalLocations);
            console.log('Functional Locations loaded:', listFunctionalLocations.length);
            returnData.functionalLocations = listFunctionalLocations;
          }
        }else{
          returnData.functionalLocations = listFunctionalLocations;
        }
      }     
    }
    return returnData;
  };

  const initMap = async (data : any) => {
    if (mapContainerRef.current) { 
      if(loading)
      {
        map = new atlas.Map(mapContainerRef.current, 
        { 
          renderWorldCopies: true, 
          showBuildingModels: true, 
          showFeedbackLink: false, 
          showLogo: true,
          //style: 'grayscale_dark',
          //zoom: props.minZoom,  
          maxZoom: props.maxZoom,
          minZoom: props.minZoom,
          center: [longitudeInitial, latitudeInitial],
          zoom: 2,              
          view: 'Auto', 
          language: 'en-EN', 
          authOptions: { authType: atlas.AuthenticationType.subscriptionKey, subscriptionKey: document.location.host.includes('localhost') ? azureMapSubscriptionKey : await getAzureMapSucriptionKey(props.webAPI) },
        });

        //map.setStyle({ renderWorldCopies: true, showBuildingModels: true, showFeedbackLink: false, showLogo: true }); 
        
        if(props.showControlsMap){
          map.controls.add(new atlas.control.StyleControl({
            //mapStyles: ['road', 'grayscale_dark', 'night', 'road_shaded_relief', 'satellite', 'satellite_road_labels'],
            mapStyles: ['road', 'night'],
            layout: 'icons',
          }), {
              position: atlas.ControlPosition.BottomLeft
          });
          map.controls.add(new atlas.control.CompassControl(), {
              position: atlas.ControlPosition.BottomLeft
          });
          map.controls.add(new atlas.control.PitchControl(), {
              position: atlas.ControlPosition.BottomLeft
          });
          map.controls.add(new atlas.control.FullscreenControl(), {
              position: atlas.ControlPosition.BottomRight
          });
          if(!props.lockInteractiveUser){
            map.controls.add(new atlas.control.ZoomControl(), {
                position: atlas.ControlPosition.BottomRight
            });  
          }    
          map.controls.add(new atlas.control.ScaleControl(), {
              position: atlas.ControlPosition.BottomRight
          });      
        }
      }      
    }
  }

  const loadFieldPoint = () => {  
    latitudeInitial = Number(String(props.latitudeFieldPoint).replace(",","."));
    longitudeInitial = Number(String(props.longitudeFieldPoint).replace(",","."));
   
    if(!isNaN(latitudeInitial) && !isNaN(longitudeInitial))
    {
      addPointVesselInMap([{name : props.textFieldPoint, longitude : longitudeInitial, latitude : latitudeInitial}]);
      showBubblePointSelected(longitudeInitial, latitudeInitial);

      let vesselConvert = mapperFieldsFromSearchVesselToPoint([{name : props.textFieldPoint, longitude : longitudeInitial, latitude : latitudeInitial}]);

      let shape : atlas.Shape = new atlas.Shape(new atlas.data.Point([longitudeInitial, latitudeInitial]), props.textFieldPoint, vesselConvert[0].properties); 
        
      onSearchSelectedShowPopup(shape);
      setLoading(false);
    }
  }

  const loadLookupPoint = async () => {
    let listSearchVessel  = await getLookupPoint(props.webAPI, props.lookupIdLookupPoint, 'msdyn_customerasset');
      
    if(listSearchVessel != undefined && listSearchVessel.length > 0)
    {
      latitudeInitial = Number(listSearchVessel[0].msdyn_latitude);
      longitudeInitial = Number(listSearchVessel[0].msdyn_longitude);
      if(longitudeInitial != 0 && latitudeInitial != 0){
        let vesselConvert = mapperFieldsFromSearchVesselToPoint(listSearchVessel);
          addPointVesselInMap(vesselConvert[0].properties);
          showBubblePointSelected(longitudeInitial, latitudeInitial);

          let shape : atlas.Shape = new atlas.Shape(new atlas.data.Point([longitudeInitial, latitudeInitial]), vesselConvert[0].properties.name, vesselConvert[0].properties); 
          
          onSearchSelectedShowPopup(shape);
          setLoading(false);
      }else{
        openDialog();
      }
    }  
  }

  const mapperFieldsFromSearchVesselToPoint = (listSearchVessel : any) => {
    let points : any = [];

    listSearchVessel.map((currentRecord: any) => {
      let point = {
        latitude : 0,
        longitude : 0,
        name : "",         
        MMSI : "",
        shipType : "0",
        flag : "",
        isoCODE : "",
        summerDraft : "",
        builtYear : "",
        heading : 0,
        imoID : "",
        breadthExtreme : "",
        callSign : "",
        email : "",
        grt : "",
        length : 0,
        portRegistryCode : "",
        sdwt : "",
        speed : "",
        destinationPoint : "",
        inJob : false,
      }

      switch(props.modeLoad){
        case "DataSet":
          if(typeof currentRecord.getRecordId !== "undefined"){
            point.name = currentRecord.getFormattedValue("msdyn_name");          
            point.latitude = Number(String(currentRecord.getValue("msdyn_latitude")).replace(",","."));
            point.longitude = Number(String(currentRecord.getValue("msdyn_longitude")).replace(",","."));
            if(currentRecord.getValue("mmsi") != null && currentRecord.getValue("mmsi") != undefined && currentRecord.getValue("mmsi") != "")
              point.MMSI = currentRecord.getValue("mmsi");
            if(currentRecord.getValue("typeofship") != null && currentRecord.getValue("typeofship") != undefined && currentRecord.getValue("typeofship") != "")
              point.shipType = currentRecord.getValue("typeofship");

            //a_c2800067de9d4f40b34789d0adc34b6f Name in relation from view Vessel Map in CRM
            if(currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.name") != null && currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.name") != undefined && currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.name") != "")
              point.flag = currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.name");
            if(currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.isocode") != null && currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.isocode") != undefined && currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.isocode") != "")
              point.isoCODE = currentRecord.getValue("a_c2800067de9d4f40b34789d0adc34b6f.isocode");

            if(currentRecord.getValue("flag.name") != null && currentRecord.getValue("flag.name") != undefined && currentRecord.getValue("flag.name") != "")
              point.flag = currentRecord.getValue("flag.name");
            if(currentRecord.getValue("flag.isocode") != null && currentRecord.getValue("flag.isocode") != undefined && currentRecord.getValue("flag.isocode") != "")
              point.isoCODE = currentRecord.getValue("flag.isocode");
            
            if(currentRecord.getValue("summerdraft") != null && currentRecord.getValue("summerdraft") != undefined && currentRecord.getValue("summerdraft") != "")
              point.summerDraft = currentRecord.getValue("summerdraft");
            if(currentRecord.getValue("builtyear") != null && currentRecord.getValue("builtyear") != undefined && currentRecord.getValue("builtyear") != "")
              point.builtYear = currentRecord.getValue("builtyear");
            if(currentRecord.getValue("heading") != null && currentRecord.getValue("heading") != undefined && currentRecord.getValue("heading") != "")
              point.heading = currentRecord.getValue("heading");
            if(currentRecord.getValue("boss_customerassetid") != null && currentRecord.getValue("boss_customerassetid") != undefined && currentRecord.getValue("boss_customerassetid") != "")
              point.imoID = currentRecord.getValue("boss_customerassetid");
            if(currentRecord.getValue("breadthextreme") != null && currentRecord.getValue("breadthextreme") != undefined && currentRecord.getValue("breadthextreme") != "")
              point.breadthExtreme = currentRecord.getValue("breadthextreme");
            if(currentRecord.getValue("callsign") != null && currentRecord.getValue("callsign") != undefined && currentRecord.getValue("callsign") != "")
              point.callSign = currentRecord.getValue("callsign");
            if(currentRecord.getValue("email") != null && currentRecord.getValue("email") != undefined && currentRecord.getValue("email") != "")
              point.email = currentRecord.getValue("email");
            if(currentRecord.getValue("grt") != null && currentRecord.getValue("grt") != undefined && currentRecord.getValue("grt") != "")
              point.grt = currentRecord.getValue("grt");
            if(currentRecord.getValue("length") != null && currentRecord.getValue("length") != undefined && currentRecord.getValue("length") != "")
              point.length = Number(currentRecord.getValue("length").toString());
            if(currentRecord.getValue("portregistrycode") != null && currentRecord.getValue("portregistrycode") != undefined && currentRecord.getValue("portregistrycode") != "")
              point.portRegistryCode = currentRecord.getValue("portregistrycode");
            if(currentRecord.getValue("sdwt") != null && currentRecord.getValue("sdwt") != undefined && currentRecord.getValue("sdwt") != "")
              point.sdwt = currentRecord.getValue("sdwt");
            if(currentRecord.getValue("speed") != null && currentRecord.getValue("speed") != undefined && currentRecord.getValue("speed") != "")
              point.speed = currentRecord.getValue("speed");
            if(currentRecord.getValue("destination") != null && currentRecord.getValue("destination") != undefined && currentRecord.getValue("destination") != "")
              point.destinationPoint = currentRecord.getValue("destination");
            
            point.inJob = true;          
          }else if(currentRecord.msdyn_name != undefined && currentRecord.msdyn_latitude != undefined && currentRecord.msdyn_longitude != undefined){
            point.name = currentRecord.msdyn_name;
            point.latitude = Number(String(currentRecord.msdyn_latitude).replace(",","."));
            point.longitude = Number(String(currentRecord.msdyn_longitude).replace(",","."));
            
            if(currentRecord.countrie != undefined)
              point.MMSI = currentRecord.mmsi;
            if(currentRecord.typeofship != undefined)
              point.shipType = currentRecord.typeofship;
            if(currentRecord.countrie != undefined && currentRecord.countrie.name != undefined)
              point.flag = currentRecord.countrie.name;
            if(currentRecord.countrie != undefined && currentRecord.countrie.isocode != undefined)
              point.isoCODE = currentRecord.countrie.isocode;
            if(currentRecord.summerdraft != undefined)
              point.summerDraft = currentRecord.summerdraft;
            if(currentRecord.builtyear != undefined)
              point.builtYear = currentRecord.builtyear;
            if(currentRecord.heading != undefined)
              point.heading = currentRecord.heading;
            if(currentRecord.boss_customerassetid != undefined)
              point.imoID = currentRecord.boss_customerassetid;
            if(currentRecord.breadthextreme != undefined)
              point.breadthExtreme = currentRecord.breadthextreme;
            if(currentRecord.callsign != undefined)
              point.callSign = currentRecord.callsign;
            if(currentRecord.email != undefined)
              point.email = currentRecord.email;
            if(currentRecord.grt != undefined)
              point.grt = currentRecord.grt;
            if(currentRecord.length != undefined)
              point.length = Number(currentRecord.length);
            if(currentRecord.portregistrycode != undefined)
              point.portRegistryCode = currentRecord.portregistrycode;
            if(currentRecord.sdwt != undefined)
              point.sdwt = currentRecord.sdwt;
            if(currentRecord.speed != undefined)
              point.speed = currentRecord.speed;
            if(currentRecord.destination != undefined)
              point.destinationPoint = currentRecord.destination;
            
            point.inJob = false;
          }else if(currentRecord.name != undefined && currentRecord.latitude != undefined && currentRecord.longitude != undefined){
            point = currentRecord;
          }
          break;
        case "LookupPoint":
          if(currentRecord.msdyn_name != undefined && currentRecord.msdyn_latitude != undefined && currentRecord.msdyn_longitude != undefined){
            point.name = currentRecord.msdyn_name;
            point.latitude = Number(String(currentRecord.msdyn_latitude).replace(",","."));
            point.longitude = Number(String(currentRecord.msdyn_longitude).replace(",","."));
            
            if(currentRecord.countrie != undefined)
              point.MMSI = currentRecord.mmsi;
            if(currentRecord.typeofship != undefined)
              point.shipType = currentRecord.typeofship;
            if(currentRecord.countrie != undefined && currentRecord.countrie.name != undefined)
              point.flag = currentRecord.countrie.name;
            if(currentRecord.countrie != undefined && currentRecord.countrie.isocode != undefined)
              point.isoCODE = currentRecord.countrie.isocode;
            if(currentRecord.summerdraft != undefined)
              point.summerDraft = currentRecord.summerdraft;
            if(currentRecord.builtyear != undefined)
              point.builtYear = currentRecord.builtyear;
            if(currentRecord.heading != undefined)
              point.heading = currentRecord.heading;
            if(currentRecord.boss_customerassetid != undefined)
              point.imoID = currentRecord.boss_customerassetid;
            if(currentRecord.breadthextreme != undefined)
              point.breadthExtreme = currentRecord.breadthextreme;
            if(currentRecord.callsign != undefined)
              point.callSign = currentRecord.callsign;
            if(currentRecord.email != undefined)
              point.email = currentRecord.email;
            if(currentRecord.grt != undefined)
              point.grt = currentRecord.grt;
            if(currentRecord.length != undefined)
              point.length = Number(currentRecord.length);
            if(currentRecord.portregistrycode != undefined)
              point.portRegistryCode = currentRecord.portregistrycode;
            if(currentRecord.sdwt != undefined)
              point.sdwt = currentRecord.sdwt;
            if(currentRecord.speed != undefined)
              point.speed = currentRecord.speed;
            if(currentRecord.destination != undefined)
              point.destinationPoint = currentRecord.destination;
            
            point.inJob = true;
          }else if(currentRecord.name != undefined && currentRecord.latitude != undefined && currentRecord.longitude != undefined){
            point = currentRecord;
          }
          break;
        case "FieldPoint":
          if(currentRecord.name != undefined && currentRecord.latitude != undefined && currentRecord.longitude != undefined){
            point = currentRecord;
          }
          break;
        default:
          break;
      }

      point.heading = (point.heading != undefined && (point.heading >= 0 && point.heading <= 360)) ? parseFloat(point.heading.toString()) : 0;

      if(!isNaN(point.latitude) && !isNaN(point.longitude)){
        let feature = new atlas.data.Feature(new atlas.data.Point([point.longitude, point.latitude]), {
          name: point.name,
          mmsi: point.MMSI,
          shipType: point.shipType,
          flag: point.flag,
          isoCODE: point.isoCODE,
          summerDraft: point.summerDraft,
          builtYear: point.builtYear,              
          heading: point.heading,
          latitude: point.latitude,
          longitude: point.longitude,
          imoID: point.imoID,
          breadthExtreme: point.breadthExtreme,
          callSign: point.callSign,
          email: point.email,
          grt: point.grt,
          length: isNaN(point.length) ? 0 : point.length,
          portRegistryCode: point.portRegistryCode,
          sdwt: point.sdwt,
          speed: point.speed,  
          destinationPoint: point.destinationPoint,
          inJob : point.inJob,
          icon: Number(point.speed) <= 0 ? "icon-vesselStill" : "icon-vesselAGoing"
  
        });

        feature.id = point.imoID;
        points.push(feature);            
      }      
    }); 

    return points;
  }

  const mapperFieldsToEntityRecordFromSearchVessel = (listSearchVessel : any) => {
    let records : any[] = [];
    
    listSearchVessel.forEach((vessel : any) => {
      let headers = Object.keys(vessel);
      let columns = Object.values(vessel);
      
      let record = {
        getFormattedValue: (fieldName: string): string => {
          let index = headers.indexOf(fieldName);
          return index !== -1 ? String(columns[index]) : '';
        },
        getValue: (fieldName: string) => {
          let index = headers.indexOf(fieldName);
          return index !== -1 ? String(columns[index]) : '';
        },
        getRecordId: () => {
          return String(columns[0]); // Assuming the first column is the record ID
        },
        getNamedReference: () => {
          return { id: { guid: String(columns[0]) }, name: columns[1] }; // Assuming the first column is the ID and the second is the name
        }
      };
      records.push(record);
    });

    return records;
  }

  const addPointVesselInMap = (properties : any) => {
    let point : any = [];

    if(!isNaN(properties.latitude) && !isNaN(properties.longitude)){
      let dataSource = new atlas.source.DataSource("vessels_"+properties.name.trim());

      if(map.sources.getById("vessels_"+properties.name) != undefined){
        map.layers.remove(map.layers.getLayerById("vessels_"+properties.name.trim()+"_layerPoint"));
        map.sources.remove(map.sources.getById("vessels_"+properties.name.trim()));
      }

      point = mapperFieldsFromSearchVesselToPoint([properties]); 

      dataSource.add(point);
      mapDataSources.push(dataSource);
      map.sources.add(dataSource);

      let layer = new atlas.layer.SymbolLayer(dataSource, "vessels_"+properties.name.trim()+"_layerPoint", {
        iconOptions: { allowOverlap: true, image: ['get', 'icon'], rotation: ['get', 'heading'] }
      });
 
      map.layers.add(layer);
      console.log('Layer added:', layer);
  
      map.events.add('click', layer, onClickShowPopup);

      console.log('Points loadFieldPoint added:', dataSource.toJson());
    } 
  }

  const getIcons = async () =>{
    let environmentUrl = "http://localhost:8181";

    if(!document.location.host.includes('localhost')){
      environmentUrl = await getUrlEnvironment(props.webAPI);
    }

    let icons = [{ id: 'icon-functionalLocation', url: environmentUrl+'/WebResources/functionalLocation.png' },
      { id: 'icon-vesselStill', url: environmentUrl+'/WebResources/iconvessel_still.png' },
      { id: 'icon-vesselAGoing', url: environmentUrl+'/WebResources/iconvessel_a_going.png' }]
    return icons;
  };

  const addPointsInClusterBubble = (sourceId : string, listSearchVessel : any[] | undefined, listFunctionalLocations : any[] | undefined) => {
    let points : any = [];
    let latitude = 0;
    let longitude = 0;
    let dataSource = new atlas.source.DataSource(sourceId,{
      //buffer: 128,
      //maxZoom: 18,
      cluster: true,
      clusterRadius: 45,
      clusterMaxZoom: 15,
      //lineMetrics: false,
      //tolerance: 0.375,
      clusterMinPoints: 10,
      //generateId: false
    });

    if(map.sources.getById(sourceId) != undefined){
      console.log("Remove source and layers "+sourceId+" from map");
      
      map.layers.remove(map.layers.getLayerById(sourceId+"_layerPoint"));
      map.layers.remove(map.layers.getLayerById(sourceId+"_layerBubblePoints"));
      map.layers.remove(map.layers.getLayerById(sourceId));
      map.sources.remove(map.sources.getById(sourceId));
    }

    if(map.sources.getById("pointSelected") != undefined){
      console.log("Add source pointSelected");
      map.layers.remove(map.layers.getLayerById("pointSelected_layerPoint"));
      map.sources.remove(map.sources.getById("pointSelected"));
    }

    if(listSearchVessel != undefined && listSearchVessel.length > 0)
    {
      console.log('list items in :' + sourceId, listSearchVessel.length);
      points = mapperFieldsFromSearchVesselToPoint(listSearchVessel);
    }

    if(listFunctionalLocations != undefined && listFunctionalLocations.length > 0)
    {
      console.log('listFunctionalLocations:', listFunctionalLocations.length);

      listFunctionalLocations.map((currentRecord: any) => {
        let name, shortName, country;
        if(document.location.host.includes('localhost'))
        {
          if(currentRecord.getFormattedValue("msdyn_name") != undefined)
            name = currentRecord.getFormattedValue("msdyn_name");          
          if(currentRecord.getValue("msdyn_latitude") != undefined)
            latitude = Number(String(currentRecord.getValue("msdyn_latitude")).replace(",","."));
          if(currentRecord.getValue("msdyn_longitude") != undefined)
            longitude = Number(String(currentRecord.getValue("msdyn_longitude")).replace(",","."));
          if(currentRecord.getValue("msdyn_shortname") != undefined)
            shortName = currentRecord.getValue("msdyn_shortname").toString().trim();
          if(currentRecord.getValue("msdyn_country") != undefined)
            country = currentRecord.getValue("msdyn_country").toString().trim();
        }else{
          if(currentRecord.msdyn_name != undefined)
            name = currentRecord.msdyn_name;          
          if(currentRecord.msdyn_latitude != undefined)
            latitude = Number(String(currentRecord.msdyn_latitude).replace(",","."));
          if(currentRecord.msdyn_longitude != undefined)
            longitude = Number(String(currentRecord.msdyn_longitude).replace(",","."));
          if(currentRecord.msdyn_shortname != undefined)
            shortName = currentRecord.msdyn_shortname.toString().trim();
          if(currentRecord.msdyn_country != undefined)
            country = currentRecord.msdyn_country.toString().trim();
        }

        if(!isNaN(latitude) && !isNaN(longitude)){

          let feature = new atlas.data.Feature(new atlas.data.Point([longitude, latitude]), {
            name: name,              
            latitude: latitude,
            longitude: longitude,
            code: shortName,
            country: country,

            icon: 'icon-functionalLocation'      
          });
          feature.id = shortName;
          points.push(feature); 
        }      
      }); 
    }
    
    if(points.length > 0){
      dataSource.add(points);
      mapDataSources.push(dataSource);
      map.sources.add(dataSource);

      addClusterBubbleInMap(dataSource);      
    } 
  };

  const addClusterBubbleInMap = (dataSource : atlas.source.DataSource) => {
    if(dataSource.getShapes().length > 0){
      let bubbleLayer = new atlas.layer.BubbleLayer(dataSource, dataSource.getId(), {
        createIndicators: true, // to enable bubble layer a11y feature
        //Scale the size of the clustered bubble based on the number of points in the cluster.
        radius: [
            'step',
            ['get', 'point_count'],
            20,         //Default of 20 pixel radius.
            100, 30,    //If point_count >= 100, then radius is 30 pixels.
            200, 40,    //If point_count >= 200, then radius is 40 pixels.
            300, 50,    //If point_count >= 300, then radius is 50 pixels.
            500, 60,    //If point_count >= 500, then radius is 60 pixels.
            600, 70     //If point_count >= 600, then radius is 70 pixels.
        ],
        pitchAlignment: 'map',
        //Change the color of the cluster based on the value on the point_cluster property of the cluster.
        color: dataSource.getId() === 'functionalLocations' ? 'rgba(168, 64, 0, 0.8)' : [
            'step',
            ['get', 'point_count'],
            'rgba(66,135,255,0.8)',
            10, 'rgba(66,135,255,0.8)'
        ],
        strokeWidth: 0,
        filter: ['has', 'point_count'] //Only rendered data points which have a point_count property, which clusters do.
      });

      //Add a click event to the layer so we can zoom in when a user clicks a cluster.
      //map.events.remove('click', map.layers.getLayerById(dataSource.getId()), onClickExpansionZoomInCluster);
      map.events.add('click', bubbleLayer, onClickExpansionZoomInCluster);

      //Add mouse events to change the mouse cursor when hovering over a cluster.
      map.events.add('mouseenter', bubbleLayer, function () {
          map.getCanvasContainer().style.cursor = 'zoom-in';
      });

      map.events.add('mouseleave', bubbleLayer, function () {
          map.getCanvasContainer().style.cursor = 'grab';
      });

      let layers = [
        bubbleLayer,

        //Create a symbol layer to render the count of locations in a cluster.
        new atlas.layer.SymbolLayer(dataSource, dataSource.getId() + "_layerBubblePoints", {
            iconOptions: {
                image: 'none' //Hide the icon image.
            },
            textOptions: {
                textField: ['get' , 'point_count_abbreviated'],
                offset: [0, 0.4],
                color: 'white',
            }
        }),

        //Create a layer to render the individual locations.
        new atlas.layer.SymbolLayer(dataSource, dataSource.getId() + "_layerPoint", {
            filter: ['!', ['has', 'point_count']], //Filter out clustered points from this layer.
            iconOptions: { allowOverlap: true, image: ['get', 'icon']},
        })
      ]

      if(!dataSource.getId().includes("functionalLocations")){
        (layers[2] as atlas.layer.SymbolLayer).setOptions( { iconOptions : { rotation: ['get', 'heading']}});
      }

      map.events.add('click', layers[2], onClickShowPopup);
      map.layers.add(layers);
    }
  }

  const onClickExpansionZoomInCluster = (e: any) => {
    if (e && e.shapes && e.shapes.length > 0 && e.shapes[0].properties.cluster) {
      //Get the clustered point from the event.
      var cluster = e.shapes[0];

      //Get the cluster expansion zoom level. This is the zoom level at which the cluster starts to break apart.
      mapDataSources.filter(k => k.getId() === cluster.source)[0].getClusterExpansionZoom(cluster.properties.cluster_id).then(function (zoom) {
          //Update the map camera to be centered over the cluster. 
          map.setCamera({
              center: cluster.geometry.coordinates,
              zoom: zoom,
              type: 'fly',
              duration: 200
          });
      });
  }
  }

  const onClickClosePopup  = () => {
    if(mapPopup != undefined)
      mapPopup.close();
  }

  const splitCamelCase = (text: string) => {
    if(text == "mmsi")
      return "MMSI";
    if(text == "imoID")
      return "IMO / ID";
    if(text == "sdwt")
      return "SDWT";
    if(text == "grt")
      return "GRT";
    

    return text
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Split camel case
    .replace(/\b\w/g, char => char.toUpperCase()).trim(); // Capitalize first letter of each word
  };

  const onSearchSelectedShowPopup = (shape: atlas.Shape) => {
    onClickClosePopup();

    if (shape) {
      const event = {
        shapes: [shape]
      };
  
      onClickShowPopup(event);
    }
  };

  const convertShipTypeValue = (value : string) => {
    return shipTypes.filter(k => k.value === Number(value))[0].text;
  }

  const onClickShowPopup = (e: any) => {
    if (e.shapes && e.shapes.length > 0) {
      let properties = e.shapes[0].getProperties();

      let contentHTML = "";
      let count = 0;

      switch(props.modeLoad){
        case "DataSet":
        case "LookupPoint":
          contentHTML = `
          <div class="popup" style="cursor:${props.popupType === 'Default' ? 'default' : 'move'};">
            <span class="tooltiptext">You can move the panel around the map</span>
            <table style="width:100%; border-collapse: collapse;">
              <tr colspan="4">
                <h1 style="padding: 5px; border-bottom: 1px solid #ddd;">${properties.isoCODE != null && properties.isoCODE != undefined && properties.isoCODE != "" ? `<img src="https://flagcdn.com/w320/${properties.isoCODE.toLowerCase()}.png" width="32" heigth="32" style="vertical-align: bottom;">${properties.name}</img>`: properties.name}</br>${properties.destinationPoint != null && properties.destinationPoint != undefined ? `<literal style='font-size:30px;'>&#8594;</literal><label style='font-size:18px;font-weight: bold;'>${properties.destinationPoint}</label>`: ""}</h1>
              </tr>`;
              
              for (let key in properties) {
                let value = "";
                let sufix = "";

                if(properties[key] != null && properties[key] != undefined && properties[key] != "null" &&  properties[key] != "undefined"){
                  value = properties[key].toString();
                  if(key === "latitude" || key === "longitude" || key === "heading")
                    sufix = "°";
                  if(key === "length")
                    sufix = " m";
                  if(key === "speed")
                    sufix = " Kn";
                  if(key === "grt" || key === "sdwt")
                    sufix = " MT";
                }

                if (
                  Object.prototype.hasOwnProperty.call(properties, key) &&
                  key !== "name" &&
                  key !== "icon" &&
                  key !== "_azureMapsShapeId" &&
                  key !== "destinationPoint" &&
                  key !== "isoCODE" &&
                  key !== "inJob"
                ) {
                  if (count % 2 === 0) {
                    if (count > 0) {
                      contentHTML += `</tr>`;
                    }
                    contentHTML += `<tr>`;
                  }
                  contentHTML += `
                    <td style="padding: 5px; border-bottom: 1px solid #ddd;"><b>${splitCamelCase(key)}</b></td>
                    <td style="padding: 5px; border-bottom: 1px solid #ddd;">${
                      (key === "shipType" ? convertShipTypeValue(value) : value) + sufix
                    }</td>`;
                  count++;
                }
              }
              if (count % 2 !== 0) {
                contentHTML += `<td colspan="2" style="padding: 5px; border-bottom: 1px solid #ddd;"></td></tr>`;
              } else {
                contentHTML += `</tr>`;
              }
          contentHTML += `
            </table>
          </div>`;
          break;
        case "FieldPoint":
          contentHTML = `
          <div style="padding:10px;box-shadow: 0px 0px 38px 6px rgba(236,123,47,1);min-width: 300px;max-width: 450px;">
            <table style="width:100%; border-collapse: collapse;">
              <tr colspan="2">
                <h1 style="padding: 5px; border-bottom: 1px solid #ddd;">${properties.name}</h1>
              </tr>
            </table>
          </div>`;
          break;
        default:
          break;
      }

      map.setCamera({
        type: loadingMap ? "jump" : "fly",
        center: e.shapes[0].getCoordinates(),
        zoom: zoomDefaultSelectedPoint === 0 ? props.zoomDefaultSelectedPoint : map.getCamera().zoom
      });

      if(loadingMap)
        loadingMap = false;

      let pixelOffset : atlas.Pixel = [0, 0];

      switch(props.popupType){
        case "Default":
          pixelOffset = [0, (e.shapes[0].dataSource == undefined || e.shapes[0].dataSource.id.includes('vessels')) ? -20 : -40];
          break;
        case "Right panel":
          pixelOffset = [450, (e.shapes[0].dataSource == undefined || e.shapes[0].dataSource.id.includes('vessels')) ? -80 : 0];
          break;
        case "Left panel":
          pixelOffset = [-450, (e.shapes[0].dataSource == undefined || e.shapes[0].dataSource.id.includes('vessels')) ? -80 : 0];
          break;
      }

      mapPopup.setOptions({
        content: contentHTML,
        position: e.shapes[0].getCoordinates(),
        pixelOffset: pixelOffset,
        showPointer: props.popupType === 'Default' ? true : false,
        draggable: props.popupType === 'Default' ? false : true
      });

      showBubblePointSelected(e.shapes[0].getCoordinates()[0], e.shapes[0].getCoordinates()[1]);

      mapPopup.open(map);
      zoomDefaultSelectedPoint = props.zoomDefaultSelectedPoint;
    }
  };

  const onChangeSearchVessel = (event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
    dissmissToastSearch(toasterSearchResultClose);

    if(newValue == undefined || newValue == null || newValue != null && newValue.length == 0)
    {
      setTextMessageToSearchVessel("");
      setTextSearchVessel("");
      setListSearchVessel([]);
    }else{
      if(textMessageToSearchVessel == "")
        setTextMessageToSearchVessel(textToSearchDefault);
      setTextSearchVessel(String(newValue));
    }
  };

  const onSearchVessel = async(newValue?: string) => {
    setListSearchVessel([]);
    console.log('onSearchVessel: ' + newValue);
    
    let arrayVessels = listVessels.filter(k => k.getFormattedValue("msdyn_name").toString().toLocaleLowerCase().includes(String(newValue).toLocaleLowerCase()) === true || String(k.getValue("boss_customerassetid")).toLocaleLowerCase().includes(String(newValue).toLocaleLowerCase()) === true);

    if(arrayVessels.length == 0){
      let vesselSearchs = await getSearchVessel(props.webAPI, String(newValue));

      arrayVessels = mapperFieldsToEntityRecordFromSearchVessel(vesselSearchs);
    }

    if(arrayVessels.length == 0){      
      dispatchToastSearch(
        <FluentProvider>
          <Toast>
            <ToastTitle>
              No vessels found for the search.
            </ToastTitle>
          </Toast>         
        </FluentProvider>,{toastId: toasterSearchResultClose, intent: 'warning'});
    }else{
      setListSearchVessel(arrayVessels);
    }   
  };

  const onSearchSelectVessel = (vesselSelect : any) => {
    console.log('onSearchSelectVessel: ' + vesselSelect.getFormattedValue("msdyn_name"));
    let arrayVessels = listSearchVessel.filter(k => k.getFormattedValue("mmsi") === vesselSelect.getFormattedValue("mmsi"));

    if(arrayVessels.length == 1){
      let name = arrayVessels[0].getFormattedValue("msdyn_name");
      var imoid = arrayVessels[0].getFormattedValue("boss_customerassetid");
      let latitude = Number(String(arrayVessels[0].getValue("msdyn_latitude")).replace(",","."));
      let longitude = Number(String(arrayVessels[0].getValue("msdyn_longitude")).replace(",","."));

      let sourcesVessels = mapDataSources.filter(k => k.getId() === "vessels")[0];
      zoomDefaultSelectedPoint = 0;
      if(sourcesVessels != undefined){
        let shapes = mapDataSources.filter(k => k.getId() === "vessels")[0].getShapes();
        let shape = shapes.find((shape: any) => shape.getId() === imoid);

        if (shape) {
          addPointVesselInMap(shape.getProperties());
          onSearchSelectedShowPopup(shape);
        }else{
          //New vessel from search result
          let vesselConvert = mapperFieldsFromSearchVesselToPoint(arrayVessels);
          addPointVesselInMap(vesselConvert[0].properties); 
          
          let shape : atlas.Shape = new atlas.Shape(new atlas.data.Point([longitude, latitude]), imoid, vesselConvert[0].properties);          
          onSearchSelectedShowPopup(shape);
        }  
      }

      // map.setCamera({
      //   type: "fly",
      //   center: [longitude, latitude],
      //   zoom: props.zoomDefaultSelectedPoint
      // });

      showBubblePointSelected(longitude, latitude);
    }

    setListSearchVessel([]);
    setTextSearchVessel("");
    setTextMessageToSearchVessel("");

    setListSearchFunctionalLocations([]);
    setTextSearchFunctionalLocation("");
    setTextMessageToSearchFunctionalLocation("");
  };

  const onChangeSearchFunctionalLocation = (event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
    dissmissToastSearch(toasterSearchResultClose);
    
    if(newValue == undefined || newValue == null || newValue != null && newValue.length == 0)
    {
      setTextMessageToSearchFunctionalLocation("")
      setTextSearchFunctionalLocation("");
      setListSearchFunctionalLocations([]);
    }else{
      if(textMessageToSearchFunctionalLocation == "")
        setTextMessageToSearchFunctionalLocation(textToSearchDefault)
      setTextSearchFunctionalLocation(String(newValue));
    }    
  };

  const onSearchFunctionalLocation = (newValue?: string) => {
    setListSearchFunctionalLocations([]);
    console.log('onSearchFunctionalLocation: ' + newValue);

    let functionalLocationsSearch = [];
    if(document.location.host.includes('localhost')){
      functionalLocationsSearch = listFunctionalLocations.filter(k => (k.getFormattedValue("msdyn_name") !== null && k.getFormattedValue("msdyn_name").toString().toLocaleLowerCase().includes(String(newValue).toString().toLocaleLowerCase()) === true) || (k.getValue("msdyn_shortname") !== null && k.getValue("msdyn_shortname").toString().toLocaleLowerCase().includes(String(newValue).toString().toLocaleLowerCase()) === true));
    }else{
      functionalLocationsSearch = listFunctionalLocations.filter(k => (k.msdyn_name !== null && k.msdyn_name.toString().toLocaleLowerCase().includes(String(newValue).toString().toLocaleLowerCase()) === true) || (k.msdyn_shortname !== null && k.msdyn_shortname.toString().toLocaleLowerCase().includes(String(newValue).toString().toLocaleLowerCase()) === true));
    }

    setListSearchFunctionalLocations(functionalLocationsSearch);
    console.log('Functional Locations found:', functionalLocationsSearch.length);    
      
    if(functionalLocationsSearch.length == 0){
      
      dispatchToastSearch(
        <FluentProvider>
          <Toast>
            <ToastTitle>
              No ports found for the search.
            </ToastTitle>
          </Toast>         
        </FluentProvider>,{toastId: toasterSearchResultClose, intent: 'warning'});
    }   
  };

  const onSearchSelectedFunctionalLocation = (functionalLocationSelect : any) => {
    let functionalLocationsSearch = [];
    if(document.location.host.includes('localhost')){
      console.log('onSearchSelectedFunctionalLocation: ' + functionalLocationSelect.getValue("msdyn_shortname").toString());
      functionalLocationsSearch = listFunctionalLocations.filter(k => k.getValue("msdyn_shortname") !== null && functionalLocationSelect.getValue("msdyn_shortname") !== null && k.getValue("msdyn_shortname").toString().toLocaleLowerCase() === String(functionalLocationSelect.getValue("msdyn_shortname").toString()).toString().toLocaleLowerCase());
    }else{
      console.log('onSearchSelectedFunctionalLocation: ' + functionalLocationSelect.msdyn_shortname);
      functionalLocationsSearch = listFunctionalLocations.filter(k => k.msdyn_shortname !== null && functionalLocationSelect.msdyn_shortname !== null && k.msdyn_shortname.toString().toLocaleLowerCase() === String(functionalLocationSelect.msdyn_shortname).toString().toLocaleLowerCase());
    }
    console.log('Functional Locations found:', functionalLocationsSearch.length);

    if(functionalLocationsSearch.length == 1){
      let name = "", shortName = "", latitude, longitude;
      if(document.location.host.includes('localhost')){
        name = functionalLocationsSearch[0].getFormattedValue("msdyn_name");
        shortName = functionalLocationsSearch[0].getFormattedValue("msdyn_shortname");
        latitude = Number(String(functionalLocationsSearch[0].getValue("msdyn_latitude")).replace(",","."));
        longitude = Number(String(functionalLocationsSearch[0].getValue("msdyn_longitude")).replace(",","."));
      }else{
        name = functionalLocationsSearch[0].msdyn_name;
        shortName = functionalLocationsSearch[0].msdyn_shortname;
        latitude = Number(functionalLocationsSearch[0].msdyn_latitude);
        longitude = Number(functionalLocationsSearch[0].msdyn_longitude);
      }

      const shapes = mapDataSources.filter(k => k.getId() === "functionalLocations")[0].getShapes();
      const shape = shapes.find((shape: any) => shape.getId() === shortName);
    
      if (shape) {
        zoomDefaultSelectedPoint = 0;
        onSearchSelectedShowPopup(shape);
      }     

      // map.setCamera({
      //   type: "fly",
      //   center: [longitude, latitude],
      //   zoom: props.zoomDefaultSelectedPoint
      // });

      showBubblePointSelected(longitude, latitude);
    }
    
    setListSearchFunctionalLocations([]);
    setTextSearchFunctionalLocation("");
    setTextMessageToSearchFunctionalLocation("");

    setListSearchVessel([]);
    setTextSearchVessel("");
    setTextMessageToSearchVessel("");
  };

  const showBubblePointSelected = (longitude : number, latitude : number) => {
    let dataSource = new atlas.source.DataSource("pointSelected");

    if(map.sources.getById("pointSelected") != undefined){
      console.log("Add source pointSelected");
      map.layers.remove(map.layers.getLayerById("pointSelected_layerPoint"));
      map.sources.remove(map.sources.getById("pointSelected"));
    }

    let point = new atlas.data.Point([longitude, latitude]);
    dataSource.add(point);
    mapDataSources.push(dataSource);
    map.sources.add(dataSource);

    //A bubble layer that will have its radius scaled during animation to create a pulse.
    let layer = new atlas.layer.BubbleLayer(dataSource, "pointSelected_layerPoint", {
      color: 'rgba(236,123,47,0.8)',
      radius: 0,
      opacity: 0,
      strokeWidth: 0,
      pitchAlignment: 'map'
    }); 

    map.layers.add(layer);

    requestAnimationFrame(animateBubbleSelectedPoint);
  }

  const onClickMap = () =>{
    setListSearchFunctionalLocations([]);
    setTextSearchFunctionalLocation("");
    setTextMessageToSearchFunctionalLocation("");

    setListSearchVessel([]);
    setTextSearchVessel("");
    setTextMessageToSearchVessel("");
  }

  function animateBubbleSelectedPoint (timestamp : number) {
    if(map.layers.getLayerById("pointSelected_layerPoint") != undefined){
      //Calculate progress as a ratio of the duration between 0 and 1.
      let progress = timestamp % mapDurationAnimationSelectedPoint / mapDurationAnimationSelectedPoint;

      //Early in the animaiton, make the radius small but don't render it. The map transitions between radiis, which causes a flash when going from large radius to small radius. This resolves that.
      if (progress < 0.1) {
        map.layers.getLayerById("pointSelected_layerPoint").setOptions({
              radius: 0,
              opacity: 0
          });
      } else {
        map.layers.getLayerById("pointSelected_layerPoint").setOptions({
              radius: mapMaxRadiusSelectedPoint * progress,

              //Have the opacity fade as the radius becomes larger.
              opacity: Math.max(0.9 - progress, 0)
          });
      }

      //Request the next frame of the animation.
      requestAnimationFrame(animateBubbleSelectedPoint);
    }
  }

  const openDialog = (title? : string, description? : string) => {
    setShowDialog(true);
    setTextTitleWarning(title == undefined ? textTitleWarningDefault : title);
    setTextDescriptionWarning(description == undefined ? textDescriptionWarningDefault : description);
  }

  const showMeOnMap = async (ev: React.MouseEvent<HTMLButtonElement>) =>{
    console.log('showOnMap');
    if (props.showCurrentLocationUser && navigator.geolocation) {

      navigator.geolocation.getCurrentPosition(function (position) {
        var userPosition = [position.coords.longitude, position.coords.latitude];
        var marker = new atlas.HtmlMarker({
            htmlContent: '<div class="currentIcon"></div>',
            position: userPosition
        });

        map.markers.add(marker);

      //Center the map on the users position.
      map.setCamera({
          type: "fly",
          center: userPosition,
          zoom: props.zoomDefaultSelectedPoint
      });
      }, function (error) {
          //If an error occurs when trying to access the users position information, display an error message.
          switch (error.code) {
              case error.PERMISSION_DENIED:
                  openDialog('Geolocation', 'User denied the request for Geolocation.');
                  break;
              case error.POSITION_UNAVAILABLE:
                  openDialog('Geolocation', 'Location information is unavailable.');
                  break;
              case error.TIMEOUT:
                  openDialog('Geolocation', 'The request to get user location timed out.');
                  break;
              default:
                  openDialog('Geolocation', 'An unknown error occurred.');
                  break;
          }
      });
    }
  };

  const onClickShowHideFilters = async (ev: React.MouseEvent<HTMLButtonElement>) =>{
    setShowHideFilters(!showHideFilters);
  }

  const onClickCloseDialog = async (ev: React.MouseEvent<HTMLButtonElement>) =>{
    setShowDialog(false); 
  }

  const onClickReloadPage = async (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement | HTMLAnchorElement | HTMLSpanElement | MouseEvent>) =>{
    window.location.reload();
  }
  
  const onClickShowPointsInMapVessels = (checked : CheckboxProps["checked"]) => {
    setShowPointsInMapVessel(checked);

    if(checked){
      onClickClosePopup();
      filterVessels(checked === true, limitValueSearchVessel === "searchTypeInJobs" ? "vessels" : "vessels_ALL", selectedFiltersVessels);
    }

    configureShowHidePointsInMapVessel(checked === true);
  };

  const configureShowHidePointsInMapVessel = (visibleOpt : boolean) => {
    if(visibleOpt === true){
      if(limitValueSearchVessel === "searchTypeInJobs"){
        mapDataSources.filter(k => k.getId() === "vessels").forEach(function(dataSource) {     
          hidePointsFromSourceInMap(dataSource.getId(), visibleOpt);
        });
        mapDataSources.filter(k => k.getId() === "vessels_ALL").forEach(function(dataSource) {     
          hidePointsFromSourceInMap(dataSource.getId(), !visibleOpt);
        });
      }else{
        mapDataSources.filter(k => k.getId() === "vessels").forEach(function(dataSource) {     
          hidePointsFromSourceInMap(dataSource.getId(), !visibleOpt);
        });
        mapDataSources.filter(k => k.getId() === "vessels_ALL").forEach(function(dataSource) {     
          hidePointsFromSourceInMap(dataSource.getId(), visibleOpt);
        });
      }
    }else{
      mapDataSources.filter(k => k.getId().includes("vessels")).forEach(function(dataSource) {     
        hidePointsFromSourceInMap(dataSource.getId(), visibleOpt);
      });
    }

    if(map.sources.getById("pointSelected") != undefined){
      console.log("Add source pointSelected");
      map.layers.remove(map.layers.getLayerById("pointSelected_layerPoint"));
      map.sources.remove(map.sources.getById("pointSelected"));
    }

    if(!visibleOpt)
      onClickClosePopup();
  }

  const hidePointsFromSourceInMap = (sourceId : string, visibleOpt : boolean) => {

    let layerVessels = map.layers.getLayerById(sourceId);
    if(layerVessels != undefined)
      layerVessels.setOptions( { visible: visibleOpt ? true : false});
    let layerVesselsBubblePoints = map.layers.getLayerById(sourceId+"_layerBubblePoints");
    if(layerVesselsBubblePoints != undefined)
      layerVesselsBubblePoints.setOptions( { visible: visibleOpt ? true : false});
    let layerVesselsPoints = map.layers.getLayerById(sourceId+"_layerPoint");
    if(layerVesselsPoints != undefined)
      layerVesselsPoints.setOptions( { visible: visibleOpt ? true : false});
  }

  const onClickShowHidePointsInMapFunctionalLocations = (checked : CheckboxProps["checked"]) => {
    setShowPointsInMapFunctionalLocations(checked);
    configureShowHidePointsInMapFunctionalLocations(checked ? true : false);
  };

  const configureShowHidePointsInMapFunctionalLocations = (visibleOpt : boolean) => {
    
    let layerFunctionalLocations = map.layers.getLayerById("functionalLocations");
    if(layerFunctionalLocations != undefined)
      layerFunctionalLocations.setOptions( { visible: visibleOpt ? true : false});
    let layerFunctionalLocationsBubblePoints = map.layers.getLayerById("functionalLocations_layerBubblePoints");
    if(layerFunctionalLocationsBubblePoints != undefined)
      layerFunctionalLocationsBubblePoints.setOptions( { visible: visibleOpt ? true : false});
    let layerFunctionalLocationsPoints = map.layers.getLayerById("functionalLocations_layerPoint");
    if(layerFunctionalLocationsPoints != undefined)
      layerFunctionalLocationsPoints.setOptions( { visible: visibleOpt ? true : false});

    if(!visibleOpt)
      onClickClosePopup();
  }

  const onClickRestoreZoom = () => {
    switch(props.modeLoad){
      case "DataSet":
          if(map.sources.getById("pointSelected") != undefined){
            map.layers.remove(map.layers.getLayerById("pointSelected_layerPoint"));
            map.sources.remove(map.sources.getById("pointSelected"));
          }   
          map.setCamera({
            type: "fly",
            center: [longitudeInitial, latitudeInitial],
            zoom: 2
          });
        break;
      case "FieldPoint":
      case "LookupPoint":
        map.setCamera({
          type: "fly",
          center: [longitudeInitial, latitudeInitial],
          zoom: props.zoomDefaultSelectedPoint
        });
        break;
      default:
        break;
    }
    onClickClosePopup();
  }

  const onSelectFiltersVessel: ComboboxProps["onOptionSelect"] = (event, data) => {
    console.log('onSelectFiltersVessel: ' + data.selectedOptions);
    let filters = selectedFiltersVessels;
    if(filters.filter(k => k.property === "shipType").length > 0){
      filters.splice(filters.findIndex(k => k.property === "shipType"), 1);
    }
    if(data.selectedOptions.length > 0){     
      filters.push({property: "shipType", value: data.selectedOptions});
      filterVessels(showPointsInMapVessel === true, limitValueSearchVessel === "searchTypeInJobs" ? "vessels" : "vessels_ALL", filters);    
    }else{
      filterVessels(showPointsInMapVessel === true, limitValueSearchVessel === "searchTypeInJobs" ? "vessels" : "vessels_ALL", filters);
    }
    console.log("SelectedFiltersVessels : " + JSON.stringify(filters));
    setSelectedFiltersVessels(filters);
  };

  const filterVessels = (visibility: boolean, sourceId: string, filters : IFilter[]) => {
    let filteredShapes: any[] = [];
    if(filters.length > 0){
      dissmissToastSearch(toasterSearchResultClose);

      if(map.sources.getById(sourceId) != undefined)
      {
        // Iterate through the mapDataSources to find the relevant data source
        mapDataSources.forEach((dataSource) => {
          if (dataSource.getId() === sourceId) {
            // Filter the shapes in the data source based on the shipType property
            dataSource.getShapes().filter((shape: any) => {
              let properties = shape.getProperties();
              let vesselPassFilters = "pending";

              filters.forEach((filter) => {
                if(filter.property === "shipType" && (vesselPassFilters === "pending" || vesselPassFilters === "true")){
                  if(filter.value.some(option => ((option === 0 || option === "0") ? (properties.shipType === undefined || properties.shipType === null || properties.shipType === "null" || properties.shipType === "") : (properties.shipType.toString().toLocaleLowerCase() === option.toString().toLocaleLowerCase())) )){
                    vesselPassFilters = "true";
                  }else{
                    vesselPassFilters = "false";
                  }
                }
                if(filter.property === "inJob" && (vesselPassFilters === "pending" || vesselPassFilters === "true")){
                  if(filter.value.some(option => properties.inJob === option)){
                    vesselPassFilters = "true";
                  }else{
                    vesselPassFilters = "false";
                  }
                }
              });  
              
              if(vesselPassFilters === "true"){
                filteredShapes.push(properties);
              }
            });
          }
        });
        console.log('Filtered Results:', filteredShapes.length);
        if(filteredShapes.length > 0){
          mapDataSources.filter(k => k.getId().includes("vessels")).forEach(function(dataSource) {     
            hidePointsFromSourceInMap(dataSource.getId(), false);
          });
          if(mapDataSources.filter(k => k.getId() === "vessels_Filter").length > 0)
          {
            mapDataSources.splice(mapDataSources.findIndex(k => k.getId() === "vessels_Filter"), 1);
          }
          addPointsInClusterBubble("vessels_Filter", filteredShapes, undefined); 
          
          dispatchToastSearch(
            <FluentProvider>
              <Toast>
                <ToastTitle>
                  {filteredShapes.length} vessels have been found for the selected filter.
                </ToastTitle>
              </Toast>         
            </FluentProvider>,{toastId: toasterSearchResultClose, intent: 'info'});
        }else{           
          dispatchToastSearch(
          <FluentProvider>
            <Toast>
              <ToastTitle>
                No vessel found for the selected filter.
              </ToastTitle>
            </Toast>         
          </FluentProvider>,{toastId: toasterSearchResultClose, intent: 'warning'});
        }
      }
    }else{
      if(mapDataSources.filter(k => k.getId() === "vessels_Filter").length > 0)
      {
        mapDataSources.splice(mapDataSources.findIndex(k => k.getId() === "vessels_Filter"), 1);
        if(map.layers.getLayerById("vessels_Filter_layerPoint") != undefined)
          map.layers.remove(map.layers.getLayerById("vessels_Filter_layerPoint"));
        if(map.layers.getLayerById("vessels_Filter_layerBubblePoints") != undefined)
          map.layers.remove(map.layers.getLayerById("vessels_Filter_layerBubblePoints"));
        if(map.layers.getLayerById("vessels_Filter") != undefined)
          map.layers.remove(map.layers.getLayerById("vessels_Filter"));
        if(map.sources.getById("vessels_Filter") != undefined)
          map.sources.remove(map.sources.getById("vessels_Filter"));  

        mapDataSources.filter(k => k.getId().includes(limitValueSearchVessel === "searchTypeInJobs" ? "vessels" : "vessels_ALL")).forEach(function(dataSource) {     
          hidePointsFromSourceInMap(dataSource.getId(), true);
        });         
      }     
    }
  }

  const onClickShowVesselsFromJobsOrNot: RadioGroupProps["onChange"] = async (event, data) => {
    console.log('onClickShowVesselsFromJobsOrNot: ' + data.value);
    let filters = selectedFiltersVessels;
    if(filters.filter(k => k.property === "inJob").length > 0){
      filters.splice(filters.findIndex(k => k.property === "inJob"), 1);
    }
    if(data.value === "searchTypeInJobs"){   
      hidePointsFromSourceInMap("vessels", true);
      filters.push({property: "inJob", value:  [true]});   
      filterVessels(showPointsInMapVessel === true, "vessels", filters); 
      
      hidePointsFromSourceInMap("vessels_ALL", false);
    }else{
      if(mapDataSources.filter(k => k.getId() === "vessels_ALL").length > 0){
        hidePointsFromSourceInMap("vessels_ALL", true);

        setSelectedFiltersVessels(filters);        
        filterVessels(showPointsInMapVessel === true, "vessels_ALL", filters);
        console.log("SelectedFiltersVessels : " + JSON.stringify(filters));
      }else{
        hidePointsFromSourceInMap("vessels", false);
        setLoading(true);
        let allVesselSearchs = await getAllVessel(props.webAPI);
  
        let arrayVessels = mapperFieldsToEntityRecordFromSearchVessel(allVesselSearchs);
  
        addPointsInClusterBubble("vessels_ALL", arrayVessels, undefined);
  
        filterVessels(showPointsInMapVessel === true, "vessels_ALL", filters);
        setLoading(false);
      }
    }
    setLimitValueSearchVessel(data.value);
  }


  return (  
    <FluentProvider theme={webLightTheme} style={{height: "100%", width: "100%"}}>
      <div className={Style.containerspinner}>
        <Spinner className={loading ? (Style.show, Style.spinner) : Style.hide} size="huge" label="Loading..." />  
      </div> 
      <div className={loading ? Style.hide : Style.root} style={{height: props.modeLoad === "DataSet" ? "702px" : "560px"}}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }}>
          <div className={Style.containerButtonRestoreZoom} style={{top : props.modeLoad === "DataSet" ? "572px" : "430px"}}>
            <Button icon={<GlobeSyncRegular />} onClick={onClickRestoreZoom}></Button>
          </div>
          <div className={Style.containerInputs} style={{minHeight: "50px", height: "auto", padding: "10px", borderRadius: "5px",  boxShadow: "0px 19px 38px 0px rgba(0,0,0,0.3)", visibility : (props.modeLoad === "DataSet" && showHideFilters) ? 'visible' : 'hidden'}} >
            <div style={{display: "block"}}>
              <Field key="fieldVessel" style={{margin : "10px 10px 0px 10px", height: "fit-content"}} label="Search vessel" validationState="none" validationMessageIcon={textMessageToSearchVessel == "" ? <div key={'emptyMessageIcon' + Math.random()}></div> : <SparkleFilled />} validationMessage={textMessageToSearchVessel == "" ? <div key={'emptyMessage' + Math.random()}></div> : textMessageToSearchVessel}>
                <SearchBox key="searchVessel" autoComplete='off' placeholder="Search by IMO or name" value={textSearchVessel} onChange={onChangeSearchVessel} onSearch={onSearchVessel} disabled={showPointsInMapVessel === false}/>              
              </Field>
              <div style={{margin : "0px 10px 0px 10px", height: "fit-content", display: "flex"}}>
                <RadioGroup value={limitValueSearchVessel} onChange={onClickShowVesselsFromJobsOrNot} layout="horizontal" disabled={showPointsInMapVessel === false}>
                  <Radio value="searchTypeInJobs" label="Show vessels in Jobs" />
                  <Radio value="searchTypeAlls" label="Show All" />
                </RadioGroup>
                <Combobox placeholder='Filters by vessels' style={{marginLeft : "20px", minWidth: "auto"}} multiselect={true} onOptionSelect={onSelectFiltersVessel} disabled={showPointsInMapVessel === false}>
                  <OptionGroup label="Ship type">
                    {shipTypes.map((ship) => {
                      return (<Option key={ship.value} value={ship.value.toString()}>
                        {ship.text}
                      </Option>)
                    })}
                  </OptionGroup>
                </Combobox>
                <Checkbox checked={showPointsInMapVessel === true} style={{height: "fit-content"}} size="medium" onChange={(ev, data) => onClickShowPointsInMapVessels(data.checked)} label="Show vessels"/>
              </div>
            </div>  
            <div style={{display: "block"}}>
              <Field key="fieldFunctionalLocation" style={{margin : "10px 10px 0px 10px", height: "fit-content"}} label="Search ports" validationState="none" validationMessageIcon={textMessageToSearchFunctionalLocation == "" ? <div key={'emptyMessageIcon' + Math.random()}></div> : <SparkleFilled />} validationMessage={textMessageToSearchFunctionalLocation == "" ? <div key={'emptyMessage' + Math.random()}></div> : textMessageToSearchFunctionalLocation}>
                <SearchBox key="searchFunctionalLocations" autoComplete='off' placeholder="Search by code or name" value={textSearchFunctionalLocation} onChange={onChangeSearchFunctionalLocation} onSearch={onSearchFunctionalLocation} disabled={showPointsInMapFunctionalLocations === false}/>              
              </Field>
              <Checkbox checked={showPointsInMapFunctionalLocations === true} style={{margin : "0px 10px 0px 10px", height: "fit-content", display: "flex"}} size="medium" onChange={(ev, data) => onClickShowHidePointsInMapFunctionalLocations(data.checked)} label="Show ports"/>
            </div>
            <div style={{display: "block"}}>
              <Button className={Style.buttonShowFilters} icon={<FilterRegular />} onClick={onClickShowHideFilters} style={{visibility : props.modeLoad === "DataSet" ? 'visible' : 'hidden'}}></Button>
              <Button className={Style.buttonShowOnMap} icon={<LocationRegular />} onClick={showMeOnMap} style={{visibility : (props.showCurrentLocationUser && showHideFilters) ? 'visible' : 'hidden'}}></Button>
            </div>
          </div>
          <div className={Style.containerVesselSearchs} style={ { visibility: (props.modeLoad === "DataSet" && listSearchVessel != null && listSearchVessel != undefined && listSearchVessel.length > 0) ? 'visible' : 'hidden', borderRadius: "0px 0px 5px 5px", padding: "10px" }}>
            <div className={Style.containerShowing}>Showing {listSearchVessel.length > limitShowSearchPoint ? 'firsts' : ''} {listSearchVessel.length > limitShowSearchPoint ? limitShowSearchPoint : listSearchVessel.length} of {listSearchVessel.length} vessels from the search</div>
            <List key="listSearchVessel" navigationMode="items">
              <div className={Style.containerSearchItems}>
                {listSearchVessel.slice(0, listSearchVessel.length > limitShowSearchPoint ? limitShowSearchPoint : listSearchVessel.length).map((currentRecord) => {
                  return (
                    <div key={'containerItem' + Math.random()} className={Style.containerSearchItem} style={{borderRadius: "0px 0px 5px 5px"}}>
                      <ListItem key={'parentItem' + Math.random()} onAction={() => onSearchSelectVessel(currentRecord)} style={{padding: "5px"}}>
                        <Persona key={currentRecord.getFormattedValue("msdyn_name") + Math.random()} name={currentRecord.getFormattedValue("msdyn_name")} secondaryText={String(currentRecord.getValue("boss_customerassetid"))} presence={{ status : "available"}}  />
                      </ListItem>
                    </div>
                  );
                })}
                </div>
            </List>           
          </div>
          <div className={Style.containerFunctionalLocationsSearchs} style={ { visibility: (props.modeLoad === "DataSet" && listSearchFunctionalLocations != null && listSearchFunctionalLocations != undefined && listSearchFunctionalLocations.length > 0) ? 'visible' : 'hidden', borderRadius: "5px", padding: "10px" }}>
            <div className={Style.containerShowing}>Showing {listSearchFunctionalLocations.length > limitShowSearchPoint ? 'firsts' : ''} {listSearchFunctionalLocations.length > limitShowSearchPoint ? limitShowSearchPoint : listSearchFunctionalLocations.length} of {listSearchFunctionalLocations.length} functional locations from the search</div>
            <List key="listFunctionalLocation" navigationMode="items">
              <div className={Style.containerSearchItems}>
                {listSearchFunctionalLocations.slice(0, listSearchFunctionalLocations.length > limitShowSearchPoint ? limitShowSearchPoint : listSearchFunctionalLocations.length).map((currentRecord) => {
                  return (
                    <div key={'containerItem' + Math.random()} className={Style.containerSearchItem} style={{borderRadius: "5px"}}>
                      <Tooltip key={'toolTipItem' + Math.random()} withArrow content={{ children: "Show on the map", className: Style.tooltip }} relationship="label">
                        <ListItem key={'parentItem' + Math.random()} onAction={() => onSearchSelectedFunctionalLocation(currentRecord)} style={{padding: "5px"}}>
                          { document.location.host.includes('localhost') ?
                            <Persona key={currentRecord.getFormattedValue("msdyn_name") + Math.random()} name={currentRecord.getFormattedValue("msdyn_name")} secondaryText={currentRecord.getFormattedValue("msdyn_shortname") !== null ? currentRecord.getFormattedValue("msdyn_shortname") : ""} presence={{ status : "available"}}  />
                          :
                            <Persona key={currentRecord.msdyn_name + Math.random()} name={currentRecord.msdyn_name} secondaryText={currentRecord.msdyn_shortname !== null ? String(currentRecord.msdyn_shortname) : ""} presence={{ status : "available"}}  />
                          }                          
                        </ListItem>
                      </Tooltip>                      
                    </div>
                  );
                })}
              </div>
            </List>            
          </div>
        </div>
      </div>  
      <Dialog open={showDialog}>
        <DialogSurface>
          <DialogBody className={Style.dialogBody}>
            <DialogTitle>{textTitleWarning}</DialogTitle>
            <DialogContent styles={{ header : { display : "none"}, inner : { padding: "20px 0px 20px 0px"}}}>
              {textDescriptionWarning}
            </DialogContent>
            <DialogActions>
              <DialogTrigger>
                <Button appearance="secondary" onClick={onClickCloseDialog}>Close</Button>
              </DialogTrigger>
              <DialogTrigger>
                <Button appearance="primary" onClick={onClickReloadPage}>Reload</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <Toaster toasterId={toasterSearchResult} position="top" offset={{ horizontal : -35, vertical : 189 }}/>   
    </FluentProvider>
  );
}
