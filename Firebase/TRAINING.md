# Thomas

## Some Booking
```
I want to book a flight
```
## Booking with waypoints
```
I want to book a flight from Malta to Moscow
```

## Empty order
```json
{
  "data": {
    "flightOrder": null,
    "cateringDetails": null,
    "transferDetails": null
  }
}
```

# Flight

## Partial request, no order
```
Here is the summary of the order and your next task: The client wants to book a flight to Moscow.
No active flight order so far.
```

## Crew
```json
{
  "result": [
    {
      "id": "WAYPOINTS",
      "name": "Lady Hatt",
      "helpsWith": "Gets and validates waypoints from the user. Call her each time you need a waypoint from user or need to validate some waypoint input."
    },
    {
      "id": "FLIGHT_OPTIONS",
      "name": "Harold",
      "helpsWith": "In charge of flight details: airports, departure times, passengers, etc. Example. 1) Client: 'I want to add two more passengers' 2) Call Harold with the request: 'Flight options change. Add 2 more passengers'",
      "preRequisites": "Call Call 'canSwitchTo' with 'assistantId' set to 'FLIGHT_OPTIONS' EACH TIME before asking him for help. The function will validate if flight details could be processed."
    }
  ]
}
```

## Waypoint response
```json
{
  "result": [
    {
      "description": "Departure",
      "waypoint": {
        "value": "28 Broadway, New York, NY 10004",
        "location": {
          "latitude": 40.705818,
          "longitude": -74.013164
        },
        "types": [
          "street_address"
        ]
      }
    },
    {
      "description": "Arrival",
      "waypoint": {
        "value": "Moscow, Russia",
        "location": {
          "latitude": 55.75396,
          "longitude": 37.620393
        },
        "types": [
          "political"
        ]
      }
    }
  ]
}
```

## Planes response
```json
{
  "result": {
    "availablePlanes": [
      {
        "id": 1,
        "name": "Plane type 1",
        "maximumPassengersOnBoard": 1,
        "default": false
      },
      {
        "id": 2,
        "name": "Plane type 2",
        "maximumPassengersOnBoard": 2,
        "default": true
      }
    ]
  }
}
```