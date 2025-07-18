export interface IVesselMapProps {
    webAPI: ComponentFramework.WebApi;
    onSave: (value: string) => void;
    showCurrentLocationUser: boolean;
    lockInteractiveUser: boolean;
    showControlsMap: boolean;
    modeLoad: string;
    maxZoom: number;
    minZoom: number;
    zoomDefaultSelectedPoint: number;
    popupType: string;

    dataSetPoints: ComponentFramework.PropertyTypes.DataSet | null;

    latitudeFieldPoint: string;
    longitudeFieldPoint: string;
    textFieldPoint: string;    

    lookupIdLookupPoint: string;
}

export interface ICRMEntityResponse {status : Boolean, node: string, entity : string, data : any}
export interface ICRMProviderResponse { entitys : any[], totalCount: number }
export interface IDataResponse {
    value: any[];
    nextLink?: string;
    count?: number;
}

export interface IPoint {    
    namePoint: string;
    shortNamePoint: string;
    latitudePoint: string;
    longitudePoint: string;
    builtYearPoint: string;   
    headingPoint: string;
    mmsiPoint: string;
    summerDraftPoint: string;
    typePoint: string;
    destinationPoint: string;
    bossCustomerAssetIdPoint: string;
    breadthExtremePoint: string;
    callSignPoint: string;
    emailPoint: string;
    grtPoint: string;
    lastUpdatePoint: string;
    lengthPoint: string;
    portRegistryCodePoint: string;
    sdwtPoint: string;
    speedPoint: string;
    countryPoint: string;
}

export interface IFilter {
    value: any[];
    property: string;
}