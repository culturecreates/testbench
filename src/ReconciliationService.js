
import { fetchParams, postParams } from './utils.js';
import { specVersions } from './JsonSchemas.js';
import { getSchema } from './JsonValidator.js';

export default class ReconciliationService {
    constructor(endpoint, manifest) {
       this.endpoint = ReconciliationService.normalizeEndpoint(endpoint);
       this.manifest = manifest;

       // test the service's manifest against manifest schemas
       // for all known versions of the specs, in order.
       this.latestCompatibleVersion = null;
       for (var version of specVersions) {
            let schema = getSchema(version, 'manifest');
            let valid = schema(manifest);
            if (valid) {
               this.latestCompatibleVersion = version;
           }
       }
    }

    getFetcher() {
       return fetchParams;
    }

    postFetcher() {
      return postParams;
   }

   // If the endpoint is missing a protocol (e.g. "www.example.com/api"),
   // default it to https:// so users don't have to type it explicitly.
   static normalizeEndpoint(endpoint) {
      if (typeof endpoint !== 'string') {
         return endpoint;
      }
      let trimmed = endpoint.trim();
      if (trimmed === '' || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
         return trimmed;
      }
      return `https://${trimmed}`;
   }
}


