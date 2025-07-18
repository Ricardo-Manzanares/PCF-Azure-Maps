import { IVesselMapProps } from "./components/IVesselMap";
import { VesselMapComponent } from "./components/VesselMap";
import { IInputs, IOutputs } from "./generated/ManifestTypes";

import * as React from "react";

export class VesselMap implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private theComponent: ComponentFramework.ReactControl<IInputs, IOutputs>;
    private notifyOutputChanged: () => void;
    private onValueSaved : string;

    /**
     * Empty constructor.
     */
    constructor() { }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        let parameters : IVesselMapProps;
        parameters = {
            webAPI : context.webAPI,
            onSave: this.onSave.bind(this),
            showCurrentLocationUser : context.parameters.showCurrentLocationUser.raw === "True",
            lockInteractiveUser : context.parameters.lockInteractiveUser.raw === "True",
            showControlsMap : context.parameters.showControlsMap.raw === "True",
            modeLoad : context.parameters.modeLoad.raw,
            maxZoom : context.parameters.maxZoom.raw ?? 20,
            minZoom : context.parameters.minZoom.raw ?? 15,
            zoomDefaultSelectedPoint : context.parameters.zoomDefaultSelectedPoint.raw ?? 13,
            popupType : context.parameters.popupType.raw ?? 'Default',
            
            //Load points from dataset
            dataSetPoints : null,

            //Load points from fields
            latitudeFieldPoint : context.parameters.latitudeFieldPoint.raw ?? '',
            longitudeFieldPoint : context.parameters.longitudeFieldPoint.raw ?? '',
            textFieldPoint : context.parameters.textFieldPoint.raw ?? '',

            //Load points from entity
            lookupIdLookupPoint : (context.parameters.lookupIdLookupPoint.raw != null && context.parameters.lookupIdLookupPoint.raw != undefined) ? context.parameters.lookupIdLookupPoint.raw[0].id  : "",
        } 

        if (!context.parameters.dataSetPoints.loading) {

            if (context.parameters.dataSetPoints.paging != null && context.parameters.dataSetPoints.paging.hasNextPage == true) {
            
            //set page size
            
            context.parameters.dataSetPoints.paging.setPageSize(5000);
            
            //load next paging
            
            context.parameters.dataSetPoints.paging.loadNextPage();
            console.log("Load points from dataset, current : " + context.parameters.dataSetPoints.sortedRecordIds.length);
            } else {
                parameters.dataSetPoints = context.parameters.dataSetPoints;
            
            }
            
        }
        return React.createElement(VesselMapComponent, parameters);  
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return { };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }

    private onSave(value : string){
        this.onValueSaved = value;
        this.notifyOutputChanged();
    }
}
