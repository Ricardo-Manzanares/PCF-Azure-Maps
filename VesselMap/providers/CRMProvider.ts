import * as React from 'react';
import { IDataResponse} from '../components/IVesselMap';
import PromisePool from '@supercharge/promise-pool';

const concurrencyPromises = 30;

async function GetData(webAPI: any, entityName: string, options: string, nextLink?: string): Promise<IDataResponse> {
    let data: any[] = [];
    let totalRecords = 0;

    const fetchData = async (link?: string) => {
        const response = await webAPI.retrieveMultipleRecords(entityName, link ? link : options);
        data = data.concat(response.entities);
        totalRecords += response.entities.length;

        if (response.nextLink) {
            console.log("Get Data next link. Current records ", totalRecords);
            await fetchData(new URL(response.nextLink).search);
        }
    };

    await fetchData(nextLink);

    return { value: data, count: totalRecords };
}

export const getLookupPoint = async (webAPI: ComponentFramework.WebApi, lookupId : string, entityName: string) => {    
    let pointEntityResponse = await GetData(webAPI, entityName, "?$select=msdyn_name,builtyear,heading,mmsi,summerdraft,typeofship,destination,msdyn_latitude,msdyn_longitude,boss_customerassetid,breadthextreme,callsign,email,grt,lastupdate,length,portregistrycode,sdwt,speed&$expand=countrie($select=name,isocode)&$filter=(msdyn_customerassetid eq '"+lookupId+"')");
    let pointResponse : any[] = [];
    if(pointEntityResponse != undefined && pointEntityResponse.count != undefined && pointEntityResponse.count == 1)
    {        
        pointEntityResponse.value.map((k : any) => k).flat(1).forEach(function(record, indexRecord){
            pointResponse.push(record);
        });   
    }
    return pointResponse;
};

export const getAllVessel = async (webAPI: ComponentFramework.WebApi) => {  
    let vesselsPointsEntityResponse = await GetData(webAPI, "msdyn_customerasset", "?$select=msdyn_name,builtyear,heading,mmsi,summerdraft,typeofship,msdyn_latitude,msdyn_longitude,boss_customerassetid,breadthextreme,callsign,email,grt,lastupdate,length,portregistrycode,sdwt,speed,destination&$expand=countrie($select=name,isocode)&$filter=(_msdyn_customerassetcategory_value eq 361a6440-d5c5-ee11-9079-6045bd8d9be5 and msdyn_name ne null and msdyn_latitude ne null and msdyn_longitude ne null)");
    let vesselsPointsResponse : any[] = [];
    if(vesselsPointsEntityResponse != undefined && vesselsPointsEntityResponse.count != undefined && vesselsPointsEntityResponse.count > 0)
    {        
        vesselsPointsEntityResponse.value.map((k : any) => k).forEach(function(record, indexRecord){
            vesselsPointsResponse.push(record);
        });   
    }
    return vesselsPointsResponse;
};

export const getSearchVessel = async (webAPI: ComponentFramework.WebApi, textSearch : string) => {    
    let vesselSearch = `?fetchXml=<fetch distinct="true">
        <entity name="msdyn_customerasset">
        <attribute name="msdyn_name" />
        <attribute name="builtyear" />
        <attribute name="heading" />
        <attribute name="mmsi" />
        <attribute name="summerdraft" />
        <attribute name="typeofship" />
        <attribute name="msdyn_latitude" />
        <attribute name="msdyn_longitude" />
        <attribute name="boss_customerassetid" />
        <attribute name="breadthextreme" />
        <attribute name="callsign" />
        <attribute name="email" />
        <attribute name="grt" />
        <attribute name="lastupdate" />
        <attribute name="length" />
        <attribute name="portregistrycode" />
        <attribute name="sdwt" />
        <attribute name="speed" />
        <attribute name="destination" />
        <filter>
            <condition attribute="msdyn_customerassetcategory" operator="eq" value="361a6440-d5c5-ee11-9079-6045bd8d9be5" uiname="Vessel" uitype="msdyn_customerassetcategory" />
            <condition attribute="modifiedon" operator="last-x-days" value="14" />
            <filter type="or">
                <condition attribute="msdyn_name" operator="like" value="%`+textSearch+`%" />
                <condition attribute="boss_customerassetid" operator="like" value="%`+textSearch+`%" />
            </filter>
            <condition attribute="msdyn_latitude" operator="not-null" value="" />
            <condition attribute="msdyn_longitude" operator="not-null" value="" />
        </filter>
        <link-entity name="countries" from="countriesid" to="countrie" link-type="outer" alias="a_c2800067de9d4f40b34789d0adc34b6f" visible="true">
            <attribute name="name" />
            <attribute name="isocode" />
        </link-entity>
        <link-entity name="msdyn_workorderincident" from="primaryunit" to="msdyn_customerassetid" link-type="outer" alias="job"/>
        <filter type="and">
            <condition entityname="job" attribute="primaryunit" operator="null" />
        </filter>
        </entity>
    </fetch>`;

    let vesselsPointsEntityResponse = await GetData(webAPI, "msdyn_customerasset", vesselSearch);
    let vesselsPointsResponse : any[] = [];
    if(vesselsPointsEntityResponse != undefined && vesselsPointsEntityResponse.count != undefined && vesselsPointsEntityResponse.count > 0)
    {        
        vesselsPointsEntityResponse.value.map((k : any) => k).forEach(function(record, indexRecord){
            vesselsPointsResponse.push(record);
        });   
    }
    return vesselsPointsResponse;
};

export const getFunctionalLocations = async (webAPI: ComponentFramework.WebApi) => {  

    let portsEntityResponse = await GetData(webAPI, "msdyn_functionallocation", "?$select=msdyn_latitude,msdyn_longitude,msdyn_name,msdyn_shortname,msdyn_country&$filter=(msdyn_latitude ne null and msdyn_longitude ne null and msdyn_shortname ne null and msdyn_name ne null and statecode eq 0 and _msdyn_functionallocationtype_value eq 27374d86-9f81-ef11-ac20-6045bd8bef3a)");
    let functionalLocationsResponse : any[] = [];
    if(portsEntityResponse != undefined && portsEntityResponse.count !== undefined && portsEntityResponse.count > 0)
    {        
        portsEntityResponse.value.map((k : any)=> k).forEach(function(record, indexRecord){
            functionalLocationsResponse.push(record);
        });   
    }
    return functionalLocationsResponse;
};

export const getAzureMapSucriptionKey = async (webAPI: ComponentFramework.WebApi) => {  
    let azureMapSubscriptionKey = await GetData(webAPI, "environmentvariabledefinition", "?$select=defaultvalue,displayname,description&$filter=(displayname eq 'AzureMapSubscriptionKey')");
    if(azureMapSubscriptionKey != undefined && azureMapSubscriptionKey.count != undefined && azureMapSubscriptionKey.count == 1)
    {        
        return azureMapSubscriptionKey.value.map(k => k).flat(1)[0]["defaultvalue"];
    }else{
        return null;
    }
};

export const getUrlEnvironment = async (webAPI: ComponentFramework.WebApi) => {  
    let environmentUrl = await GetData(webAPI, "environmentvariabledefinition", "?$expand=environmentvariabledefinition_environmentvariablevalue($select=value)&$filter=(displayname eq 'Environment_URL') and (environmentvariabledefinition_environmentvariablevalue/any(o1:(o1/environmentvariablevalueid ne null)))");
    if(environmentUrl != undefined && environmentUrl.count != undefined && environmentUrl.count == 1)
    {        
        return environmentUrl.value.map(k => k).flat(1)[0]["environmentvariabledefinition_environmentvariablevalue"][0]["value"];
    }else{
        return null;
    }
};