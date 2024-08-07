import paginationHelper from '../helpers/PaginationHelper.js'
import Airbnb from "../models/AirbnbModels.js";
import moment from 'moment'

export const getPropertyType = async (req, res) => {
  try {
    const {  startIndex = 1, itemsPerPage = 10 } = req.query
    
    const query = [
      paginationHelper.GenerateGroupQuery( { _id: '$property_type', total: { $count: {} } } ),
    ]

  const options = {
		startIndex: +startIndex,
		itemsPerPage: +itemsPerPage,
    projection: {
      _id:1,
      total:1,
		},
    query,
    sortObj:{_id:1}
  }
  const response = await paginationHelper.GenerateQueryWithPagination(options, Airbnb)
  return res.status(200).json({ ...response })
  } catch (error) {
		console.log('Error : ', error)
		res.status(500).json({ error: error.message })
	}
}

export const searchProperty = async (req, res) => {
	try {
    const {
		property_type,
		accommodates,
		startIndex = 1,
		itemsPerPage = 10,
		start_date,
		end_date,
		search,
	} = req.query

	if (!property_type) {
		return res.status(422).json({ error: 'Property type is required.' })
	}
	let dateDifference
	let query = []

	if (start_date && end_date) {
		const startDate = moment(start_date, 'YYYY-MM-DD')
		const endDate = moment(end_date, 'YYYY-MM-DD')
		if (startDate.isAfter(endDate)) {
			return res.status(400).json({
				error: 'start_date cannot be greater than end_date',
			})
		}

		if (!startDate.isValid() || !endDate.isValid()) {
			return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' })
		}

		const today = moment().startOf('day')
		if (startDate.isBefore(today) || endDate.isBefore(today)) {
			return res.status(400).json({ error: 'Dates cannot be in the past.' })
		}

		if (accommodates) {
		query.push(
			paginationHelper.GenerateMatchQuery({
				accommodates: { $lte: parseInt(accommodates) },
			})
		)
	}

		dateDifference = endDate.diff(startDate, 'days')
		console.log(dateDifference)

		query = [
		paginationHelper.GenerateAddFieldQuery({
			max_nights: { $toInt: '$maximum_nights' },
			min_nights: { $toInt: '$minimum_nights' },
		}),
		paginationHelper.GenerateMatchQuery({ property_type }),
	]

		query.push(
			paginationHelper.GenerateMatchQuery({
				['availability.availability_365']: { $lte: dateDifference },
				min_nights: { $eq: dateDifference },
				max_nights: { $gte: dateDifference },
			})
		)
	}
	

	
	if (search) {
		query.push(paginationHelper.GenerateSearchQuery(['name'], search))
	}

	const options = {
		startIndex: +startIndex,
		itemsPerPage: +itemsPerPage,
		projection: {
			listing_url: 1,
			name: 1,
			bedrooms: 1,
			host: 1,
			beds: 1,
			accommodates: 1,
			availability_365: 1,
			// minimum_nights: 1,
			// maximum_nights: 1,
			property_type: 1,
			min_nights: 1,
			max_nights: 1,
		},
		query,
		sortObj: { name: 1 },
	}
	const response = await paginationHelper.GenerateQueryWithPagination(options, Airbnb)
	return response.items === 0 
    ? res.status(200).json({ message: "Back to the previous index, no more items are found" }) 
    : res.status(200).json({ ...response });
  } catch (error) {
    console.log( error )
    res.status(500).json({error: error.message})
  }
}

