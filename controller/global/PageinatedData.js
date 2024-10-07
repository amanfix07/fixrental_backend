const client = require('../../db/config/dbConfig');
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getPaginatedData = async (dbName, collectionName, page, limit, filterParams, filter, mainfilter_param, mainfilter) => {
  // await sleep(3000);
  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  try {
    // Validate page and limit
    const currentPage = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * pageSize;

    // Build filter query
    let filterQuery = {};
    
    // Add main filter if it exists
    if (mainfilter_param && mainfilter) {
      filterQuery[mainfilter_param] = isNaN(mainfilter) ? { $regex: mainfilter, $options: 'i' } : parseInt(mainfilter, 10);
    }

    // Add additional filters if they exist
    if (filter && filterParams && filterParams.length > 0) {
      const filterValue = isNaN(filter) ? filter : filter.toString();
      
      const additionalFilters = filterParams.map(field => ({
        [field]: isNaN(filter) ? { $regex: filterValue, $options: 'i' } : parseInt(filterValue, 10)
      }));

      // Ensure both main filter and additional filters must match
      filterQuery = {
        $and: [
          filterQuery,
          { $or: additionalFilters }
        ]
      };
    }

    // Fetch paginated data
    let items;
    if (pageSize === 1000) {
      // Special case for large datasets: Avoid pagination if not needed
      items = await collection.find(filterQuery).skip(currentPage * 100).limit(100).toArray();
    } else {
      // Use pagination for normal cases
      items = await collection.find(filterQuery).skip(skip).limit(pageSize).toArray();
    }

    // Optimize count query
    const totalItems = await collection.countDocuments(filterQuery); // Count with filter
    const totalPages = Math.ceil(totalItems / pageSize);

    // Return metadata and data
    return {
      metadata: {
        currentPage,
        totalPages,
        totalItems,
        pageSize
      },
      data: items
    };
  } catch (error) {
    console.error('Error fetching paginated data:', error);
    throw new Error('Internal Server Error');
  }
}

module.exports = { getPaginatedData };
