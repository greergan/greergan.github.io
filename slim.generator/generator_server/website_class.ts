import * as slim from "./slim_modules.ts";
import * as interfaces from "./website_class_interfaces.ts";
export class WebSite implements interfaces.WebSite {
    private configuration:interfaces.WebSiteClassConfiguration;
    constructor(configuration:interfaces.WebSiteConfiguration) {
        this.configuration = configuration;
    }
}