const axios = require('axios');

const launchesDatabase = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100;

const launch = {
    flightNumber: 100,
    mission: 'Kepler Exploration X',
    rocket: 'Explorer IS1',
    launchDate: new Date('December 27, 2030'),
    target: 'Kepler-442 b',
    customer: ['ZTM', 'NASA'],
    upcoming: true,
    success: true,
};

saveLaunch(launch);

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');
    if(!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
}

async function getLaunches() {
    return await launchesDatabase.find({}, {
        '_id': 0,
        '__v': 0
    })
}

async function saveLaunch(launch) {
    

    try {
        await launchesDatabase.findOneAndUpdate({
            flightNumber: launch.flightNumber,
        }, launch, {
            upsert: true,
        });
    } catch(err) {
        console.error(`Could not save planet. ${err}`)
    }
}

async function abortLaunchById(launchId) {
    const aborted =  await launchesDatabase.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false,
    });

    return aborted.ok === 1 && aborted.nModified === 1;
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        kepler_name: launch.target,
    });

    if(!planet) {
        throw new Error('No matching planets found');
    }

    const newFlightNumber = await getLatestFlightNumber() + 1;
    const newLaunch = Object.assign(launch, {
        customer: ['Zero to Mastery', 'NASA'],
        upcoming: true,
        success: true,
        flightNumber: newFlightNumber,
    })

    await saveLaunch(newLaunch);
}

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL, {
      query: {},
      options: {
        pagination: false,
        populate: [
          {
            path: 'rocket',
            select: {
              name: 1
            }
          },
          {
            path: 'payloads',
            select: {
              'customers': 1
            }
          }
        ]
      }
    });

    if (response.status !== 200) {
        console.log('Problem downloading launch data');
        throw new Error('Launch data download failed')
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })

        const launch = {
                flightNumber: launchDoc['flight_number'],
                mission: launchDoc['name'],
                rocket: launchDoc['rocket']['name'],
                launchDate: launchDoc['date_local'],
                upcoming: launchDoc['upcoming'],
                success: launchDoc['success'],
                customers,
        };
        console.log(`${launch.flightNumber} ${launch.mission}`);

    await saveLaunch(launch);
    }
}

async function loadLaunchesData() {
    const firstLaunch = await findLaunch({
        flight_number: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });

    if (firstLaunch) {
        console.log('Launch data already loaded');
        return
    } else {
        await populateLaunches();
    }    
  }

module.exports = {
    getLaunches,
    scheduleNewLaunch,
    existsLaunchWithId,
    abortLaunchById,
    loadLaunchesData
}