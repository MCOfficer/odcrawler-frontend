export default class API {

  constructor(baseUrl) {

    this.baseUrl = baseUrl;
    this.apiEndpoint = `${this.baseUrl}/meili/indexes/links`;
    this.apiKey = process.env.VUE_APP_API_KEY;

  }

  parseResult(rawResults) {

    let parsedResults = {
      query: rawResults.query,
      hits: this.parseHits(rawResults.hits),
      totalHits: rawResults.nbHits,
    }

    return parsedResults;
    
  }

  parseHits(rawHits) {
    return rawHits.map(hit => {
      return {
        id: hit.id,
        url: hit.url,
        highlights: [...new Set(hit._formatted.url.match(/(?<=<em>)(.*?)(?=<\/em>)/g))],
        size: hit.size || -1,
      }
    })
  }

  parseStats(rawStats) {

    let parsedStats = {
      totalIndexed: rawStats.numberOfDocuments,
      isIndexing: rawStats.isIndexing,
      types: rawStats.fieldsDistribution,
    }

    return parsedStats;
    
  }

  search(query, offset = 0, limit = 20) {
    return new Promise((resolve, reject) => {

        fetch(this.apiEndpoint + `/search?q=${query}&offset=${offset}&limit=${limit}&attributesToHighlight=url`, {
          mode: 'cors',
          method: 'GET',
          headers: {
            'X-Meili-API-Key': this.apiKey,
          }
        })
        .then(response => {
          return response.json();
        })
        .then(result => {
          return resolve(this.parseResult(result));
        })
        .catch(err => {
          console.warn(`Failed to fetch results:`, err);
          return reject(`Couldn't fetch results!`);
        })
    
    })
  }

  async retrieveStats() {

    let res, stats;

    try {
      res = await fetch(this.baseUrl + `/stats.json`, {
        mode: 'cors',
        method: 'GET',
        headers: {
          // 'X-Meili-API-Key': this.apiKey,
        }
      })
    } catch (err) {
      console.warn(err);
      throw new Error(`Couldn't retrieve stats`);
    }

    try {
      stats = await res.json()
    } catch (err) {
      console.warn(err);
      throw new Error(`Error while parsing the stats, the server didn't respond with a valid json string!`);
    }

    return this.parseStats(stats);
    
  }

}