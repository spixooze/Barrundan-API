import googlePlaces from './googlePlaces'
import pickRandomBars from './pickRandomBars'
import { firstAndLastBar } from './sortByDistance'
import { getRoute } from './google_directions'
import { getSaturdayDate } from './date'

import Barrunda from '../models/barrunda'

const cities = [
  {
    name: 'malmö',
    location: '55.607734, 13.000319',
    radius: 1000,
    type: 'bar',
    keyword: 'pub',
    numberOfBars: 4
  }
]

export const createAll = () => {
  cities.forEach(async city => {
    await createBarRound(city)
  })
}

const createBarRound = async city => {
  const googlePlaceBars = await googlePlaces(city)
  const bars = pickRandomBars(googlePlaceBars, city.numberOfBars).map(bar => {
    return {
      name: bar.name,
      rating: bar.rating,
      address: bar.vicinity,
      location: bar.geometry.location,
      googlePlaceId: bar.place_id
    }
  })
  const firstAndLast = firstAndLastBar(bars)

  const waypoints = bars.filter(bar => {
    if (
      bar.googlePlaceId != firstAndLast[0].googlePlaceId &&
      bar.googlePlaceId != firstAndLast[1].googlePlaceId
    ) {
      return bar
    }
  })

  const routes = await getRoute(firstAndLast[0], firstAndLast[1], waypoints)
  console.log(routes)

  let randomBars = []
  routes.geocoded_waypoints.map(point => {
    bars.forEach(bar => {
      if (bar.googlePlaceId == point.place_id) {
        randomBars.push(bar)
      }
    })
  })

  const barRoundStartTime = getSaturdayDate()
  const barStartTimes = [
    barRoundStartTime.setHours(13, 0, 0, 0),
    barRoundStartTime.setHours(14, 0, 0, 0),
    barRoundStartTime.setHours(15, 0, 0, 0),
    barRoundStartTime.setHours(16, 0, 0, 0)
  ]

  let finalBarList = []
  randomBars.map((bar, index) => {
    finalBarList.push({
      ...bar,
      startTime: barStartTimes[index],
      endTime: barStartTimes[index] + 3600000
    })
  })
  // datum mög klart

  const newRunda = new Barrunda({
    city: city.name,
    startTime: barRoundStartTime.setHours(13, 0, 0, 0),
    bars: finalBarList
  })

  newRunda.save((err, runda) => {
    if (err) {
      console.log(err)
    }
    console.log(runda)
  })
}

export const getLatestRound = async () => {
  const nowDate = new Date()
  nowDate.setHours(nowDate.getHours() - 6) // Hur länge ska en runda vara aktiv?
  try {
    const barrunda = await Barrunda.findOne({ startTime: { $gt: nowDate } })
    return barrunda
  } catch (e) {
    console.log(e)
  }
}
