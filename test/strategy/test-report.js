const axios = require('axios');
const prettyMs = require('pretty-ms');

const strategy = require('./../../src/strategy');

const now = () => new Date().toUTCString()

// get ready the end point. using the simple search api.
var endPoint = "https://dev-acis-attivio.sites.leocorn.com/rest/searchApi/search";

var allNeighborsQuery = {
    // TODO: all more cities.
    //"query": "AND(table:xmldata,OR(city:toronto,city:markham))",
    "query": "OR(city:toronto,city:markham)",
    "queryLanguage":"advanced",
    "workflow": "search",
    "facets":["neighbourhoodname(maxBuckets=-1)"]
};

axios.post(endPoint, allNeighborsQuery)
.then(function(response) {
    // get facet bucket.
    var buckets = response.data.facets[0].buckets;
    // agents by neighbourhood, it will have the following format:
    // { "neighbourhood one" : [
    //     {agentid, agentname, agentphone},
    //     {agentid, agentname, agentphone}
    //   ],
    //   "neighbourhood two" : [
    //   ],
    // }
    var agents = {};
    // iterate over buckets.
    strategy.iterateOver(buckets,
        /**
         * process each bucket.
         * the signature is defined in strategy.iterateOver.
         */
        function(bucket, report){
            var allAgentsQuery = {
                "query": "neighbourhoodname:\"" + bucket.value + "\"",
                "queryLanguage": "advanced",
                "workflow": "search",
                "rows": 100
            };
            //console.log(allAgentsQuery);
            axios.post(endPoint, allAgentsQuery)
            .then(function(response) {
                console.log("total hits: " + response.data.totalHits);
                // set up the neighbourhood.
                agents[bucket.value] = [];
                var docs = response.data.documents;
                docs.forEach(function(doc) {
                    var oneAgent = [];
                    doc.fields.hasOwnProperty('agentid') ?
                        oneAgent.push(doc.fields['agentid'][0]):
                        oneAgent.push("");
                    doc.fields.hasOwnProperty('agentname') ?
                        oneAgent.push(doc.fields['agentname'][0]):
                        oneAgent.push("");
                    doc.fields.hasOwnProperty('agentphone') ?
                        oneAgent.push(doc.fields['agentphone'][0]):
                        oneAgent.push("");
                    // store it.
                    agents[bucket.value].push(oneAgent);
                });

                // report done.
                report();
            })
            .catch(function(err) {
                console.log("Erro for neighbourhood: " + bucket.value);
                report();
            });
        },
        function() {
            console.log(agents);
        }
    );
})
.catch(function(error) {
    // when error happens:
    console.log(error);
});
