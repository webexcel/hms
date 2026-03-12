function paginate(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function getPagination(page, size) {
  const limit = size ? +size : 20;
  const p = page ? +page : 1;
  const offset = (p - 1) * limit;
  return { limit, offset };
}

function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

function getPagingData(result, page, limit) {
  const { count: total, rows: data } = result;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(total / limit);
  return { data, pagination: { total, page: currentPage, limit, totalPages } };
}

module.exports = { paginate, paginatedResponse, getPagination, getPagingData };
